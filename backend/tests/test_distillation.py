import pytest
from app.ai.distillation.persona_distiller import PersonaDistiller


@pytest.mark.asyncio
async def test_persona_distiller_mock():
    distiller = PersonaDistiller()
    # Mock the LLM call or skip if no API key
    result = await distiller.distill(
        questionnaire={"values": "freedom"},
        chat_samples=["hello", "how are you"],
        social_import=None,
    )
    assert "persona_core" in result
    assert "chat_dna" in result
