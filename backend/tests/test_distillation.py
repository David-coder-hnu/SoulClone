import os
import pytest
from app.ai.distillation.persona_distiller import PersonaDistiller


@pytest.mark.asyncio
async def test_persona_distiller_mock():
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OPENAI_API_KEY not set")
    distiller = PersonaDistiller()
    result = await distiller.distill(
        questionnaire={"values": "freedom"},
        chat_samples=["hello", "how are you"],
        social_import=None,
    )
    assert "persona_core" in result
    assert "chat_dna" in result
