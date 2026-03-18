from app.models.leaderboard import Leaderboard, LeaderboardType
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.models.streak import Streak
from app.models.mission_progress import MissionProgress, MissionStatus
from app.utils.response_utils import not_found
import logging

logger = logging.getLogger(__name__)


async def get_leaderboard(board_type: str, region: str = "all", page: int = 1, limit: int = 50) -> dict:
    """Fetch cached leaderboard by type. Falls back to live query if cache empty."""
    try:
        lb_type = LeaderboardType(board_type)
    except ValueError:
        lb_type = LeaderboardType.NATIONAL

    cached = await Leaderboard.find_one(
        Leaderboard.type == lb_type,
        Leaderboard.region == region,
    )

    if cached and cached.entries:
        start = (page - 1) * limit
        end = start + limit
        page_entries = cached.entries[start:end]
        return {
            "type": board_type,
            "region": region,
            "last_updated": cached.last_updated.isoformat(),
            "page": page,
            "limit": limit,
            "total": len(cached.entries),
            "has_next": end < len(cached.entries),
            "entries": [e.model_dump() for e in page_entries],
        }

    # Cache is empty — do a live query (will be replaced by cron cache soon)
    return await _live_leaderboard(board_type, page, limit)


async def _live_leaderboard(board_type: str, page: int, limit: int) -> dict:
    """Live leaderboard query when cache is not yet built."""
    farms = await FarmProfile.find_all().to_list()
    users_map = {}
    for farm in farms:
        u = await User.get(farm.farmer_id)
        if u:
            users_map[farm.farmer_id] = u.name

    if board_type == "streaks":
        streaks = await Streak.find_all().to_list()
        sorted_data = sorted(streaks, key=lambda s: s.current_streak, reverse=True)
        entries = []
        for i, s in enumerate(sorted_data[:100]):
            name = users_map.get(s.farmer_id, "Unknown")
            farm = next((f for f in farms if f.farmer_id == s.farmer_id), None)
            entries.append({
                "rank": i + 1,
                "farmer_id": s.farmer_id,
                "farmer_name": name,
                "score": farm.sustainability_score if farm else 0,
                "streak": s.current_streak,
                "badge_tier": _score_to_tier(farm.sustainability_score if farm else 0),
            })
    elif board_type == "mission_champions":
        farmer_counts = {}
        completed = await MissionProgress.find(MissionProgress.status == MissionStatus.COMPLETED).to_list()
        for mp in completed:
            farmer_counts[mp.farmer_id] = farmer_counts.get(mp.farmer_id, 0) + 1
        sorted_data = sorted(farmer_counts.items(), key=lambda x: x[1], reverse=True)
        entries = []
        for i, (fid, count) in enumerate(sorted_data[:100]):
            farm = next((f for f in farms if f.farmer_id == fid), None)
            entries.append({
                "rank": i + 1,
                "farmer_id": fid,
                "farmer_name": users_map.get(fid, "Unknown"),
                "score": farm.sustainability_score if farm else 0,
                "missions_completed": count,
                "badge_tier": _score_to_tier(farm.sustainability_score if farm else 0),
            })
    else:
        # Default: national score leaderboard
        sorted_farms = sorted(farms, key=lambda f: f.sustainability_score, reverse=True)
        entries = [
            {
                "rank": i + 1,
                "farmer_id": farm.farmer_id,
                "farmer_name": users_map.get(farm.farmer_id, "Unknown"),
                "score": farm.sustainability_score,
                "badge_tier": _score_to_tier(farm.sustainability_score),
            }
            for i, farm in enumerate(sorted_farms[:100])
        ]

    skip = (page - 1) * limit
    page_entries = entries[skip: skip + limit]
    return {
        "type": board_type,
        "region": "all",
        "last_updated": "live",
        "page": page,
        "limit": limit,
        "total": len(entries),
        "has_next": (skip + limit) < len(entries),
        "entries": page_entries,
    }


async def get_my_rank(user: User) -> dict:
    """Get the current farmer's rank across all leaderboard types."""
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        not_found("Farm profile")

    all_farms = await FarmProfile.find_all().to_list()
    sorted_farms = sorted(all_farms, key=lambda f: f.sustainability_score, reverse=True)
    score_rank = next((i + 1 for i, f in enumerate(sorted_farms) if f.farmer_id == str(user.id)), None)

    streak = await Streak.find_one(Streak.farmer_id == str(user.id))
    streak_rank = None
    if streak:
        all_streaks = await Streak.find_all().to_list()
        sorted_streaks = sorted(all_streaks, key=lambda s: s.current_streak, reverse=True)
        streak_rank = next((i + 1 for i, s in enumerate(sorted_streaks) if s.farmer_id == str(user.id)), None)

    return {
        "national_score_rank": score_rank,
        "streak_rank": streak_rank,
        "current_score": farm.sustainability_score,
        "current_streak": streak.current_streak if streak else 0,
        "total_farmers": len(all_farms),
    }


def _score_to_tier(score: int) -> str:
    if score >= 3001: return "expert"
    elif score >= 1501: return "advanced"
    elif score >= 501: return "intermediate"
    return "beginner"
