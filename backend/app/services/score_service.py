from app.models.farm_profile import FarmProfile
from app.models.score import ScoreLog, ScoreChangeReason
from app.models.notification import Notification, NotificationType
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ─── SCORE CHANGE RULES ───────────────────────────────────────
SCORE_RULES = {
    ScoreChangeReason.MISSION_COMPLETE:    +10,
    ScoreChangeReason.STREAK_BONUS:        +20,
    ScoreChangeReason.COMMUNITY_VERIFIED:  +25,
    ScoreChangeReason.EXPERT_APPROVED:     +30,
    ScoreChangeReason.WATER_SAVING:        +10,
    ScoreChangeReason.ORGANIC_FERTILIZER:  +15,
    ScoreChangeReason.CHECKIN_BONUS:       +5,
    ScoreChangeReason.BADGE_BONUS:         +10,
    ScoreChangeReason.CHEMICAL_USAGE:      -20,
    ScoreChangeReason.INACTIVITY_DECAY:    -10,
    ScoreChangeReason.FRAUD_PENALTY:       -50,
    ScoreChangeReason.PROOF_REJECTED:      -15,
}

MIN_SCORE = 0
MAX_SCORE = 10000


async def update_score(
    farmer_id: str,
    reason: ScoreChangeReason,
    custom_delta: Optional[int] = None,
    description: Optional[str] = None,
) -> int:
    """
    Core score update function.
    Updates FarmProfile.sustainability_score and logs the change.
    Returns the new score.
    """
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == farmer_id)
    if not farm:
        logger.warning(f"Score update failed: No farm found for farmer {farmer_id}")
        return 0

    delta = custom_delta if custom_delta is not None else SCORE_RULES.get(reason, 0)
    score_before = farm.sustainability_score
    new_score = max(MIN_SCORE, min(MAX_SCORE, score_before + delta))

    # Update farm score
    farm.sustainability_score = new_score
    farm.updated_at = datetime.utcnow()
    await farm.save()

    # Log the change
    log = ScoreLog(
        farmer_id=farmer_id,
        delta=delta,
        reason=reason,
        description=description or reason.value.replace("_", " ").title(),
        score_before=score_before,
        score_after=new_score,
    )
    await log.insert()

    logger.info(
        f"Score updated for {farmer_id}: {score_before} → {new_score} ({delta:+d}) [{reason.value}]"
    )
    return new_score


async def get_score_history(farmer_id: str, limit: int = 30) -> list:
    """Fetch score history logs for a farmer (for graph display)."""
    logs = (
        await ScoreLog.find(ScoreLog.farmer_id == farmer_id)
        .sort(-ScoreLog.logged_at)
        .limit(limit)
        .to_list()
    )
    return [
        {
            "delta": log.delta,
            "reason": log.reason.value,
            "description": log.description,
            "score_before": log.score_before,
            "score_after": log.score_after,
            "logged_at": log.logged_at.isoformat(),
        }
        for log in logs
    ]


def get_score_tier(score: int) -> dict:
    """Return badge tier based on score."""
    if score >= 3001:
        return {"tier": "expert", "label": "⭐ Expert", "next_tier_at": None}
    elif score >= 1501:
        return {"tier": "advanced", "label": "🌍 Advanced", "next_tier_at": 3001}
    elif score >= 501:
        return {"tier": "intermediate", "label": "🌾 Intermediate", "next_tier_at": 1501}
    else:
        return {"tier": "beginner", "label": "🌱 Beginner", "next_tier_at": 501}
