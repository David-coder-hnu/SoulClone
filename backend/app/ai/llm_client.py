from __future__ import annotations

import asyncio
import inspect
import time
import uuid
from collections.abc import AsyncGenerator, Awaitable, Callable
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import anthropic
import openai

from app.config import settings


@dataclass(frozen=True)
class GenerationRequest:
    messages: list[dict[str, Any]]
    model: str | None = None
    fallback_models: tuple[str, ...] = ()
    temperature: float = 0.7
    max_tokens: int = 2000
    task_type: str = "chat"
    user_id: str | None = None
    track_usage: bool = True
    trace_id: uuid.UUID = field(default_factory=uuid.uuid4)


@dataclass(frozen=True)
class GenerationUsage:
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


@dataclass(frozen=True)
class GenerationResult:
    content: str
    provider: str
    model: str
    trace_id: uuid.UUID
    request_id: str | None
    usage: GenerationUsage
    estimated_cost_usd: Decimal | None
    attempt_count: int


class LLMGatewayError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        code: str,
        trace_id: uuid.UUID,
        attempt_count: int,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.trace_id = trace_id
        self.attempt_count = attempt_count


class _EmptyResponseError(RuntimeError):
    pass


@dataclass(frozen=True)
class _Failure:
    code: str
    retryable: bool
    fallback_allowed: bool
    message: str


@dataclass(frozen=True)
class _ProviderOutput:
    content: str
    usage: GenerationUsage
    request_id: str | None


