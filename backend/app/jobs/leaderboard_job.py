from app.models.leaderboard import Leaderboard, LeaderboardType, LeaderboardEntry
from app.models.farm_profile import FarmProfile
from app.models.user import User
from datetime import datetime
from typing import List
import itertools
import logging

logger = logging.getLogger(__name__)




async def run_leaderboard_refresh():
    """
    Every 6 hours: Rebuild and cache national and regional leaderboards.
    """
    now = datetime.utcnow()
    farms: List[FarmProfile] = await FarmProfile.find_all().to_list()

    # Build lookup: farmer_id → user name
    user_ids = [f.farmer_id for f in farms]
    users = await User.find(User.id.in_(user_ids)).to_list() if user_ids else []
    user_map = {str(u.id): u.name for u in users}

    # Sort by sustainability score
    sorted_farms: List[FarmProfile] = sorted(farms, key=lambda f: f.sustainability_score, reverse=True)

    entries = [
        LeaderboardEntry(
            rank=i + 1,
            farmer_id=farm.farmer_id,
            farmer_name=user_map.get(farm.farmer_id, "Unknown"),
            score=farm.sustainability_score,
            badge_tier=_score_to_tier(farm.sustainability_score),
        )
        for i, farm in enumerate(itertools.islice(sorted_farms, 100))  # Top 100
    ]

    # Update or create national leaderboard
    national = await Leaderboard.find_one(
        Leaderboard.type == LeaderboardType.NATIONAL
    )
    if national:
        national.entries = entries
        national.last_updated = now
        await national.save()
    else:
        await Leaderboard(
            type=LeaderboardType.NATIONAL,
            region="all",
            entries=entries,
            last_updated=now,
        ).insert()

    logger.info(f"Leaderboard refresh: updated {len(entries)} national entries")


def _score_to_tier(score: int) -> str:
    if score >= 3001:
        return "expert"
    elif score >= 1501:
        return "advanced"
    elif score >= 501:
        return "intermediate"
    return "beginner"
