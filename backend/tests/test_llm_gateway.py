from __future__ import annotations

import uuid
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.ai.llm_client import (
    GenerationRequest,
    LLMGateway,
    LLMGatewayError,
)
from app.db.session import async_session
from app.models.llm_usage_log import LLMUsageLog


def _openai_client(*responses):
    create = AsyncMock(side_effect=list(responses))
    return SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=create),
        ),
        embeddings=SimpleNamespace(create=AsyncMock()),
    )


def _openai_response(
    content: str = "primary response",
    *,
    prompt_tokens: int = 100,
    completion_tokens: int = 25,
):
    return SimpleNamespace(
        id="openai-request-1",
        choices=[
            SimpleNamespace(message=SimpleNamespace(content=content)),
        ],
        usage=SimpleNamespace(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
        ),
    )


def _anthropic_client(content: str = "fallback response"):
    response = SimpleNamespace(
        id="anthropic-request-1",
        content=[SimpleNamespace(type="text", text=content)],
        usage=SimpleNamespace(input_tokens=80, output_tokens=20),
    )
    return SimpleNamespace(
        messages=SimpleNamespace(create=AsyncMock(return_value=response)),
    )


@pytest.mark.asyncio
async def test_gateway_returns_structured_usage_trace_and_cost():
    trace_id = uuid.uuid4()
    client = _openai_client(_openai_response())
    gateway = LLMGateway(
        openai_client=client,
        fallback_models=[],
        max_attempts_per_model=1,
        cost_rates={"gpt-test": {"input": 2.5, "output": 10}},
    )
    gateway._log_attempt = AsyncMock()

    result = await gateway.generate(
        GenerationRequest(
            messages=[{"role": "user", "content": "hello"}],
            model="openai/gpt-test",
            trace_id=trace_id,
        )
    )

    assert result.content == "primary response"
    assert result.provider == "openai"
    assert result.model == "gpt-test"
    assert result.trace_id == trace_id
    assert result.request_id == "openai-request-1"
    assert result.usage.prompt_tokens == 100
    assert result.usage.completion_tokens == 25
    assert result.estimated_cost_usd == Decimal("0.000500")
    assert result.attempt_count == 1
    gateway._log_attempt.assert_awaited_once()


@pytest.mark.asyncio
async def test_gateway_retries_then_falls_back_to_another_provider():
    openai_client = _openai_client(TimeoutError("slow"), TimeoutError("slow again"))
    anthropic_client = _anthropic_client()
    sleep = AsyncMock()
    gateway = LLMGateway(
        openai_client=openai_client,
        anthropic_client=anthropic_client,
        fallback_models=["anthropic/claude-test"],
        max_attempts_per_model=2,
        retry_base_seconds=0.01,
        sleep=sleep,
    )
    gateway._log_attempt = AsyncMock()

    result = await gateway.generate(
        GenerationRequest(
            messages=[
                {"role": "system", "content": "persona"},
                {"role": "user", "content": "hello"},
            ],
            model="openai/gpt-test",
        )
    )

    assert result.provider == "anthropic"
    assert result.model == "claude-test"
    assert result.content == "fallback response"
    assert result.attempt_count == 3
    assert openai_client.chat.completions.create.await_count == 2
    sleep.assert_awaited_once_with(0.01)
    anthropic_call = anthropic_client.messages.create.await_args.kwargs
    assert anthropic_call["system"] == "persona"
    assert anthropic_call["messages"] == [
        {"role": "user", "content": "hello"}
    ]
    assert gateway._log_attempt.await_count == 3


@pytest.mark.asyncio
async def test_gateway_exposes_classified_error_and_trace_after_exhaustion():
    trace_id = uuid.uuid4()
    gateway = LLMGateway(
        openai_client=_openai_client(
            TimeoutError("first timeout"),
            TimeoutError("second timeout"),
        ),
        fallback_models=[],
        max_attempts_per_model=2,
        retry_base_seconds=0,
    )
    gateway._log_attempt = AsyncMock()

    with pytest.raises(LLMGatewayError) as error:
        await gateway.generate(
            GenerationRequest(
                messages=[{"role": "user", "content": "hello"}],
                model="gpt-test",
                trace_id=trace_id,
            )
        )

    assert error.value.code == "timeout"
    assert error.value.trace_id == trace_id
    assert error.value.attempt_count == 2


@pytest.mark.asyncio
async def test_gateway_persists_attempt_observability():
    trace_id = uuid.uuid4()
    gateway = LLMGateway(
        openai_client=_openai_client(_openai_response("logged response")),
        fallback_models=[],
        max_attempts_per_model=1,
        cost_rates={"gpt-test": {"input": 1, "output": 2}},
    )

    result = await gateway.generate(
        GenerationRequest(
            messages=[{"role": "user", "content": "hello"}],
            model="gpt-test",
            task_type="gateway_test",
            trace_id=trace_id,
        )
    )

    async with async_session() as db:
        log = (
            await db.execute(
                select(LLMUsageLog).where(LLMUsageLog.trace_id == trace_id)
            )
        ).scalar_one()

    assert result.content == "logged response"
    assert log.provider == "openai"
    assert log.model == "gpt-test"
    assert log.request_id == "openai-request-1"
    assert log.prompt_tokens == 100
    assert log.completion_tokens == 25
    assert log.estimated_cost_usd == Decimal("0.000150")
    assert log.attempt_count == 1
    assert log.success is True
    assert log.error_code is None


@pytest.mark.asyncio
async def test_embedding_calls_share_gateway_timeout_retry_and_usage_path():
    client = _openai_client(_openai_response())
    embedding_response = SimpleNamespace(
        id="embedding-request-1",
        data=[SimpleNamespace(embedding=[0.1, 0.2, 0.3])],
        usage=SimpleNamespace(prompt_tokens=3, total_tokens=3),
    )
    client.embeddings.create = AsyncMock(
        side_effect=[TimeoutError("embedding timeout"), embedding_response]
    )
    sleep = AsyncMock()
    gateway = LLMGateway(
        openai_client=client,
        fallback_models=[],
        max_attempts_per_model=2,
        retry_base_seconds=0.01,
        sleep=sleep,
    )
    gateway._log_attempt = AsyncMock()

    vectors = await gateway.embeddings(["hello"])

    assert vectors == [[0.1, 0.2, 0.3]]
    assert client.embeddings.create.await_count == 2
    sleep.assert_awaited_once_with(0.01)
    assert gateway._log_attempt.await_count == 2
