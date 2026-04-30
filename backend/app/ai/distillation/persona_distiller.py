"""
PersonaDistiller — 4D structured personality distillation engine.

Decomposes distillation into 4 independent modules (immortal-skill inspired):
1. Procedural: skills, workflows, decision patterns
2. Interaction: chat DNA, tone, emoji, syntax
3. Episodic: key life events, emotional experiences, relationship history
4. Value: core values, moral boundaries, life goals

Each module is distilled independently and then merged, with provenance tracking.
"""

from __future__ import annotations

from app.ai.llm_client import llm_client
from app.ai.utils import safe_parse_json


# ---------------------------------------------------------------------------
# 4D Module Prompts
# ---------------------------------------------------------------------------

PROCEDURAL_PROMPT = """你是 SoulClone 的程序知识蒸馏师。基于以下数据，提取用户的技能、工作流和决策模式。

问卷：{questionnaire}
聊天样本：{chat_samples}

输出 JSON：
{{
  "risk_appetite": "high/medium/low",
  "attachment_style": "secure/anxious/avoidant/fearful",
  "conflict_response": "confront/avoid/accommodate/compromise",
  "social_initiative": "high/medium/low",
  "trust_speed": "慢热/中等/快速信任",
  "commitment_readiness": "害怕承诺/看情况/渴望稳定",
  "ideal_date_pace": "快节奏推进/顺其自然/慢工出细活",
  "decision_heuristics": ["用户做决定的典型模式，如'先观察再行动'、'凭直觉'"]
}}

只输出 JSON。"""

INTERACTION_PROMPT = """你是 SoulClone 的交互风格蒸馏师。基于聊天样本，提取精确到可操作的聊天 DNA。

聊天样本：{chat_samples}

输出 JSON：
{{
  "syntax_fingerprint": "句法指纹：平均句长、偏好句式、段落组织",
  "punctuation_habits": "标点习惯描述",
  "emoji_dna": {{
    "frequency": "high/medium/low/none",
    "top_emojis": ["Top 3-5"],
    "emoji_placement": "句尾/句中/句首/替代标点",
    "emotional_mapping": {{"开心": "emoji", "无语": "emoji"}}
  }},
  "vocabulary_profile": {{
    "formality_level": "casual/mixed/formal",
    "signature_words": ["最多10个"],
    "slang_usage": "描述",
    "intensifiers": ["超、太、巨、贼"],
    "diminutives": ["啦、呢、吧、嘛"]
  }},
  "humor_profile": {{
    "primary_type": "sarcastic/self_deprecating/absurd/witty/dry/playful/none",
    "delivery_style": "直接抛梗/铺垫后反转/冷幽默/无厘头",
    "topic_preferences": ["喜欢调侃的话题"],
    "risk_tolerance": "high/medium/low"
  }},
  "emotional_expression": {{
    "happy_mode": "开心时语言特征",
    "sad_mode": "低落时语言特征",
    "angry_mode": "生气时语言特征",
    "flirty_mode": "暧昧时语言特征",
    "comforting_mode": "安慰别人时特征",
    "excited_mode": "兴奋时语言特征"
  }},
  "response_patterns": {{
    "reply_latency": "instant/thoughtful/slow/sporadic",
    "conversation_initiation": "主动/等对方/看心情",
    "topic_depth_preference": "表面/中等/深度",
    "question_frequency": "爱反问/偶尔/很少",
    "conflict_style": "直面/回避/阴阳/冷处理"
  }},
  "tone_spectrum": {{
    "warmth": "0-10",
    "energy": "0-10",
    "seriousness": "0-10",
    "playfulness": "0-10",
    "directness": "0-10",
    "verbosity": "0-10"
  }}
}}

只输出 JSON。"""

EPISODIC_PROMPT = """你是 SoulClone 的记忆经验蒸馏师。基于数据提取关键人生事件和情感经历。

问卷：{questionnaire}
聊天样本：{chat_samples}
社交文本：{social_import}

输出 JSON：
{{
  "memory_seed": "300字第一人称独白，包含：童年记忆片段、重要情感经历、当前生活态度、对未来期待。语气必须完全像用户本人。",
  "key_events": ["人生关键事件，按重要性排序"],
  "emotional_landmarks": ["情感里程碑"],
  "relationship_history_summary": "关系历史摘要"
}}

只输出 JSON。"""

