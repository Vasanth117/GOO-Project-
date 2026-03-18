from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
import logging

logger = logging.getLogger(__name__)


async def connect_db():
    """Initialize MongoDB connection and Beanie ODM."""
    # Import all models here for Beanie registration
    from app.models.user import User
    from app.models.farm_profile import FarmProfile
    from app.models.mission import Mission
    from app.models.mission_progress import MissionProgress
    from app.models.proof_submission import ProofSubmission
    from app.models.score import ScoreLog
    from app.models.streak import Streak
    from app.models.badge import BadgeDefinition, FarmerBadge
    from app.models.reward import Reward
    from app.models.notification import Notification
    from app.models.post import Post
    from app.models.comment import Comment
    from app.models.reaction import Reaction
    from app.models.follow import Follow
    from app.models.product import Product
    from app.models.order import Order
    from app.models.leaderboard import Leaderboard
    from app.models.fraud_flag import FraudFlag
    from app.models.verification import Verification
    from app.models.grc_member import GRCMember
    from app.models.refresh_token import RefreshToken

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    await init_beanie(
        database=db,
        document_models=[
            User,
            FarmProfile,
            Mission,
            MissionProgress,
            ProofSubmission,
            ScoreLog,
            Streak,
            BadgeDefinition,
            FarmerBadge,
            Reward,
            Notification,
            Post,
            Comment,
            Reaction,
            Follow,
            Product,
            Order,
            Leaderboard,
            FraudFlag,
            Verification,
            GRCMember,
            RefreshToken,
        ],
    )
    logger.info(f"✅ Connected to MongoDB: {settings.DB_NAME}")

    return client


async def close_db(client: AsyncIOMotorClient):
    """Close MongoDB connection."""
    client.close()
    logger.info("🔴 MongoDB connection closed")
