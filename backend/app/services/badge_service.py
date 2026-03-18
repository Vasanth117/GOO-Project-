from app.models.badge import BadgeDefinition, FarmerBadge, BadgeTier
from app.models.farm_profile import FarmProfile
from app.models.streak import Streak
from app.models.mission_progress import MissionProgress, MissionStatus
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def check_and_award_badges(farmer_id: str):
    """
    Run after every score update.
    Checks all badge definitions and awards any newly earned badges.
    """
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == farmer_id)
    streak = await Streak.find_one(Streak.farmer_id == farmer_id)

    if not farm:
        return

    # Get already-earned badge codes
    earned = await FarmerBadge.find(FarmerBadge.farmer_id == farmer_id).to_list()
    earned_codes = {b.badge_code for b in earned}

    # Get all active badge definitions
    definitions = await BadgeDefinition.find(BadgeDefinition.is_active == True).to_list()

    for badge in definitions:
        if badge.code in earned_codes:
            continue  # Already earned

        earned_now = False

        if badge.condition_type == "score_threshold":
            earned_now = farm.sustainability_score >= badge.condition_value

        elif badge.condition_type == "streak":
            current = streak.longest_streak if streak else 0
            earned_now = current >= badge.condition_value

        elif badge.condition_type == "missions":
            count = await MissionProgress.find(
                MissionProgress.farmer_id == farmer_id,
                MissionProgress.status == MissionStatus.COMPLETED,
            ).count()
            earned_now = count >= badge.condition_value

        if earned_now:
            farmer_badge = FarmerBadge(
                farmer_id=farmer_id,
                badge_code=badge.code,
                badge_name=badge.name,
                badge_icon=badge.icon,
                badge_tier=badge.tier,
            )
            await farmer_badge.insert()

            await send_notification(
                user_id=farmer_id,
                notif_type=NotificationType.BADGE_EARNED,
                title=f"{badge.icon} Badge Earned!",
                message=f"You earned the '{badge.name}' badge!",
                link=f"/badges",
            )
            logger.info(f"Badge '{badge.code}' awarded to farmer {farmer_id}")


async def seed_badge_definitions():
    """Seed default badge definitions into DB (run once on startup)."""
    existing = await BadgeDefinition.find_all().count()
    if existing > 0:
        return  # Already seeded

    defaults = [
        BadgeDefinition(code="beginner", name="Beginner Farmer", icon="🌱", description="Awarded for reaching 100 sustainability points.",
                        tier=BadgeTier.BEGINNER, condition_type="score_threshold",
                        condition_value=100, reward_points=0),
        BadgeDefinition(code="intermediate", name="Growing Farmer", icon="🌾", description="Awarded for reaching 500 sustainability points.",
                        tier=BadgeTier.INTERMEDIATE, condition_type="score_threshold",
                        condition_value=501, reward_points=50),
        BadgeDefinition(code="advanced", name="Eco Champion", icon="🌍", description="Awarded for reaching 1500 sustainability points.",
                        tier=BadgeTier.ADVANCED, condition_type="score_threshold",
                        condition_value=1501, reward_points=100),
        BadgeDefinition(code="expert", name="Farming Expert", icon="⭐", description="Awarded for reaching 3000 sustainability points.",
                        tier=BadgeTier.EXPERT, condition_type="score_threshold",
                        condition_value=3001, reward_points=200),
        BadgeDefinition(code="streak_7", name="7-Day Streak", icon="🔥", description="Complete missions for 7 consecutive days.",
                        tier=BadgeTier.SPECIAL, condition_type="streak",
                        condition_value=7, reward_points=20),
        BadgeDefinition(code="streak_30", name="30-Day Legend", icon="🌟", description="Complete missions for 30 consecutive days.",
                        tier=BadgeTier.SPECIAL, condition_type="streak",
                        condition_value=30, reward_points=50),
        BadgeDefinition(code="streak_100", name="100-Day Master", icon="🏆", description="Complete missions for 100 consecutive days.",
                        tier=BadgeTier.SPECIAL, condition_type="streak",
                        condition_value=100, reward_points=200),
        BadgeDefinition(code="missions_10", name="Mission Starter", icon="🎯", description="Complete your first 10 missions.",
                        tier=BadgeTier.SPECIAL, condition_type="missions",
                        condition_value=10, reward_points=25),
        BadgeDefinition(code="missions_50", name="Mission Pro", icon="💪", description="Complete 50 missions to become a pro.",
                        tier=BadgeTier.SPECIAL, condition_type="missions",
                        condition_value=50, reward_points=75),
    ]

    for badge in defaults:
        await badge.insert()

    logger.info(f"✅ Seeded {len(defaults)} badge definitions")
