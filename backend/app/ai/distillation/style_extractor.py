import json
import re

from app.ai.llm_client import llm_client


STYLE_EXTRACTION_PROMPT = """分析以下聊天记录，提取发送者的聊天风格特征。

聊天样本:
{samples}

请输出以下JSON格式的分析结果:
{{
  "emoji_frequency": "high/medium/low",
  "favorite_emojis": ["😂", "✨"],
  "avg_message_length": 35,
  "sentence_patterns": ["短句+emoji", "反问句", "长段落"],
  "tone_markers": {{
    "casual": ["哈", "啦", "~"],
    "enthusiastic": ["！", "超", "太"],
    "hesitant": ["嗯", "可能", "吧"]
  }},
  "response_speed": "fast/medium/slow",
  "topic_switching": "frequent/moderate/rare"
}}

只输出JSON。"""


class StyleExtractor:
    async def extract(self, chat_samples: list[str]) -> dict:
        if not chat_samples:
            return {}

        prompt = STYLE_EXTRACTION_PROMPT.format(samples="\n\n".join(chat_samples))
        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )

        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text.strip())
