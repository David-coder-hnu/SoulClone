from app.ai.llm_client import llm_client


VALIDATION_PROMPT = """你是一个AI人格验证器。你需要验证以下system prompt是否能准确代表目标用户。

System Prompt:
{system_prompt}

请回答以下验证问题，输出JSON格式:
{{
  "consistency_score": 85,
  "safety_score": 90,
  "plausibility_score": 88,
  "issues": ["可能过于热情", "缺少对冲突场景的处理"],
  "recommendations": ["增加冷静期的描述", "补充对敏感话题的回避策略"]
}}

只输出JSON。"""


class DistillationValidator:
    async def validate(self, system_prompt: str) -> dict:
        prompt = VALIDATION_PROMPT.format(system_prompt=system_prompt)
        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=800,
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
