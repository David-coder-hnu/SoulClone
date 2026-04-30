from __future__ import annotations

import time
from typing import AsyncGenerator

import openai
from anthropic import AsyncAnthropic
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.config import settings


# ---------------------------------------------------------------------------
# Retryable errors for LLM APIs
# ---------------------------------------------------------------------------

RETRYABLE_ERRORS = (
    TimeoutError,
    ConnectionError,
    openai.APIConnectionError,
    openai.APITimeoutError,
    openai.RateLimitError,
    openai.InternalServerError,
)


class LLMClient:
    def __init__(self):
        self.openai_client = (
            openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            if settings.OPENAI_API_KEY
            else None
        )
        self.anthropic_client = (
            AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            if settings.ANTHROPIC_API_KEY
            else None
        )

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(RETRYABLE_ERRORS),
        reraise=True,
    )
    async def chat_completion(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
        *,
        track_usage: bool = True,
        task_type: str = "chat",
        user_id: str | None = None,
    ) -> str | AsyncGenerator[str, None]:
        """
        Unified LLM chat completion with retry, usage tracking, and cost logging.

        Args:
            track_usage: If True, logs token usage to the database.
            task_type: Categorizes the LLM call (distillation/validation/chat/memory/etc).
            user_id: Optional user ID for usage attribution.
        """
        model = model or settings.DEFAULT_LLM_MODEL
        start_time = time.perf_counter()
        usage_data: dict | None = None
        error_msg: str | None = None
        success = False

        try:
            if "claude" in model.lower() and self.anthropic_client:
                result = await self._claude_completion(
                    messages, model, temperature, max_tokens, stream
                )
            elif self.openai_client:
                result = await self._openai_completion(
                    messages, model, temperature, max_tokens, stream
                )
            else:
                raise RuntimeError("No LLM API key configured")
            success = True
            return result
        except Exception as exc:
            error_msg = str(exc)
            raise
        finally:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            if track_usage:
                await self._log_usage(
                    user_id=user_id,
                    task_type=task_type,
                    model=model,
                    usage_data=usage_data,
                    duration_ms=duration_ms,
                    success=success,
                    error=error_msg,
                )

    async def chat_completion_json(
        self,
        messages: list[dict],
        *,
        required_keys: list[str] | None = None,
        max_retry_parse: int = 2,
        **kwargs,
    ) -> dict:
        """
        Convenience wrapper that returns parsed JSON with automatic retry on parse failure.
        """
        from app.ai.utils import safe_parse_json_with_retry

        raw = await self.chat_completion(
            messages,
            temperature=kwargs.get("temperature", 0.3),
            max_tokens=kwargs.get("max_tokens", 2000),
            task_type=kwargs.get("task_type", "json_extraction"),
            user_id=kwargs.get("user_id"),
        )
        if not isinstance(raw, str):
            raise RuntimeError("Streaming not supported for JSON extraction")

        async def _retry_fn() -> str:
            r = await self.chat_completion(
                messages,
                temperature=kwargs.get("temperature", 0.3),
                max_tokens=kwargs.get("max_tokens", 2000),
                task_type=kwargs.get("task_type", "json_extraction_retry"),
                user_id=kwargs.get("user_id"),
            )
            if not isinstance(r, str):
                raise RuntimeError("Streaming not supported")
            return r

        return await safe_parse_json_with_retry(
            raw,
            required_keys=required_keys,
            default={},
            retry_fn=_retry_fn if max_retry_parse > 0 else None,
            max_retry=max_retry_parse,
        )

    # -----------------------------------------------------------------------
    # Provider-specific implementations
    # -----------------------------------------------------------------------

    async def _openai_completion(
        self, messages, model, temperature, max_tokens, stream
    ):
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
        )
        if stream:
            async def gen():
                async for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            return gen()
        return response.choices[0].message.content

    async def _claude_completion(
        self, messages, model, temperature, max_tokens, stream
    ):
        system_msg = ""
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg += msg["content"] + "\n"
            else:
                user_messages.append({"role": msg["role"], "content": msg["content"]})

        response = await self.anthropic_client.messages.create(
            model=model,
            system=system_msg,
            messages=user_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
        )
        if stream:
            async def gen():
                async for chunk in response:
                    if chunk.type == "content_block_delta":
                        yield chunk.delta.text
            return gen()
        return response.content[0].text

    # -----------------------------------------------------------------------
    # Usage logging (best-effort, non-blocking)
    # -----------------------------------------------------------------------

    async def _log_usage(
        self,
        *,
        user_id: str | None,
        task_type: str,
        model: str,
        usage_data: dict | None,
        duration_ms: int,
        success: bool,
        error: str | None,
    ) -> None:
        """Fire-and-forget usage log.  Exceptions are swallowed."""
        try:
            import uuid
            from sqlalchemy.ext.asyncio import AsyncSession
            from app.db.session import async_session as async_session_maker
            from app.models.llm_usage_log import LLMUsageLog

            async with async_session_maker() as db:
                log = LLMUsageLog(
                    user_id=uuid.UUID(user_id) if user_id else None,
                    task_type=task_type,
                    model=model,
                    prompt_tokens=usage_data.get("prompt_tokens") if usage_data else None,
                    completion_tokens=usage_data.get("completion_tokens") if usage_data else None,
                    duration_ms=duration_ms,
                    success=success,
                    error=error,
                )
                db.add(log)
                await db.commit()
        except Exception:
            # Logging must never break the main flow
            pass


llm_client = LLMClient()