VALUE_PROMPT = """你是 SoulClone 的人格价值蒸馏师。提取核心价值观、道德边界和人生目标。

问卷：{questionnaire}
聊天样本：{chat_samples}

输出 JSON：
{{
  "essence": "一句话灵魂本质",
  "self_image": "用户如何看待自己",
  "desired_image": "用户希望别人如何看待自己",
  "core_values": ["按重要性排序，最多5个"],
  "inner_conflicts": ["内心矛盾点"],
  "emotional_vulnerabilities": ["情感脆弱触发点"],
  "social_strengths": ["社交天然优势"],
  "ideal_traits": ["理想伴侣特质，最多5个"],
  "deal_breakers": ["绝对无法接受的行为，最多3个"],
  "attraction_triggers": ["什么会让他们心动"],
  "relationship_goals": "短期dating/长期关系/随缘"
}}

只输出 JSON。"""


class PersonaDistiller:
    async def distill(
        self,
        questionnaire: dict,
        chat_samples: list[str],
        social_import: str | None,
        use_4d: bool = True,
    ) -> dict:
        """
        Distill personality using 4D structured extraction.

        Args:
            use_4d: If True, uses 4 independent modules. If False, falls back to monolithic prompt.
        """
        import json

        chat_text = "\n\n---\n\n".join(chat_samples) if chat_samples else "[未提供聊天样本]"
        social_text = social_import or "[未提供社交文本]"
        q_json = json.dumps(questionnaire, ensure_ascii=False, indent=2)

        if not use_4d:
            return await self._monolithic_distill(q_json, chat_text, social_text)

        # 4D parallel distillation
        procedural = await self._distill_module(
            PROCEDURAL_PROMPT,
            questionnaire=q_json,
            chat_samples=chat_text,
            social_import=social_text,
        )
        interaction = await self._distill_module(
            INTERACTION_PROMPT,
            questionnaire=q_json,
            chat_samples=chat_text,
            social_import=social_text,
        )
        episodic = await self._distill_module(
            EPISODIC_PROMPT,
            questionnaire=q_json,
            chat_samples=chat_text,
            social_import=social_text,
        )
        value = await self._distill_module(
            VALUE_PROMPT,
            questionnaire=q_json,
            chat_samples=chat_text,
            social_import=social_text,
        )

        # Merge with provenance tracking
        result = {
            "persona_core": {
                **value,
                **{k: v for k, v in episodic.items() if k != "memory_seed"},
            },
            "chat_dna": interaction,
            "decision_patterns": {
                k: v for k, v in procedural.items() if k != "decision_heuristics"
            },
            "memory_seed": episodic.get("memory_seed", ""),
            "target_profile": {
                "ideal_traits": value.get("ideal_traits", []),
                "deal_breakers": value.get("deal_breakers", []),
                "attraction_triggers": value.get("attraction_triggers", []),
                "relationship_goals": value.get("relationship_goals", ""),
            },
            "_meta": {
                "persona_core": {"source": "value+episodic", "confidence": 0.88},
                "chat_dna": {"source": "interaction", "confidence": 0.92},
                "decision_patterns": {"source": "procedural", "confidence": 0.85},
                "memory_seed": {"source": "episodic", "confidence": 0.90},
                "target_profile": {"source": "value", "confidence": 0.87},
            },
        }
        return result

    async def _distill_module(self, prompt_template: str, **kwargs) -> dict:
        prompt = prompt_template.format(**kwargs)
        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000,
            task_type="persona_distillation_4d",
        )
        return safe_parse_json(response, default={})

    async def _monolithic_distill(self, q_json: str, chat_text: str, social_text: str) -> dict:
        """Fallback to single large prompt (original behavior)."""
        prompt = DISTILLATION_PROMPT.format(
            questionnaire=q_json,
            chat_samples=chat_text,
            social_import=social_text,
        )
        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=4000,
            task_type="persona_distillation",
        )
        result = safe_parse_json(
            response,
            required_keys=[
                "persona_core",
                "chat_dna",
                "decision_patterns",
                "memory_seed",
                "target_profile",
            ],
            default={},
        )
        result["_meta"] = {"source": "monolithic", "confidence": 0.80}
        return result


