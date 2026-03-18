"""
Mission seed data — default templates loaded into DB on first startup.
Covers daily, weekly, monthly, and community mission types.
"""
from app.models.mission import Mission, MissionType, MissionDifficulty, ProofRequirement
import logging

logger = logging.getLogger(__name__)

DEFAULT_MISSIONS = [
    # ─── DAILY MISSIONS ──────────────────────────────────────
    {
        "title": "Use Drip Irrigation Today",
        "description": "Water your crops using drip or sprinkler irrigation instead of flood irrigation. This conserves up to 50% more water.",
        "mission_type": MissionType.DAILY,
        "difficulty": MissionDifficulty.EASY,
        "reward_points": 10,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of drip/sprinkler system in use"),
        "duration_hours": 24,
    },
    {
        "title": "No Pesticide Today",
        "description": "Complete one full day of farming without using any chemical pesticides. Use neem oil or any organic alternative if needed.",
        "mission_type": MissionType.DAILY,
        "difficulty": MissionDifficulty.EASY,
        "reward_points": 10,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of your crops showing healthy growth without chemical treatment"),
        "duration_hours": 24,
    },
    {
        "title": "Compost Application",
        "description": "Apply homemade or organic compost to at least one section of your farm today.",
        "mission_type": MissionType.DAILY,
        "difficulty": MissionDifficulty.EASY,
        "reward_points": 10,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of compost being applied to soil"),
        "duration_hours": 24,
    },
    {
        "title": "Farm Inspection Walk",
        "description": "Walk through your entire farm and check crop health, soil moisture, and signs of pest activity.",
        "mission_type": MissionType.DAILY,
        "difficulty": MissionDifficulty.EASY,
        "reward_points": 5,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="GPS-verified photo from your farm"),
        "duration_hours": 24,
    },

    # ─── WEEKLY MISSIONS ─────────────────────────────────────
    {
        "title": "Reduce Pesticide Usage This Week",
        "description": "Track and reduce your chemical pesticide usage by at least 30% compared to last week. Report your usage in the weekly check-in.",
        "mission_type": MissionType.WEEKLY,
        "difficulty": MissionDifficulty.MEDIUM,
        "reward_points": 30,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of your pesticide log or organic alternative products"),
        "duration_hours": 168,
    },
    {
        "title": "7-Day Water Conservation",
        "description": "Use water-efficient irrigation every day this week. Avoid flood irrigation entirely.",
        "mission_type": MissionType.WEEKLY,
        "difficulty": MissionDifficulty.MEDIUM,
        "reward_points": 30,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of your irrigation setup"),
        "duration_hours": 168,
    },
    {
        "title": "Soil Health Check",
        "description": "Test your soil's pH and moisture this week. Record results and adjust fertilizer usage accordingly.",
        "mission_type": MissionType.WEEKLY,
        "difficulty": MissionDifficulty.MEDIUM,
        "reward_points": 25,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of soil test or testing kit with results visible"),
        "duration_hours": 168,
    },
    {
        "title": "Organic Fertilizer Application",
        "description": "Apply only organic fertilizer (compost, vermicompost, or manure) to your entire farm this week.",
        "mission_type": MissionType.WEEKLY,
        "difficulty": MissionDifficulty.MEDIUM,
        "reward_points": 35,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo showing organic fertilizer bags or application"),
        "duration_hours": 168,
    },

    # ─── MONTHLY MISSIONS ────────────────────────────────────
    {
        "title": "30-Day No Chemical Pesticide",
        "description": "Complete an entire month without using any chemical pesticides. Transition fully to organic pest control.",
        "mission_type": MissionType.MONTHLY,
        "difficulty": MissionDifficulty.HARD,
        "reward_points": 100,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="End-of-month photo showing healthy crops and your organic pest control products"),
        "duration_hours": 720,
    },
    {
        "title": "Soil Improvement Project",
        "description": "Implement a soil improvement strategy this month: add compost, plant cover crops, or reduce tillage.",
        "mission_type": MissionType.MONTHLY,
        "difficulty": MissionDifficulty.HARD,
        "reward_points": 80,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Before and after photos of your soil or cover crops growing"),
        "duration_hours": 720,
    },
    {
        "title": "Install Water Harvesting System",
        "description": "Set up a rainwater harvesting or water storage system on your farm this month.",
        "mission_type": MissionType.MONTHLY,
        "difficulty": MissionDifficulty.HARD,
        "reward_points": 90,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of your rainwater harvesting or storage system"),
        "duration_hours": 720,
    },

    # ─── COMMUNITY MISSIONS ───────────────────────────────────
    {
        "title": "Community Challenge: Top Pesticide Reducer",
        "description": "Compete with other farmers in your region! Reduce pesticide usage the most this month to top the leaderboard.",
        "mission_type": MissionType.COMMUNITY,
        "difficulty": MissionDifficulty.HARD,
        "reward_points": 150,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Weekly check-in proof of reduced pesticide usage"),
        "duration_hours": 720,
    },
    {
        "title": "Community Challenge: Water Savers Marathon",
        "description": "Join the water saving marathon! Track and report your weekly water savings. Top 10 farmers win special rewards.",
        "mission_type": MissionType.COMMUNITY,
        "difficulty": MissionDifficulty.MEDIUM,
        "reward_points": 120,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Photo of efficient irrigation in use"),
        "duration_hours": 168,
    },

    # ─── LONG-TERM MISSIONS ───────────────────────────────────
    {
        "title": "Full Organic Transition",
        "description": "Transition your entire farm to certified organic practices over 6 months. No synthetic chemicals, only natural inputs.",
        "mission_type": MissionType.LONG_TERM,
        "difficulty": MissionDifficulty.HARD,
        "reward_points": 500,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_video=True, requires_gps=True,
                                               description="Monthly video progress updates of your farm transformation"),
        "duration_hours": 4320,  # 6 months
    },
    {
        "title": "Zero Chemical Farming - 3 Months",
        "description": "Maintain zero chemical pesticide and synthetic fertilizer use for 3 consecutive months.",
        "mission_type": MissionType.LONG_TERM,
        "difficulty": MissionDifficulty.HARD,
        "reward_points": 300,
        "proof_requirement": ProofRequirement(requires_photo=True, requires_gps=True,
                                               description="Monthly photo proof of your organic farm"),
        "duration_hours": 2160,  # 3 months
    },
]


async def seed_missions():
    """Seed default mission templates if DB is empty."""
    existing_count = await Mission.find_all().count()
    if existing_count > 0:
        logger.info(f"Missions already seeded ({existing_count} found). Skipping.")
        return

    for data in DEFAULT_MISSIONS:
        mission = Mission(
            title=data["title"],
            description=data["description"],
            mission_type=data["mission_type"],
            difficulty=data["difficulty"],
            reward_points=data["reward_points"],
            proof_requirement=data["proof_requirement"],
            duration_hours=data["duration_hours"],
            created_by="system",
        )
        await mission.insert()

    logger.info(f"✅ Seeded {len(DEFAULT_MISSIONS)} mission templates")
