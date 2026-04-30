"""
AI utilities — safe JSON parsing, text extraction, token budgeting.
"""

from __future__ import annotations

import json
import re
from typing import Callable, Awaitable

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)


# ---------------------------------------------------------------------------
# Safe JSON parsing
# ---------------------------------------------------------------------------

_JSON_MARKDOWN_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def extract_json_from_markdown(text: str) -> str:
    """Strip markdown fences and return inner JSON text."""
    text = text.strip()
    match = _JSON_MARKDOWN_RE.search(text)
    if match:
        return match.group(1).strip()
    # Fallback: if the whole text starts/ends with backticks
    if text.startswith("```"):
        text = text[3:]
    if text.startswith("json"):
        text = text[4:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def safe_parse_json(
    raw_text: str,
    *,
    required_keys: list[str] | None = None,
    default: dict | None = None,
) -> dict:
    """
    Robustly parse JSON from LLM output.

    1. Extract from markdown fences
    2. Parse JSON
    3. Ensure required top-level keys exist (empty dict fallback)
    4. Return default on total failure
    """
    text = extract_json_from_markdown(raw_text)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        # Try even more aggressive cleanup: find first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                parsed = json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                parsed = default if default is not None else {}
        else:
            parsed = default if default is not None else {}

    if not isinstance(parsed, dict):
        parsed = default if default is not None else {}

    if required_keys:
        for key in required_keys:
            parsed.setdefault(key, {})

    return parsed


# ---------------------------------------------------------------------------
# PII redaction
# ---------------------------------------------------------------------------

_PII_PATTERNS = [
    (re.compile(r"1[3-9]\d{9}"), "[PHONE]"),  # Chinese mobile
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), "[EMAIL]"),
    (re.compile(r"\d{17}[\dXx]|\d{15}"), "[IDCARD]"),  # Chinese ID
    (re.compile(r"\d{4}[年/-]\d{1,2}[月/-]\d{1,2}[日]?"), "[DATE]"),
]


def redact_pii(text: str) -> str:
    """Redact common PII patterns from text."""
    if not text:
        return text
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def redact_chat_samples(samples: list[str]) -> list[str]:
    """Redact PII from all chat samples."""
    return [redact_pii(s) for s in samples]


async def safe_parse_json_with_retry(
    raw_text: str,
    *,
    required_keys: list[str] | None = None,
    default: dict | None = None,
    retry_fn: Callable[[], Awaitable[str]] | None = None,
    max_retry: int = 2,
) -> dict:
    """Parse JSON with optional async retry on failure."""
    result = safe_parse_json(raw_text, required_keys=required_keys, default=default)

    # If we got an empty/default dict and have a retry function, try again
    if retry_fn is not None and result == (default or {}):
        for _ in range(max_retry):
            try:
                new_text = await retry_fn()
                result = safe_parse_json(
                    new_text, required_keys=required_keys, default=default
                )
                if result != (default or {}):
                    break
            except Exception:
                continue

    return result


# ---------------------------------------------------------------------------
# Chat sample truncation for token budget
# ---------------------------------------------------------------------------

def truncate_chat_samples(
    samples: list[str],
    max_chars: int = 8000,
    strategy: str = "head_tail_mid_sample",
) -> list[str]:
    """
    Truncate chat samples to fit within a character budget.

    Strategies:
    - "head_tail": keep first and last samples, drop middle
    - "head_tail_mid_sample": keep first, last, and uniformly sample from middle
    - "uniform": uniformly sample across all samples
    """
    if not samples:
        return []

    total = sum(len(s) for s in samples)
    if total <= max_chars:
        return samples

    if strategy == "head_tail":
        # Keep adding from head and tail until budget exhausted
        result = []
        left, right = 0, len(samples) - 1
        current_chars = 0
        while left <= right and current_chars < max_chars:
            if left == right:
                candidate = samples[left]
                if current_chars + len(candidate) <= max_chars:
                    result.append(candidate)
                break
            # Try left
            l_candidate = samples[left]
            if current_chars + len(l_candidate) <= max_chars:
                result.insert(len(result) // 2, l_candidate)
                current_chars += len(l_candidate)
                left += 1
            else:
                break
            # Try right
            if left <= right:
                r_candidate = samples[right]
                if current_chars + len(r_candidate) <= max_chars:
                    result.insert((len(result) + 1) // 2, r_candidate)
                    current_chars += len(r_candidate)
                    right -= 1
        return result

    if strategy == "head_tail_mid_sample":
        if len(samples) <= 3:
            return truncate_chat_samples(samples, max_chars, "head_tail")
        first, last = samples[0], samples[-1]
        budget = max_chars - len(first) - len(last)
        if budget <= 0:
            return [first] if len(first) <= max_chars else []
        middle = samples[1:-1]
        # Uniformly sample from middle
        step = max(1, len(middle) // max(1, budget // 500))
        sampled = middle[::step]
        sampled_chars = sum(len(s) for s in sampled)
        while sampled and sampled_chars > budget:
            sampled.pop(len(sampled) // 2)
            sampled_chars = sum(len(s) for s in sampled)
        return [first] + sampled + [last]

    if strategy == "uniform":
        # Greedy uniform sampling
        if len(samples) == 0:
            return []
        step = max(1, len(samples) // max(1, max_chars // 500))
        sampled = samples[::step]
        while sum(len(s) for s in sampled) > max_chars and len(sampled) > 1:
            sampled.pop(len(sampled) // 2)
        return sampled

    return truncate_chat_samples(samples, max_chars, "head_tail")


# ---------------------------------------------------------------------------
# Retry decorator factory for LLM calls
# ---------------------------------------------------------------------------

def llm_retry(**kwargs):
    """Default retry config for LLM API calls."""
    defaults = dict(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((TimeoutError, ConnectionError)),
        reraise=True,
    )
    defaults.update(kwargs)
    return retry(**defaults)
