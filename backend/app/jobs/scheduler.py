from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    """Register all cron jobs and start the scheduler."""
    from app.jobs.score_decay_job import run_score_decay
    from app.jobs.mission_job import run_mission_expiry_check, run_daily_mission_generation
    from app.jobs.leaderboard_job import run_leaderboard_refresh

    # Daily midnight: Generate fresh daily missions
    scheduler.add_job(
        run_daily_mission_generation,
        CronTrigger(hour=0, minute=0),
        id="daily_mission_generation",
        name="Generate Daily Missions",
        replace_existing=True,
    )

    # Every hour: Check for expired missions + reset streaks
    scheduler.add_job(
        run_mission_expiry_check,
        IntervalTrigger(hours=1),
        id="mission_expiry_check",
        name="Mission Expiry Check",
        replace_existing=True,
    )

    # Nightly 2am: Apply score decay for inactive farmers
    scheduler.add_job(
        run_score_decay,
        CronTrigger(hour=2, minute=0),
        id="score_decay",
        name="Score Decay",
        replace_existing=True,
    )

    # Every 6 hours: Refresh leaderboard cache
    scheduler.add_job(
        run_leaderboard_refresh,
        IntervalTrigger(hours=6),
        id="leaderboard_refresh",
        name="Leaderboard Refresh",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("⏰ Scheduler started with all jobs")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("⏰ Scheduler stopped")
