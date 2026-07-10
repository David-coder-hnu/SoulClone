from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any


class FakeLLMClient:
    """Deterministic LLM client for tests that must not call external APIs."""

    def __init__(self, response: str = "测试回复") -> None:
        self.response = response
        self.calls: list[dict[str, Any]] = []

    async def chat_completion(
        self,
        messages: list[dict[str, Any]],
        **kwargs: Any,
    ) -> str | AsyncGenerator[str, None]:
        self.calls.append({"messages": messages, **kwargs})
        return self.response

    async def chat_completion_json(
        self,
        messages: list[dict[str, Any]],
        **kwargs: Any,
    ) -> dict[str, Any]:
        self.calls.append({"messages": messages, **kwargs})
        return {"response": self.response}
