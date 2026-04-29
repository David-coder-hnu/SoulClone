"""
Calibration API — 用户校准机制

允许用户测试和精调在线状态的回复风格。
用户给出一个场景 → 系统生成回复 → 用户提供"真实回复" → 
系统对比差异并生成精调建议 → 可选地更新 system prompt。
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.ai.llm_client import llm_client
from app.ai.clone_engine.response_generator import ResponseGenerator

router = APIRouter()


class CalibrationTestRequest(BaseModel):
    scenario: str  # 场景描述，如"对方说：今天好累啊，想你了"
    conversation_context: list[dict] | None = None  # 可选的上下文消息


class CalibrationFeedbackRequest(BaseModel):
    scenario: str
    generated_response: str
    user_response: str  # 用户认为的真实回复
    issues: list[str] | None = None  # 用户指出的问题


class CalibrationRefineRequest(BaseModel):
    test_results: list[CalibrationFeedbackRequest]


@router.post("/test")
async def test_generated_response(
    req: CalibrationTestRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Test how the online state would respond to a given scenario"""
    from sqlalchemy import select
    from app.models.clone_profile import CloneProfile

    result = await db.execute(select(CloneProfile).where(CloneProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return {"error": "No clone profile found. Complete onboarding first."}

    generator = ResponseGenerator()
    
    response = await generator.generate(
        system_prompt=profile.system_prompt,
        conversation_history=req.conversation_context or [],
        user_message=req.scenario,
        relationship_context={"intimacy_level": 50},
    )

    return {
        "scenario": req.scenario,
        "generated_response": response,
        "profile_score": float(profile.completion_score),
    }


@router.post("/feedback")
async def submit_calibration_feedback(
    req: CalibrationFeedbackRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Submit user feedback on generated response vs real response"""
    from sqlalchemy import select
    from app.models.clone_profile import CloneProfile

    result = await db.execute(select(CloneProfile).where(CloneProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return {"error": "No clone profile found."}

    # Use LLM to analyze the gap between clone response and user response
    analysis = await _analyze_gap(req.scenario, req.generated_response, req.user_response)

    return {
        "analysis": analysis,
        "suggestions": analysis.get("improvement_suggestions", []),
        "style_gaps": analysis.get("style_gaps", []),
    }


@router.post("/refine")
async def refine_system_prompt(
    req: CalibrationRefineRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Refine the system prompt based on multiple calibration tests"""
    from sqlalchemy import select
    from app.models.clone_profile import CloneProfile

    result = await db.execute(select(CloneProfile).where(CloneProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return {"error": "No clone profile found."}

    # Build refinement prompt from all test results
    refinement = await _generate_refinement(
        profile.system_prompt,
        req.test_results,
    )

    # Optionally update the system prompt
    # profile.system_prompt = refinement.get("refined_prompt", profile.system_prompt)
    # await db.commit()

    return {
        "refined_prompt": refinement.get("refined_prompt", ""),
        "changes_made": refinement.get("changes_made", []),
        "confidence": refinement.get("confidence", 0),
    }


async def _analyze_gap(scenario: str, generated_response: str, user_response: str) -> dict:
    """Use LLM to analyze the stylistic gap between generated and user response"""
    prompt = f"""你是一个风格分析专家。请对比以下两个回复，分析系统生成回复与用户真实回复的差异。

场景：{scenario}

系统生成回复：
{generated_response}

真实回复（用户本人）：
{user_response}

请输出 JSON 格式分析：
{{
  "overall_match": "0-100，整体匹配度",
  "style_gaps": [
    {{
      "dimension": "差异维度（语气/emoji/句式/用词/情感深度/反应速度）",
      "generated_behavior": "系统生成的表现",
      "user_behavior": "用户真实表现",
      "severity": "high/medium/low"
    }}
  ],
  "tone_mismatch": "语气差异的具体描述",
  "vocabulary_mismatch": "用词习惯差异",
  "emotional_mismatch": "情感表达差异",
  "improvement_suggestions": ["具体的改进建议，每条建议要足够具体，可以直接用于修改system prompt"]
}}

只输出 JSON。"""

    response = await llm_client.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=2000,
    )

    import json
    text = response.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())


async def _generate_refinement(current_prompt: str, test_results: list) -> dict:
    """Generate a refined system prompt based on calibration feedback"""
    
    # Build feedback summary
    feedback_summary = []
    for i, tr in enumerate(test_results):
        feedback_summary.append(f"""测试 {i+1}:
场景: {tr.scenario}
系统生成回复: {tr.generated_response}
用户真实回复: {tr.user_response}
用户指出问题: {', '.join(tr.issues or [])}
""")

    feedback_text = '\n---\n'.join(feedback_summary)
    prompt = f"""你是一个 Prompt 精调工程师。基于以下校准测试结果，优化 system prompt。

当前 System Prompt：
{current_prompt}

校准测试结果：
{feedback_text}

请输出 JSON：
{{
  "refined_prompt": "优化后的完整 system prompt",
  "changes_made": ["具体做了哪些修改，每条修改说明原因"],
  "confidence": "0-100，对这次优化的信心程度",
  "warnings": ["需要注意的风险"]
}}

优化原则：
1. 保留原有 prompt 中正确的部分
2. 针对校准测试中发现的差异进行精确修正
3. 添加具体的风格规则（如"不用感叹号"、"每句话不超过15字"等）
4. 添加情感反应的具体示例
5. 不要过度拟合某一次测试，要兼顾通用性

只输出 JSON。"""

    response = await llm_client.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=4000,
    )

    import json
    text = response.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())
