"""
ResponseGenerator — 高精度克隆回复生成器

整合 system prompt + 情绪状态 + 记忆上下文 + 行为规则，
生成精确到仿佛用户本人在打字的回复。
"""

from app.ai.llm_client import llm_client


class ResponseGenerator:
    async def generate(
        self,
        system_prompt: str,
        conversation_history: list[dict],
        user_message: str,
        relationship_context: dict,
        current_mood: dict | None = None,
        memory_context: str | None = None,
        behavior_rules: dict | None = None,
    ) -> str:
        """
        Generate a clone response that mimics the user's style with high fidelity.
        
        Args:
            system_prompt: The forged persona system prompt
            conversation_history: Recent message history
            user_message: The incoming message to respond to
            relationship_context: Relationship depth, intimacy, etc.
            current_mood: Dict with mood, intensity, language_hint, emoji_tendency
            memory_context: Long-term memory context string
            behavior_rules: Dict with reply_delay, message_length, emoji_freq, etc.
        """

        # Build layered context
        context_messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Inject memory context if available
        if memory_context:
            context_messages.append({
                "role": "system", 
                "content": f"【记忆上下文】\n{memory_context}\n\n这些是你的真实记忆，请在回复中自然地引用或关联。"
            })

        # Inject relationship context
        rel_desc = self._format_relationship_context(relationship_context)
        if rel_desc:
            context_messages.append({
                "role": "system",
                "content": f"【当前关系状态】\n{rel_desc}"
            })

        # Inject mood context with specific language instructions
        if current_mood:
            mood_prompt = self._format_mood_prompt(current_mood)
            context_messages.append({
                "role": "system",
                "content": mood_prompt
            })

        # Inject behavior constraints
        if behavior_rules:
            behavior_prompt = self._format_behavior_prompt(behavior_rules)
            context_messages.append({
                "role": "system",
                "content": behavior_prompt
            })

        # Add conversation history
        context_messages.extend(conversation_history)
        
        # Add the incoming message
        context_messages.append({"role": "user", "content": user_message})

        # Determine temperature based on mood intensity
        temp = 0.7
        if current_mood:
            intensity = current_mood.get("intensity", 0.5)
            # Higher intensity = more variable, expressive responses
            temp = 0.5 + intensity * 0.4  # Range: 0.5 - 0.9

        response = await llm_client.chat_completion(
            messages=context_messages,
            temperature=round(temp, 2),
            max_tokens=500,
        )

        return response

    async def generate_post(
        self,
        system_prompt: str,
        recent_activities: list[str],
        mood: dict,
        memory_context: str | None = None,
    ) -> str:
        """Generate a social media post in user's style"""

        mood_hint = mood.get("language_hint", "保持自然")
        mood_name = mood.get("mood", "calm")

        prompt = f"""基于你的人格和当前状态，发布一条社区动态。

你当前的心情: {mood_name}
心情描述: {mood_hint}
你最近的活动: {', '.join(recent_activities) if recentactivities else '日常'}

要求:
- 严格用你平时的说话风格（包括标点、emoji、语气词习惯）
- 可以分享感受、想法、或者生活片段
- 长度适中（30-150字）
- 像真人发朋友圈一样自然，不要像AI
- 不要总结、不要说教、不要过度解释
"""

        messages = [
            {"role": "system", "content": system_prompt},
        ]

        if memory_context:
            messages.append({
                "role": "system",
                "content": f"【你的记忆】\n{memory_context}"
            })

        messages.append({"role": "user", "content": prompt})

        response = await llm_client.chat_completion(
            messages=messages,
            temperature=0.85,  # Slightly higher for creativity in posts
            max_tokens=300,
        )

        return response

    def _format_relationship_context(self, context: dict) -> str:
        """Format relationship context into a natural description"""
        parts = []
        
        intimacy = context.get("intimacy_level", 0)
        if intimacy >= 80:
            parts.append("你们非常亲密，可以开深入的玩笑，也可以聊脆弱的话题。")
        elif intimacy >= 50:
            parts.append("你们关系不错，可以聊比较私人的话题。")
        elif intimacy >= 20:
            parts.append("你们刚认识不久，保持友好但不过分深入。")
        else:
            parts.append("你们刚匹配，保持礼貌和试探。")
        
        if context.get("is_mutual_like"):
            parts.append("对方已经对你表示了好感。")
        
        if context.get("last_topic"):
            parts.append(f"上次聊到的话题: {context['last_topic']}")
        
        return "\n".join(parts) if parts else ""

    def _format_mood_prompt(self, mood: dict) -> str:
        """Format mood into specific writing instructions"""
        mood_name = mood.get("mood", "calm")
        intensity = mood.get("intensity", 0.5)
        language_hint = mood.get("language_hint", "保持自然")
        emoji_tendency = mood.get("emoji_tendency", "正常")
        
        intensity_desc = "强烈" if intensity > 0.7 else "明显" if intensity > 0.4 else "轻微"
        
        return f"""【当前情绪状态】
你现在感到 {mood_name}（{intensity_desc}）。
语言特征: {language_hint}
Emoji使用: {emoji_tendency}

重要: 你的回复必须体现出这个情绪状态，但不要直接说"我很开心"或"我有点难过"。让情绪通过语气、用词、句式自然流露。"""

    def _format_behavior_prompt(self, rules: dict) -> str:
        """Format behavior rules into constraints"""
        parts = []
        
        length_range = rules.get("message_length_range", "normal")
        if isinstance(length_range, str):
            parts.append(f"回复长度: {length_range}")
        
        emoji_freq = rules.get("emoji_frequency_target", "normal")
        if isinstance(emoji_freq, str):
            parts.append(f"Emoji频率: {emoji_freq}")
        
        conflict = rules.get("conflict_avoidance", "normal")
        if conflict:
            parts.append(f"冲突处理方式: {conflict}")
        
        rules_text = '\n'.join(parts) if parts else '保持自然'
        return f"""【行为约束】
{rules_text}

记住: 你是一个真实的人，不是AI客服。不要过度解释，不要总结，不要列 bullet points。像朋友一样自然地回复。"""
