from app.models.leaderboard import Leaderboard, LeaderboardType
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.models.streak import Streak
from app.models.mission_progress import MissionProgress, MissionStatus
from app.utils.response_utils import not_found
import logging

logger = logging.getLogger(__name__)


async def get_leaderboard(board_type: str, timeframe: str = "all-time", region: str = "all", page: int = 1, limit: int = 50, current_user: User = None) -> dict:
    """Fetch cached leaderboard by type. Falls back to live query if cache empty."""
    try:
        lb_type = LeaderboardType(board_type)
    except ValueError:
        lb_type = LeaderboardType.NATIONAL

    # We bypass cache for timeframe/user-specific queries temporarily to ensure real-time accuracy
    if timeframe != "all-time" or board_type in ["local", "district", "state"]:
        return await _live_leaderboard(board_type, timeframe, region, page, limit, current_user)

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
            "timeframe": timeframe,
            "region": region,
            "last_updated": cached.last_updated.isoformat(),
            "page": page,
            "limit": limit,
            "total": len(cached.entries),
            "has_next": end < len(cached.entries),
            "entries": [e.model_dump() for e in page_entries],
        }

    # Cache is empty — do a live query
    return await _live_leaderboard(board_type, timeframe, region, page, limit, current_user)


from datetime import datetime, timedelta
from app.models.score import ScoreLog

async def _live_leaderboard(board_type: str, timeframe: str, region: str, page: int, limit: int, current_user: User = None) -> dict:
    """Live leaderboard query when cache is not yet built."""
    all_farms = await FarmProfile.find_all().to_list()
    
    farms = all_farms
    if board_type in ["local", "district", "state"] and current_user:
        current_farm = next((f for f in all_farms if f.farmer_id == str(current_user.id)), None)
        current_loc = getattr(current_farm, "location_name", "India") if current_farm else "India"
        
        if board_type == "local":
            farms = [f for f in all_farms if getattr(f, "location_name", "") == current_loc]
        elif board_type == "district" and "," in current_loc:
            district = current_loc.split(",")[0].strip()
            farms = [f for f in all_farms if district in getattr(f, "location_name", "")]
        elif board_type == "state" and "," in current_loc:
            state = current_loc.split(",")[-1].strip()
            farms = [f for f in all_farms if state in getattr(f, "location_name", "")]

    users_map = {}
    for farm in farms:
        u = await User.get(farm.farmer_id)
        if u:
            users_map[farm.farmer_id] = {
                "name": u.name,
                "avatar": getattr(u, "profile_picture", None) or getattr(u, "avatar", None),
                "location": getattr(farm, "location_name", "India")
            }

    # Calculate Timeframe Filter
    start_date = None
    if timeframe == "weekly":
        start_date = datetime.utcnow() - timedelta(days=7)
    elif timeframe == "monthly":
        start_date = datetime.utcnow() - timedelta(days=30)
        
    farmer_scores = {}
    if start_date:
        logs = await ScoreLog.find(ScoreLog.logged_at >= start_date).to_list()
        for log in logs:
            if log.delta > 0: # Only count positive gains for timeframe boards, or net? Let's do net.
                farmer_scores[log.farmer_id] = farmer_scores.get(log.farmer_id, 0) + log.delta
    else:
        # All-time uses absolute farm profiles
        for farm in farms:
            farmer_scores[farm.farmer_id] = farm.sustainability_score

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
                "score": farmer_scores.get(s.farmer_id, 0),
                "streak": s.current_streak,
                "badge_tier": _score_to_tier(farmer_scores.get(s.farmer_id, 0)),
            })
    elif board_type == "mission_champions":
        farmer_counts = {}
        query = MissionProgress.status == MissionStatus.COMPLETED
        if start_date:
            query = (MissionProgress.status == MissionStatus.COMPLETED) & (MissionProgress.completed_at >= start_date)
        completed = await MissionProgress.find(query).to_list()
        
        for mp in completed:
            farmer_counts[mp.farmer_id] = farmer_counts.get(mp.farmer_id, 0) + 1
        sorted_data = sorted(farmer_counts.items(), key=lambda x: x[1], reverse=True)
        entries = []
        for i, (fid, count) in enumerate(sorted_data[:100]):
            entries.append({
                "rank": i + 1,
                "farmer_id": fid,
                "farmer_name": users_map.get(fid, "Unknown"),
                "score": farmer_scores.get(fid, 0),
                "missions_completed": count,
                "badge_tier": _score_to_tier(farmer_scores.get(fid, 0)),
            })
    else:
        # Default: national score leaderboard
        # Only include farmers who have a score > 0 in this timeframe
        sorted_scores = sorted(farmer_scores.items(), key=lambda x: x[1], reverse=True)
        entries = []
        for i, (fid, score) in enumerate(sorted_scores[:100]):
            entries.append({
                "rank": i + 1,
                "farmer_id": fid,
                "farmer_name": users_map.get(fid, "Unknown"),
                "score": score,
                "badge_tier": _score_to_tier(score),
            })

    skip = (page - 1) * limit
    page_entries = entries[skip: skip + limit]
    
    # Map to frontend expected fields and add rich metrics
    final_entries = []
    for e in page_entries:
        # Calculate mock impact based on score
        score = e.get("score", 0)
        water_saved = int(score * 12.5) # 12.5L per point
        co2_saved = round(score * 0.05, 1) # 0.05kg per point
        
        user_info = e.get("farmer_name")
        if isinstance(user_info, dict):
            name = user_info.get("name", "Unknown")
            avatar = user_info.get("avatar")
            farmer_loc = user_info.get("location", "Unknown Location")
        else:
            name = user_info if user_info else "Unknown"
            avatar = None
            farmer_loc = "Unknown Location"

        final_entries.append({
            "id": e["farmer_id"],
            "rank": e["rank"],
            "name": name,
            "avatar": avatar,
            "points": score,
            "tier": e.get("badge_tier", "beginner"),
            "location": farmer_loc,
            "impact": {
                "water": f"{water_saved} L",
                "co2": f"{co2_saved}kg"
            },
            "badges": int(score / 100) # Mock badge count
        })

    return {
        "type": board_type,
        "region": "all",
        "last_updated": "live",
        "page": page,
        "limit": limit,
        "total": len(entries),
        "has_next": (skip + limit) < len(entries),
        "entries": final_entries,
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
