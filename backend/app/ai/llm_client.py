import os
from typing import AsyncGenerator

import openai
import httpx
from anthropic import AsyncAnthropic

from app.config import settings


class LLMClient:
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

    async def chat_completion(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        model = model or settings.DEFAULT_LLM_MODEL

        if "claude" in model.lower() and self.anthropic_client:
            return await self._claude_completion(messages, model, temperature, max_tokens, stream)
        elif self.openai_client:
            return await self._openai_completion(messages, model, temperature, max_tokens, stream)
        else:
            raise RuntimeError("No LLM API key configured")

    async def _openai_completion(self, messages, model, temperature, max_tokens, stream):
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

    async def _claude_completion(self, messages, model, temperature, max_tokens, stream):
        # Convert OpenAI format to Anthropic format
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


llm_client = LLMClient()