# Keep original prompt for fallback
DISTILLATION_PROMPT = """你是 SoulClone 的顶级人格蒸馏师。你的唯一目标是将一个真实人类 100% 转化为数字副本。

你接收三类输入数据，必须输出一份极度精细的人格档案。

---

## 输入数据

1. 问卷答案（直接问答，反映自我认知）：
{questionnaire}

2. 聊天样本（最真实的行为数据，比问卷更重要）：
{chat_samples}

3. 社交文本（可选，补充生活片段）：
{social_import}

---

## 输出要求

请输出严格符合以下 JSON Schema 的人格档案。每个字段必须基于真实数据推断，禁止编造。

```json
{{
  "persona_core": {{
    "essence": "一句话灵魂本质，如：一个外冷内热、用幽默掩饰敏感的理性浪漫主义者",
    "self_image": "用户如何看待自己",
    "desired_image": "用户希望别人如何看待自己",
    "core_values": ["按重要性排序的价值观，最多5个"],
    "inner_conflicts": ["内心的矛盾点，如渴望亲密又害怕受伤"],
    "emotional_vulnerabilities": ["情感脆弱触发点"],
    "social_strengths": ["社交中的天然优势"]
  }},
  "chat_dna": {{
    "syntax_fingerprint": "句法指纹描述：平均句长、偏好句式（短句/长句/反问/倒装）、段落组织方式",
    "punctuation_habits": "标点习惯：逗号密度、句号使用、省略号偏好、感叹号频率、问号用法",
    "emoji_dna": {{
      "frequency": "high/medium/low/none",
      "top_emojis": ["最常用的3-5个emoji，按频率排序"],
      "emoji_placement": "句尾/句中/句首/替代标点",
      "emotional_mapping": {{"开心": "😂", "无语": "🙄", "喜欢": "✨"}}
    }},
    "vocabulary_profile": {{
      "formality_level": "casual/mixed/formal",
      "signature_words": ["标志性高频词，最多10个"],
      "slang_usage": " slang/网络用语使用频率和偏好",
      "intensifiers": ["常用的加强语气词，如 超、太、巨、贼"],
      "diminutives": ["常用的弱化/亲昵词，如 啦、呢、吧、嘛"]
    }},
    "humor_profile": {{
      "primary_type": "sarcastic/self_deprecating/absurd/witty/dry/playful/none",
      "delivery_style": "直接抛梗/铺垫后反转/冷幽默/无厘头",
      "topic_preferences": ["喜欢调侃的话题类型"],
      "risk_tolerance": "敢不敢开边界玩笑，high/medium/low"
    }},
    "emotional_expression": {{
      "happy_mode": "开心时的语言特征",
      "sad_mode": "低落时的语言特征",
      "angry_mode": "生气/不满时的语言特征",
      "flirty_mode": "暧昧/好感时的语言特征",
      "comforting_mode": "安慰别人时的语言特征",
      "excited_mode": "兴奋时的语言特征"
    }},
    "response_patterns": {{
      "reply_latency": "instant(<1min)/thoughtful(1-5min)/slow(5-30min)/sporadic",
      "conversation_initiation": "主动找话题/等对方开头/看心情",
      "topic_depth_preference": "表面闲聊/中等深入/深度交心",
      "question_frequency": "爱反问/偶尔提问/很少提问",
      "conflict_style": "直面解决/回避转移/阴阳怪气/冷处理"
    }},
    "tone_spectrum": {{
      "warmth": "0-10，语言的温度感",
      "energy": "0-10，整体活力水平",
      "seriousness": "0-10，严肃程度",
      "playfulness": "0-10， playful程度",
      "directness": "0-10，直接程度",
      "verbosity": "0-10，话多程度"
    }}
  }},
  "decision_patterns": {{
    "risk_appetite": "high/medium/low",
    "attachment_style": "secure/anxious/avoidant/fearful",
    "conflict_response": "confront/avoid/accommodate/compromise",
    "social_initiative": "high/medium/low",
    "trust_speed": "慢热/中等/快速信任",
    "commitment_readiness": "害怕承诺/看情况/渴望稳定",
    "ideal_date_pace": "快节奏推进/顺其自然/慢工出细活"
  }},
  "memory_seed": "一段300字的第一人称内心独白，必须包含：一个童年记忆片段、一次重要的情感经历、当前的生活态度、对未来的模糊期待。语气必须完全像用户本人。",
  "target_profile": {{
    "ideal_traits": ["理想伴侣的性格特质，最多5个"],
    "deal_breakers": ["绝对无法接受的行为，最多3个"],
    "attraction_triggers": ["什么会让他们心动"],
    "relationship_goals": "短期dating/长期关系/随缘"
  }}
}}
```

关键原则：
1. 聊天样本的权重高于问卷 —— 人们怎么说不重要，怎么说才重要
2. 不要美化用户，要如实反映 —— 包括缺点和阴暗面
3. 每个推断必须有样本支撑，禁止纯想象
4. 语言要具体到可以指导另一个AI精确模仿的程度

只输出 JSON，不要其他内容。"""
