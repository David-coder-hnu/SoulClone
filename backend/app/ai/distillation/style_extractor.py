"""
StyleExtractor — 聊天风格指纹提取器

从原始聊天记录中提取可操作的风格参数，
供 PromptForge 直接嵌入 system prompt 的行为指令层。
"""

import json
import re
from collections import Counter

from app.ai.llm_client import llm_client


class StyleExtractor:
    def __init__(self):
        self.emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+",
            flags=re.UNICODE,
        )

    def _extract_basic_stats(self, samples: list[str]) -> dict:
        """Extract surface-level statistical features"""
        all_text = "\n".join(samples)
        messages = [s.strip() for s in samples if s.strip()]
        
        # Message lengths
        lengths = [len(m) for m in messages]
        avg_length = sum(lengths) / max(len(lengths), 1)
        
        # Sentence count
        sentences = re.split(r'[。！？.!?~\n]+', all_text)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_sentence_length = sum(len(s) for s in sentences) / max(len(sentences), 1)
        
        # Emoji analysis
        emojis = self.emoji_pattern.findall(all_text)
        emoji_count = len(emojis)
        emoji_freq = emoji_count / max(len(all_text), 1) * 100
        top_emojis = [e[0] for e in Counter(emojis).most_common(5)]
        
        # Punctuation habits
        punct_counts = {
            "exclamation": all_text.count("！") + all_text.count("!"),
            "question": all_text.count("？") + all_text.count("?"),
            "ellipsis": all_text.count("…") + all_text.count("..."),
            "tilde": all_text.count("~"),
        }
        
        # Vocabulary richness
        words = re.findall(r'\b\w+\b', all_text)
        unique_words = set(words)
        vocab_richness = len(unique_words) / max(len(words), 1)
        
        return {
            "avg_message_length": round(avg_length, 1),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "total_messages": len(messages),
            "emoji_count": emoji_count,
            "emoji_frequency_per_100chars": round(emoji_freq, 2),
            "top_emojis": top_emojis,
            "punctuation_profile": punct_counts,
            "vocabulary_richness": round(vocab_richness, 3),
        }

    async def extract(self, chat_samples: list[str]) -> dict:
        if not chat_samples:
            return {"error": "No chat samples provided"}

        # Layer 1: Statistical extraction
        stats = self._extract_basic_stats(chat_samples)
        
        # Layer 2: LLM deep semantic analysis
        deep_analysis = await self._llm_deep_analysis(chat_samples, stats)
        
        return {
            "statistics": stats,
            "deep_analysis": deep_analysis,
        }

    async def _llm_deep_analysis(self, samples: list[str], stats: dict) -> dict:
        prompt = f"""你是一个聊天风格分析师。基于以下统计数据和原始聊天样本，进行深度风格分析。

统计特征：
{json.dumps(stats, ensure_ascii=False, indent=2)}

原始聊天样本（共 {len(samples)} 条）：
{chr(10).join(f"[{i+1}] {s}" for i, s in enumerate(samples[:20]))}  # 最多20条

请输出 JSON 格式的深度分析：

{{
  "reply_latency_estimate": "根据回复间隔用词推测的响应速度：instant/thoughtful/slow/sporadic",
  "conversation_rhythm": "对话节奏描述：如 快问快答型、深思熟虑型、断断续续型",
  "topic_switching_style": "话题转换方式： abrupt生硬转移/自然过渡/被动跟随/主动引导",
  "emotional_leakage": "情感泄露模式：开心时话多、难过时简短、生气时反问",
  "power_dynamic": "对话中的权力位置：主导型/配合型/平等互动型/被动回应型",
  "vulnerability_moments": ["样本中暴露脆弱的真实时刻，逐条引用"],
  "defense_mechanisms": ["防御机制：如用幽默转移、用冷漠掩饰、过度解释"],
  "intimacy_signals": "表达亲近感的方式：昵称/关心/分享秘密/身体接触暗示",
  "imitation_difficulty": "最难模仿的3个特征，具体说明为什么难",
  "style_fingerprint": "用50字以内描述这个用户的独特聊天指纹，要具体到让人一眼认出"
}}

只输出 JSON。"""

        response = await llm_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )

        text = response.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text.strip())
