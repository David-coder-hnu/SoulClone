"""
Calibration API — Persistent user calibration mechanism.

Allows users to test and refine the clone's reply style.
Test records and refinements are persisted for version history.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.dependencies import get_db, get_current_user_id
from app.ai.llm_client import llm_client
from app.ai.clone_engine.response_generator import ResponseGenerator
from app.ai.utils import safe_parse_json
from app.models.clone_profile import CloneProfile
from app.models.calibration_test import CalibrationTest
from app.models.calibration_refinement import CalibrationRefinement

router = APIRouter()


class CalibrationTestRequest(BaseModel):
    scenario: str
    conversation_context: list[dict] | None = None


class CalibrationFeedbackRequest(BaseModel):
    scenario: str
    generated_response: str
    user_response: str
    issues: list[str] | None = None


class CalibrationRefineRequest(BaseModel):
    test_results: list[CalibrationFeedbackRequest]


@router.post("/test")
async def test_generated_response(
    req: CalibrationTestRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Test how the online state would respond to a given scenario."""
    result = await db.execute(
        select(CloneProfile).where(CloneProfile.user_id == user_id)
    )
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
    """Submit user feedback on generated response vs real response."""
    import uuid

    result = await db.execute(
        select(CloneProfile).where(CloneProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return {"error": "No clone profile found."}

    analysis = await _analyze_gap(req.scenario, req.generated_response, req.user_response)

    # Persist test record
    test_record = CalibrationTest(
        user_id=uuid.UUID(user_id),
        profile_version=profile.version,
        scenario=req.scenario,
        generated_response=req.generated_response,
        user_response=req.user_response,
        analysis=analysis,
    )
    db.add(test_record)
    await db.commit()

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
    """Refine the system prompt based on multiple calibration tests and persist."""
    import uuid

    result = await db.execute(
        select(CloneProfile).where(CloneProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return {"error": "No clone profile found."}

    refinement = await _generate_refinement(
        profile.system_prompt,
        req.test_results,
    )

    refined_prompt = refinement.get("refined_prompt", profile.system_prompt)

    # Persist refinement record
    refinement_record = CalibrationRefinement(
        user_id=uuid.UUID(user_id),
        profile_version=profile.version,
        previous_prompt=profile.system_prompt,
        refined_prompt=refined_prompt,
        changes_made=refinement.get("changes_made", []),
        confidence=refinement.get("confidence", 0),
    )
    db.add(refinement_record)

    # Actually update the profile
    profile.system_prompt = refined_prompt
    profile.version += 1
    await db.commit()

    return {
        "refined_prompt": refined_prompt,
        "changes_made": refinement.get("changes_made", []),
        "confidence": refinement.get("confidence", 0),
        "new_version": profile.version,
    }


@router.get("/history")
async def get_calibration_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get calibration test history for the user."""
    import uuid

    result = await db.execute(
        select(CalibrationTest)
        .where(CalibrationTest.user_id == uuid.UUID(user_id))
        .order_by(desc(CalibrationTest.created_at))
        .limit(limit)
    )
    tests = result.scalars().all()

    refinements_result = await db.execute(
        select(CalibrationRefinement)
        .where(CalibrationRefinement.user_id == uuid.UUID(user_id))
        .order_by(desc(CalibrationRefinement.created_at))
        .limit(limit)
    )
    refinements = refinements_result.scalars().all()

    return {
        "tests": [
            {
                "id": str(t.id),
                "scenario": t.scenario,
                "overall_match": t.analysis.get("overall_match", 0) if t.analysis else 0,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tests
        ],
        "refinements": [
            {
                "id": str(r.id),
                "version": r.profile_version,
                "confidence": r.confidence,
                "changes_count": len(r.changes_made or []),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in refinements
        ],
    }


async def _analyze_gap(scenario: str, generated_response: str, user_response: str) -> dict:
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
        task_type="calibration_analysis",
    )
    return safe_parse_json(response, default={})


async def _generate_refinement(current_prompt: str, test_results: list) -> dict:
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
        task_type="calibration_refinement",
    )
    return safe_parse_json(response, default={})
