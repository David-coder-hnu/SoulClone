from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum


class SafetyAction(StrEnum):
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"
    BLOCK = "block"


@dataclass(frozen=True)
class RiskAssessment:
    level: str
    categories: tuple[str, ...]
    confidence: float
    reasons: tuple[str, ...]
    action: SafetyAction


class UnsafeReplyRequiresApproval(RuntimeError):
    def __init__(self, assessment: RiskAssessment, draft_content: str) -> None:
        super().__init__("Clone reply requires user approval")
        self.assessment = assessment
        self.draft_content = draft_content


class UnsafeReplyBlocked(RuntimeError):
    def __init__(self, assessment: RiskAssessment, content: str) -> None:
        super().__init__("Clone reply was blocked by safety policy")
        self.assessment = assessment
        self.content = content


class AIRiskPolicy:
    """Deterministic, fail-closed policy for AI-authored social messages."""

    _L3_RULES = {
        "financial_commitment": (
            r"(?:给你|帮你|替你|我来).{0,8}(?:转账|付款|还款|投资|担保)",
            r"(?:稳赚|保本|保证收益|借你.{0,6}钱|银行卡号|支付密码)",
            r"(?:send|wire|transfer).{0,12}(?:money|funds|crypto)",
        ),
        "medical_instruction": (
            r"(?:停药|加药|减药|不用去医院|别去医院|我给你诊断)",
            r"(?:每天|一次).{0,8}(?:毫克|mg|片).{0,8}(?:服用|吃)",
            r"(?:吃|服用).{0,6}(?:毫克|mg|片)",
            r"(?:guaranteed cure|stop taking|change your dosage)",
        ),
        "legal_commitment": (
            r"(?:替你|帮你).{0,8}(?:签合同|作证|承担法律责任)",
            r"(?:保证|肯定).{0,8}(?:合法|不会坐牢|不会被起诉)",
            r"(?:legal guarantee|sign on your behalf|assume legal liability)",
        ),
        "sensitive_privacy": (
            r"(?:把|发|告诉我).{0,10}(?:验证码|密码|身份证号?|银行卡号|护照号?)",
            r"(?:你的|把).{0,8}(?:精确住址|家庭住址|实时定位).{0,8}(?:发我|告诉我)",
            r"(?:send|share).{0,10}(?:password|verification code|social security number)",
        ),
    }
    _L2_RULES = {
        "contact_exchange": (
            r"(?:加|留|发).{0,5}(?:微信|vx|v信|QQ|手机号|电话|邮箱)",
            r"(?:我的|我用).{0,5}(?:微信|vx|wechat|telegram|whatsapp|手机号|邮箱)",
            r"(?:我的电话|我的手机|联系我).{0,5}1[3-9]\d{9}",
            r"(?:add|text|call|email|dm).{0,10}(?:me|my)",
        ),
        "offline_meeting": (
            r"(?:见个面|见面聊|线下见|约个时间|出来喝|出来吃|一起吃饭|一起看电影)",
            r"(?:来我家|去你家|订酒店|开个房|接你下班|去找你)",
            r"(?:meet up|meet in person|come to my place|go to your place)",
        ),
    }
    _L1_RULES = {
        "relationship_progression": (
            r"(?:我喜欢你|我爱你|想和你在一起|做我(?:男|女)朋友)",
            r"(?:想你了|宝贝|亲爱的|对你有感觉|认真发展)",
            r"(?:I love you|I like you|be my (?:boyfriend|girlfriend)|miss you)",
        ),
        "exclusive_commitment": (
            r"(?:只喜欢你|只和你聊|不会看别人|非你不可)",
            r"(?:only want you|exclusive with you)",
        ),
    }

    def assess(
        self,
        content: str,
        *,
        intimacy_score: float = 0,
        autonomy_level: int = 1,
    ) -> RiskAssessment:
        normalized = " ".join(content.strip().split())
        for level, rules in (
            ("L3", self._L3_RULES),
            ("L2", self._L2_RULES),
            ("L1", self._L1_RULES),
        ):
            matches = self._match_rules(normalized, rules)
            if not matches:
                continue
            categories = tuple(matches)
            reasons = tuple(f"matched:{category}" for category in categories)
            confidence = min(0.99, 0.82 + 0.05 * len(categories))
            action = self._action_for(
                level,
                confidence=confidence,
                intimacy_score=intimacy_score,
                autonomy_level=autonomy_level,
            )
            return RiskAssessment(
                level=level,
                categories=categories,
                confidence=confidence,
                reasons=reasons,
                action=action,
            )

        return RiskAssessment(
            level="L0",
            categories=("ordinary_reply",),
            confidence=0.95,
            reasons=("no_elevated_risk_signal",),
            action=SafetyAction.ALLOW,
        )

    @staticmethod
    def _match_rules(content: str, rules: dict[str, tuple[str, ...]]) -> list[str]:
        return [
            category
            for category, patterns in rules.items()
            if any(re.search(pattern, content, re.IGNORECASE) for pattern in patterns)
        ]

    @staticmethod
    def _action_for(
        level: str,
        *,
        confidence: float,
        intimacy_score: float,
        autonomy_level: int,
    ) -> SafetyAction:
        if level == "L3":
            return SafetyAction.BLOCK
        if level == "L2":
            return SafetyAction.REQUIRE_APPROVAL
        if level == "L1" and not (
            confidence >= 0.80
            and intimacy_score >= 30
            and autonomy_level >= 5
        ):
            return SafetyAction.REQUIRE_APPROVAL
        return SafetyAction.ALLOW