class LLMGateway:
    """Single boundary for model routing, retries, fallback, and observability."""

    def __init__(
        self,
        *,
        openai_client: Any | None = None,
        anthropic_client: Any | None = None,
        fallback_models: list[str] | None = None,
        timeout_seconds: float | None = None,
        max_attempts_per_model: int | None = None,
        retry_base_seconds: float | None = None,
        cost_rates: dict[str, dict[str, float]] | None = None,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        self._injected_clients = {
            "openai": openai_client,
            "anthropic": anthropic_client,
        }
        self.fallback_models = (
            fallback_models
            if fallback_models is not None
            else settings.llm_fallback_models_list
        )
        self.timeout_seconds = max(
            0.1, timeout_seconds or settings.LLM_TIMEOUT_SECONDS
        )
        self.max_attempts_per_model = max(
            1,
            max_attempts_per_model or settings.LLM_MAX_ATTEMPTS_PER_MODEL,
        )
        self.retry_base_seconds = max(
            0,
            (
                retry_base_seconds
                if retry_base_seconds is not None
                else settings.LLM_RETRY_BASE_SECONDS
            ),
        )
        self.cost_rates = (
            cost_rates if cost_rates is not None else settings.llm_model_costs
        )
        self._sleep = sleep

    async def generate(self, request: GenerationRequest) -> GenerationResult:
        candidates = self._model_candidates(request)
        clients: dict[str, tuple[Any, bool]] = {}
        attempt_count = 0
        last_failure = _Failure(
            code="provider_unavailable",
            retryable=False,
            fallback_allowed=True,
            message="No LLM provider is configured",
        )

        try:
            for candidate in candidates:
                provider, model = self._route_model(candidate)
                for model_attempt in range(self.max_attempts_per_model):
                    attempt_count += 1
                    started = time.perf_counter()
                    try:
                        output = await asyncio.wait_for(
                            self._generate_with_provider(
                                provider,
                                model,
                                request,
                                clients,
                            ),
                            timeout=self.timeout_seconds,
                        )
                        if not output.content.strip():
                            raise _EmptyResponseError("Provider returned empty content")
                    except Exception as exc:
                        failure = self._classify_error(exc)
                        last_failure = failure
                        if request.track_usage:
                            await self._log_attempt(
                                request=request,
                                provider=provider,
                                model=model,
                                attempt_count=attempt_count,
                                duration_ms=self._duration_ms(started),
                                success=False,
                                error_code=failure.code,
                                error=failure.message,
                            )
                        if (
                            failure.retryable
                            and model_attempt + 1 < self.max_attempts_per_model
                        ):
                            delay = self.retry_base_seconds * (2**model_attempt)
                            await self._sleep(delay)
                            continue
                        break

                    cost = self._estimate_cost(model, output.usage)
                    if request.track_usage:
                        await self._log_attempt(
                            request=request,
                            provider=provider,
                            model=model,
                            attempt_count=attempt_count,
                            duration_ms=self._duration_ms(started),
                            success=True,
                            output=output,
                            estimated_cost_usd=cost,
                        )
                    return GenerationResult(
                        content=output.content,
                        provider=provider,
                        model=model,
                        trace_id=request.trace_id,
                        request_id=output.request_id,
                        usage=output.usage,
                        estimated_cost_usd=cost,
                        attempt_count=attempt_count,
                    )

                if not last_failure.fallback_allowed:
                    break
        finally:
            await self._close_owned_clients(clients)

        raise LLMGatewayError(
            last_failure.message,
            code=last_failure.code,
            trace_id=request.trace_id,
            attempt_count=attempt_count,
        )

    async def chat_completion(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
        *,
        track_usage: bool = True,
        task_type: str = "chat",
        user_id: str | None = None,
        trace_id: str | uuid.UUID | None = None,
        fallback_models: list[str] | None = None,
    ) -> str | AsyncGenerator[str, None]:
        """Compatibility facade used by existing distillation and chat modules."""
        if stream:
            return self._stream_completion(
                messages=messages,
                model=model or settings.DEFAULT_LLM_MODEL,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        request = GenerationRequest(
            messages=messages,
            model=model,
            fallback_models=tuple(fallback_models or ()),
            temperature=temperature,
            max_tokens=max_tokens,
            task_type=task_type,
            user_id=user_id,
            track_usage=track_usage,
            trace_id=self._as_trace_id(trace_id),
        )
        result = await self.generate(request)
        return result.content

    async def chat_completion_json(
        self,
        messages: list[dict[str, Any]],
        *,
        required_keys: list[str] | None = None,
        max_retry_parse: int = 2,
        **kwargs,
    ) -> dict:
        from app.ai.utils import safe_parse_json_with_retry

        raw = await self.chat_completion(
            messages,
            temperature=kwargs.get("temperature", 0.3),
            max_tokens=kwargs.get("max_tokens", 2000),
            task_type=kwargs.get("task_type", "json_extraction"),
            user_id=kwargs.get("user_id"),
            trace_id=kwargs.get("trace_id"),
        )
        if not isinstance(raw, str):
            raise RuntimeError("Streaming not supported for JSON extraction")

        async def retry_parse() -> str:
            retried = await self.chat_completion(
                messages,
                temperature=kwargs.get("temperature", 0.3),
                max_tokens=kwargs.get("max_tokens", 2000),
                task_type=kwargs.get("task_type", "json_extraction_retry"),
                user_id=kwargs.get("user_id"),
                trace_id=kwargs.get("trace_id"),
            )
            if not isinstance(retried, str):
                raise RuntimeError("Streaming not supported")
            return retried

        return await safe_parse_json_with_retry(
            raw,
            required_keys=required_keys,
            default={},
            retry_fn=retry_parse if max_retry_parse > 0 else None,
            max_retry=max_retry_parse,
        )

    async def embeddings(
        self,
        texts: list[str],
        *,
        model: str = "text-embedding-3-small",
        task_type: str = "embedding",
        user_id: str | None = None,
        trace_id: str | uuid.UUID | None = None,
    ) -> list[list[float]]:
        clients: dict[str, tuple[Any, bool]] = {}
        request = GenerationRequest(
            messages=[],
            model=model,
            task_type=task_type,
            user_id=user_id,
            trace_id=self._as_trace_id(trace_id),
        )
        last_failure = _Failure(
            "provider_unavailable", False, False, "Embedding provider unavailable"
        )
        try:
            for attempt in range(1, self.max_attempts_per_model + 1):
                started = time.perf_counter()
                try:
                    client = self._get_client("openai", clients)
                    response = await asyncio.wait_for(
                        client.embeddings.create(
                            model=model,
                            input=[text[:8000] for text in texts],
                        ),
                        timeout=self.timeout_seconds,
                    )
                except Exception as exc:
                    last_failure = self._classify_error(exc)
                    await self._log_attempt(
                        request=request,
                        provider="openai",
                        model=model,
                        attempt_count=attempt,
                        duration_ms=self._duration_ms(started),
                        success=False,
                        error_code=last_failure.code,
                        error=last_failure.message,
                    )
                    if last_failure.retryable and attempt < self.max_attempts_per_model:
                        await self._sleep(self.retry_base_seconds * (2 ** (attempt - 1)))
                        continue
                    break

                response_usage = getattr(response, "usage", None)
                usage = GenerationUsage(
                    prompt_tokens=(
                        getattr(response_usage, "prompt_tokens", None)
                        if response_usage
                        else None
                    ),
                    completion_tokens=0,
                    total_tokens=(
                        getattr(response_usage, "total_tokens", None)
                        if response_usage
                        else None
                    ),
                )
                output = _ProviderOutput(
                    content="",
                    usage=usage,
                    request_id=getattr(response, "_request_id", None)
                    or getattr(response, "id", None),
                )
                await self._log_attempt(
                    request=request,
                    provider="openai",
                    model=model,
                    attempt_count=attempt,
                    duration_ms=self._duration_ms(started),
                    success=True,
                    output=output,
                    estimated_cost_usd=self._estimate_cost(model, usage),
                )
                return [item.embedding for item in response.data]
        finally:
            await self._close_owned_clients(clients)

        raise LLMGatewayError(
            last_failure.message,
            code=last_failure.code,
            trace_id=request.trace_id,
            attempt_count=self.max_attempts_per_model,
        )

    async def _generate_with_provider(
        self,
        provider: str,
        model: str,
        request: GenerationRequest,
        clients: dict[str, tuple[Any, bool]],
    ) -> _ProviderOutput:
        client = self._get_client(provider, clients)
        if provider == "anthropic":
            system, messages = self._anthropic_messages(request.messages)
            response = await client.messages.create(
                model=model,
                system=system,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=False,
            )
            usage = GenerationUsage(
                prompt_tokens=getattr(response.usage, "input_tokens", None),
                completion_tokens=getattr(response.usage, "output_tokens", None),
            )
            usage = self._with_total(usage)
            content = "".join(
                block.text
                for block in response.content
                if getattr(block, "type", None) == "text"
            )
            return _ProviderOutput(
                content=content,
                usage=usage,
                request_id=getattr(response, "_request_id", None)
                or getattr(response, "id", None),
            )

        response = await client.chat.completions.create(
            model=model,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=False,
        )
        response_usage = getattr(response, "usage", None)
        usage = GenerationUsage(
            prompt_tokens=(
                getattr(response_usage, "prompt_tokens", None)
                if response_usage
                else None
            ),
            completion_tokens=(
                getattr(response_usage, "completion_tokens", None)
                if response_usage
                else None
            ),
            total_tokens=(
                getattr(response_usage, "total_tokens", None)
                if response_usage
                else None
            ),
        )
        return _ProviderOutput(
            content=response.choices[0].message.content or "",
            usage=usage,
            request_id=getattr(response, "_request_id", None)
            or getattr(response, "id", None),
        )

    def _get_client(
        self,
        provider: str,
        clients: dict[str, tuple[Any, bool]],
    ) -> Any:
        if provider in clients:
            return clients[provider][0]
        injected = self._injected_clients[provider]
        if injected is not None:
            clients[provider] = (injected, False)
            return injected

        if provider == "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                raise RuntimeError("Anthropic API key is not configured")
            client = anthropic.AsyncAnthropic(
                api_key=settings.ANTHROPIC_API_KEY,
                max_retries=0,
            )
        else:
            if not settings.OPENAI_API_KEY:
                raise RuntimeError("OpenAI API key is not configured")
            client = openai.AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL or None,
                max_retries=0,
            )
        clients[provider] = (client, True)
        return client

    async def _close_owned_clients(
        self, clients: dict[str, tuple[Any, bool]]
    ) -> None:
        for client, owned in clients.values():
            if not owned:
                continue
            close = getattr(client, "close", None)
            if close is None:
                continue
            result = close()
            if inspect.isawaitable(result):
                await result

    def _model_candidates(self, request: GenerationRequest) -> list[str]:
        raw = [
            request.model or settings.DEFAULT_LLM_MODEL,
            *request.fallback_models,
            *self.fallback_models,
        ]
        return list(dict.fromkeys(model for model in raw if model))

    @staticmethod
    def _route_model(model: str) -> tuple[str, str]:
        if "/" in model:
            prefix, raw_model = model.split("/", 1)
            if prefix in {"openai", "anthropic"}:
                return prefix, raw_model
        provider = "anthropic" if "claude" in model.lower() else "openai"
        return provider, model

    @staticmethod
    def _anthropic_messages(
        messages: list[dict[str, Any]],
    ) -> tuple[str, list[dict[str, Any]]]:
        system_parts = [
            str(message["content"])
            for message in messages
            if message.get("role") == "system"
        ]
        conversation = [
            {"role": message["role"], "content": message["content"]}
            for message in messages
            if message.get("role") != "system"
        ]
        return "\n".join(system_parts), conversation

    @staticmethod
    def _classify_error(exc: Exception) -> _Failure:
        message = str(exc)[:1000] or exc.__class__.__name__
        if isinstance(
            exc,
            (
                TimeoutError,
                asyncio.TimeoutError,
                openai.APITimeoutError,
                anthropic.APITimeoutError,
            ),
        ):
            return _Failure("timeout", True, True, message)
        if isinstance(exc, (openai.RateLimitError, anthropic.RateLimitError)):
            return _Failure("rate_limited", True, True, message)
        if isinstance(exc, _EmptyResponseError):
            return _Failure("empty_response", True, True, message)
        if isinstance(exc, (openai.APIStatusError, anthropic.APIStatusError)):
            status_code = getattr(exc, "status_code", 0)
            if status_code >= 500:
                return _Failure("provider_unavailable", True, True, message)
        if isinstance(
            exc,
            (
                ConnectionError,
                openai.APIConnectionError,
                anthropic.APIConnectionError,
                openai.InternalServerError,
                anthropic.InternalServerError,
            ),
        ):
            return _Failure("provider_unavailable", True, True, message)
        if isinstance(
            exc,
            (
                openai.AuthenticationError,
                openai.PermissionDeniedError,
                anthropic.AuthenticationError,
                anthropic.PermissionDeniedError,
            ),
        ):
            return _Failure("provider_auth_failed", False, True, message)
        if isinstance(
            exc,
            (
                openai.NotFoundError,
                anthropic.NotFoundError,
            ),
        ):
            return _Failure("model_unavailable", False, True, message)
        if isinstance(
            exc,
            (
                openai.BadRequestError,
                openai.UnprocessableEntityError,
                anthropic.BadRequestError,
                anthropic.UnprocessableEntityError,
            ),
        ):
            return _Failure("invalid_request", False, False, message)
        if isinstance(exc, RuntimeError) and "not configured" in message:
            return _Failure("provider_not_configured", False, True, message)
        return _Failure("provider_error", False, True, message)

    def _estimate_cost(
        self,
        model: str,
        usage: GenerationUsage,
    ) -> Decimal | None:
        rates = self.cost_rates.get(model)
        if not rates:
            return None
        prompt_tokens = usage.prompt_tokens or 0
        completion_tokens = usage.completion_tokens or 0
        cost = (
            Decimal(prompt_tokens) * Decimal(str(rates.get("input", 0)))
            + Decimal(completion_tokens) * Decimal(str(rates.get("output", 0)))
        ) / Decimal(1_000_000)
        return cost.quantize(Decimal("0.000001"))

    async def _log_attempt(
        self,
        *,
        request: GenerationRequest,
        provider: str,
        model: str,
        attempt_count: int,
        duration_ms: int,
        success: bool,
        output: _ProviderOutput | None = None,
        estimated_cost_usd: Decimal | None = None,
        error_code: str | None = None,
        error: str | None = None,
    ) -> None:
        try:
            from app.db.session import async_session
            from app.models.llm_usage_log import LLMUsageLog

            usage = output.usage if output else GenerationUsage()
            async with async_session() as db:
                db.add(
                    LLMUsageLog(
                        user_id=(uuid.UUID(request.user_id) if request.user_id else None),
                        task_type=request.task_type[:30],
                        provider=provider,
                        model=model,
                        trace_id=request.trace_id,
                        request_id=output.request_id if output else None,
                        prompt_tokens=usage.prompt_tokens,
                        completion_tokens=usage.completion_tokens,
                        estimated_cost_usd=estimated_cost_usd,
                        attempt_count=attempt_count,
                        duration_ms=duration_ms,
                        success=success,
                        error_code=error_code,
                        error=error,
                    )
                )
                await db.commit()
        except Exception:
            # Observability must never break model delivery.
            return

    def _stream_completion(
        self,
        *,
        messages: list[dict[str, Any]],
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        async def generate_stream() -> AsyncGenerator[str, None]:
            clients: dict[str, tuple[Any, bool]] = {}
            provider, routed_model = self._route_model(model)
            try:
                client = self._get_client(provider, clients)
                if provider == "anthropic":
                    system, provider_messages = self._anthropic_messages(messages)
                    stream = await client.messages.create(
                        model=routed_model,
                        system=system,
                        messages=provider_messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                    )
                    async for chunk in stream:
                        if getattr(chunk, "type", None) == "content_block_delta":
                            yield chunk.delta.text
                else:
                    stream = await client.chat.completions.create(
                        model=routed_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                    )
                    async for chunk in stream:
                        content = chunk.choices[0].delta.content
                        if content:
                            yield content
            finally:
                await self._close_owned_clients(clients)

        return generate_stream()

    @staticmethod
    def _with_total(usage: GenerationUsage) -> GenerationUsage:
        total = None
        if usage.prompt_tokens is not None or usage.completion_tokens is not None:
            total = (usage.prompt_tokens or 0) + (usage.completion_tokens or 0)
        return GenerationUsage(
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            total_tokens=total,
        )

    @staticmethod
    def _duration_ms(started: float) -> int:
        return int((time.perf_counter() - started) * 1000)

    @staticmethod
    def _as_trace_id(value: str | uuid.UUID | None) -> uuid.UUID:
        if value is None:
            return uuid.uuid4()
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))


# Existing modules import this name; the instance is now a real Gateway.
llm_client = LLMGateway()
LLMClient = LLMGateway
