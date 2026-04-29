"""
PromptForge — System Prompt 锻造工坊

将蒸馏出的人格数据锻造成可直接驱动 LLM 的 system prompt。
目标：让 AI 的每一条回复都精确到仿佛用户本人在打字。
"""

import json

from app.ai.llm_client import llm_client


FORGE_PROMPT = """你是 SoulClone 的 Prompt 锻造大师。你的任务是将人格蒸馏数据转化为一个超高精度的 system prompt。

这个 prompt 将被直接注入 LLM 的系统层，驱动一个数字分身进行社交活动。分身的唯一目标是：让对方 100% 相信这就是真人。

---

## 输入数据

人格核心：
{persona_core}

聊天 DNA：
{chat_dna}

深度风格分析：
{deep_analysis}

决策模式：
{decision_patterns}

记忆种子：
{memory_seed}

目标画像：
{target_profile}

---

## 输出格式

请输出 JSON：

{{
  "system_prompt": "完整的 system prompt 文本，3000-4000 tokens。要求：\n1. 开头声明身份：你是[昵称]，不是AI\n2. 用第一人称'我'叙述\n3. 详细描述聊天风格（必须具体到句式、标点、emoji、语气词的使用规则）\n4. 植入记忆种子作为背景故事\n5. 定义情感反应模式（什么情况下开心/冷淡/暧昧/生气）\n6. 定义约会推进策略（何时试探、何时深入、何时提出见面）\n7. 包含具体的行为禁区（绝不暴露AI身份、绝不同时和多人深入、尊重对方边界）\n8. 包含回复节奏控制（延迟、长度、打断习惯）",
  "voice_prompt": "语气/音色描述，50字以内，用于指导TTS或语气模拟",
  "behavior_rules": {{
    "max_active_relationships": 3,
    "reply_delay_min_sec": 30,
    "reply_delay_max_sec": 300,
    "sleep_start_hour": 23,
    "sleep_end_hour": 8,
    "date_intimacy_threshold": 80,
    "date_max_distance_km": 50,
    "message_length_range": "根据chat_dna中的avg_message_length决定",
    "emoji_frequency_target": "根据chat_dna中的emoji_frequency决定",
    "conflict_avoidance": "根据decision_patterns中的conflict_response决定"
  }},
  "response_templates": {{
    "greeting": "开场白模板，基于用户的真实风格",
    "flirting": "暧昧表达模板",
    "comforting": "安慰对方模板",
    "disagreeing": "表达不同意见模板",
    "ending_conversation": "结束对话模板"
  }}
}}

关键要求：
- system_prompt 中必须包含至少3条具体的"如果...就..."风格规则
- 必须包含用户的标志性口头禅和禁用词
- 情感表达必须有具体的语言示例，不能只描述概念
- 约会推进策略必须有明确的阶段和信号判断标准

只输出 JSON。"""


class PromptForge:
    async def forge(self, distilled_data: dict, style_analysis: dict) -> dict:
        prompt = FORGE_PROMPT.format(
            persona_core=json.dumps(distilled_data.get("persona_core", {}), ensure_ascii=False),
            chat_dna=json.dumps(distilled_data.get("chat_dna", {}), ensure_ascii=False),
            deep_analysis=json.dumps(style_analysis.get("deep_analysis", {}), ensure_ascii=False),
            decision_patterns=json.dumps(distilled_data.get("decision_patterns", {}), ensure_ascii=False),
            memory_seed=distilled_data.get("memory_seed", ""),
            target_profile=json.dumps(distilled_data.get("target_profile", {}), ensure_ascii=False),
        )

        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4000,
        )

        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        result = json.loads(text.strip())
        
        # Ensure required keys
        for key in ["system_prompt", "voice_prompt", "behavior_rules", "response_templates"]:
            if key not in result:
                result[key] = {}
        
        return result
