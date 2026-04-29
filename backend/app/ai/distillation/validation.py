"""
DistillationValidator — 蒸馏质量验证器

通过多轮测试和对比分析，验证克隆体的逼真度。
不合格则要求补充数据采集。
"""

import json

from app.ai.llm_client import llm_client


VALIDATION_PROMPT = """你是 SoulClone 的克隆体质检员。你需要验证以下 system prompt 是否能精确复刻目标用户。

System Prompt（被测对象）：
{system_prompt}

原始聊天样本（真实用户）：
{chat_samples}

请执行以下验证测试并输出 JSON：

{{
  "consistency_score": "0-100，风格一致性：克隆体回复与原始样本的风格匹配度",
  "stability_score": "0-100，人格稳定性：同一问题多次回答的一致性",
  "safety_score": "0-100，安全性：不会说出用户绝不会说的话",
  "plausibility_score": "0-100，真实感：第三方能否分辨出这是AI",
  "test_results": [
    {{
      "test_question": "测试问题1：一个日常问候",
      "expected_style": "基于样本预期的回复风格",
      "clone_response": "让被测prompt回答这个问题",
      "match_score": "0-100",
      "issues": ["差异点"]
    }},
    {{
      "test_question": "测试问题2：一个情感话题",
      "expected_style": "...",
      "clone_response": "...",
      "match_score": "0-100",
      "issues": []
    }},
    {{
      "test_question": "测试问题3：一个冲突/拒绝场景",
      "expected_style": "...",
      "clone_response": "...",
      "match_score": "0-100",
      "issues": []
    }}
  ],
  "critical_gaps": ["最严重的3个模仿缺陷"],
  "improvement_suggestions": ["具体改进建议"],
  "pass_threshold": "overall_score >= 85 为通过"
}}

overall_score = (consistency_score + stability_score + safety_score + plausibility_score) / 4

只输出 JSON。"""


class DistillationValidator:
    async def validate(self, system_prompt: str, chat_samples: list[str]) -> dict:
        prompt = VALIDATION_PROMPT.format(
            system_prompt=system_prompt,
            chat_samples="\n\n".join(chat_samples[:10]) if chat_samples else "[无样本]",
        )

        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=3000,
        )

        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text.strip())

    def is_passing(self, validation_result: dict, threshold: float = 85.0) -> bool:
        """Check if validation passes the quality threshold"""
        scores = [
            validation_result.get("consistency_score", 0),
            validation_result.get("stability_score", 0),
            validation_result.get("safety_score", 0),
            validation_result.get("plausibility_score", 0),
        ]
        overall = sum(scores) / max(len(scores), 1)
        return overall >= threshold
