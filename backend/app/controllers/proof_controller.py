import os
import hashlib
import aiofiles
from fastapi import UploadFile
from datetime import datetime
from typing import Optional

from app.models.proof_submission import ProofSubmission, ProofStatus, ProofMetadata
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.models.score import ScoreChangeReason
from app.services.mission_service import complete_mission
from app.services.score_service import update_score
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.gps_utils import is_within_farm_radius
from app.utils.response_utils import error_response, not_found
from app.services import ai_service
from app.models.proof_submission import AIAnalysisResult
from app.config import settings
import logging

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


# ─── FILE HELPERS ────────────────────────────────────────────

async def _save_file(file: UploadFile, farmer_id: str) -> tuple[str, str, str]:
    """Save uploaded file and return (file_url, file_type, file_hash)."""
    content = await file.read()

    # Size check
    if len(content) > MAX_BYTES:
        error_response(f"File too large. Max size is {settings.MAX_FILE_SIZE_MB}MB.", 413)

    # Type detection
    content_type = file.content_type or ""
    if content_type in ALLOWED_IMAGE_TYPES:
        file_type = "image"
        ext = content_type.split("/")[1]
    elif content_type in ALLOWED_VIDEO_TYPES:
        file_type = "video"
        ext = "mp4"
    else:
        error_response("Invalid file type. Only JPEG, PNG, WebP images and MP4 videos are allowed.", 415)

    # Hash for duplicate detection
    file_hash = hashlib.sha256(content).hexdigest()

    # Save to disk
    upload_dir = os.path.join(settings.UPLOAD_DIR, "proofs", farmer_id)
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{file_hash}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    if not os.path.exists(filepath):
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)

    file_url = f"/uploads/proofs/{farmer_id}/{filename}"
    return file_url, file_type, file_hash


# ─── FARMER: SUBMIT PROOF ────────────────────────────────────

async def submit_proof(
    user: User,
    mission_progress_id: str,
    file: UploadFile,
    latitude: float,
    longitude: float,
    tasks_summary: str = "",
    organic_materials: str = "",
) -> dict:
    """
    Farmer submits proof for a mission in-progress.
    Validates GPS, timestamp, duplicate check, then saves.
    Sets status → pending_review (expert must approve).
    """
    # 1. Fetch mission progress
    mp = await MissionProgress.get(mission_progress_id)
    if not mp or mp.farmer_id != str(user.id):
        not_found("Mission")

    if mp.status not in (MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS):
        error_response(f"Cannot submit proof for mission with status '{mp.status.value}'", 400)

    if mp.expires_at < datetime.utcnow():
        error_response("This mission has expired", 400)

    # 2. Fetch farm profile for GPS validation (Make Optional for Demo/Onboarding)
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    
    # 3. GPS validation — must be within 5km of farm IF farm location exists
    if farm and getattr(farm, "location", None):
        if not is_within_farm_radius(
            proof_lat=latitude,
            proof_lon=longitude,
            farm_lat=farm.location.latitude,
            farm_lon=farm.location.longitude,
        ):
            error_response(
                "GPS location does not match your farm location. "
                "Please submit proof from within your farm area.", 400
            )

    # 4. Save file and get hash
    file_url, file_type, file_hash = await _save_file(file, str(user.id))

    # 5. Duplicate detection — same file hash already submitted
    duplicate = await ProofSubmission.find_one(
        ProofSubmission.metadata.file_hash == file_hash
    )
    if duplicate:
        error_response("This image/video has already been submitted before. Please submit a new, unique proof.", 409)

    # 6. Create ProofSubmission (initial status PENDING_AI)
    proof = ProofSubmission(
        farmer_id=str(user.id),
        mission_progress_id=mission_progress_id,
        file_url=file_url,
        file_type=file_type,
        tasks_summary=tasks_summary,
        organic_materials=organic_materials,
        metadata=ProofMetadata(
            latitude=latitude,
            longitude=longitude,
            timestamp=datetime.utcnow(),
            file_hash=file_hash,
        ),
        status=ProofStatus.PENDING_AI,
    )
    await proof.insert()

    # 7. AI Vision Analysis (if image)
    ai_status_msg = ""
    if file_type == "image":
        try:
            # We need to re-read for AI or pass the content 
            # (already read but _save_file might have modified state, though it's bytes)
            # Re-reading to be safe
            await file.seek(0)
            img_bytes = await file.read()
            
            # Fetch the actual mission template to get its TITLE and DESCRIPTION for the AI
            mp = await MissionProgress.get(mission_progress_id)
            from app.models.mission import Mission
            mission_template = await Mission.get(mp.mission_id)
            
            mission_context = (
                f"MISSION TITLE: {mission_template.title if mission_template else 'Unknown Task'}. "
                f"DESCRIPTION: {mission_template.description if mission_template else 'Verify general farming activity.'}"
            )

            system_prompt = (
        "You are a BRUTALLY STRICT Agricultural Quality Auditor for the GOO platform. "
        "Your sole job is to PREVENT FRAUD and ensure only real farming tasks are rewarded. "
        "\n\nVERIFICATION PROTOCOL:"
        "\n1. READ the 'MISSION TO VERIFY' text carefully. "
        "\n2. AUDIT the photo for specific visual evidence of that EXACT task. "
        "\n3. If the photo is irrelevant, poorly lit, blurry, or shows indoor generic scenes -> REJECT IMMEDIATELY. "
        "\n4. If the task is 'Watering' but no water, wet soil, or watering tools are visible -> REJECT."
        "\n5. If the task is 'Pruning' but no cut branches or pruning shears are visible -> REJECT."
        "\n6. If the photo is a selfie or a person not doing the task -> REJECT."
        "\n7. DO NOT GIVE PROBATION. IF NOT CLEARLY VALID, IT IS INVALID. "
        "\n\nOUTPUT FORMAT (JSON ONLY): "
        "{\"is_valid\": boolean, \"confidence\": 0.0-1.0, \"analysis_notes\": \"Detailed audit reason\"}"
    )
            ai_analysis = await ai_service.analyze_farming_proof(img_bytes, mission_context, system_prompt=system_prompt)
            
            is_valid = ai_analysis.get("is_valid", False)
            confidence = ai_analysis.get("confidence", 0.0)
            notes = ai_analysis.get("analysis_notes", "AI could not identify the task in this proof.")

            proof.ai_result = {"is_valid": is_valid, "confidence": confidence, "notes": notes}
            
            # ── STRICTURE ──────────────────────────────────────────
            # Rejection: If AI says it's not valid OR if confidence is extremely low (< 0.4)
            if not is_valid or confidence < 0.4:
                proof.status = ProofStatus.REJECTED
                mp.status = MissionStatus.ACTIVE # Re-activate mission
                await proof.save()
                await mp.save()
                error_response(f"AI Audit Failed: {notes}", 400)

            # High confidence auto-approval OR Community tasks (always verified by AI)
            from app.models.mission import Mission, MissionType
            mission_template = await Mission.get(mp.mission_id)
            is_community = mission_template.mission_type == MissionType.COMMUNITY if mission_template else False

            if (is_valid and confidence >= 0.9) or (is_community and is_valid):
                proof.status = ProofStatus.APPROVED
                await proof.save()
                await complete_mission(mission_progress=mp, approved_by="AI_SYSTEM_VERIFIED")
                ai_status_msg = "AI has instantly verified your work! "
                return {
                    "proof_id": str(proof.id),
                    "status": "approved",
                    "ai_analyzed": True,
                    "message": f"Mission Complete! {ai_status_msg}Points awarded.",
                    "file_url": file_url,
                }
            else:
                proof.status = ProofStatus.PENDING_REVIEW
                ai_status_msg = "Proof is undergoing secondary verification. "
        except Exception as e:
            logger.error(f"AI Vision Exception: {e}")
            proof.status = ProofStatus.PENDING_REVIEW
            mp.status = MissionStatus.PENDING_REVIEW
            ai_status_msg = "AI verification skipped due to system load. Punted to manual review. "
    else:
        proof.status = ProofStatus.PENDING_REVIEW

    await proof.save()

    # 8. Update mission progress status
    mp.status = MissionStatus.PENDING_REVIEW
    mp.proof_submission_id = str(proof.id)
    if not mp.started_at:
        mp.started_at = datetime.utcnow()
    await mp.save()

    # 9. Notify farmer
    await send_notification(
        user_id=str(user.id),
        notif_type=NotificationType.SYSTEM,
        title="📸 Proof Submitted!",
        message=f"{ai_status_msg}Your proof is under review.",
        link="/missions",
    )

    logger.info(f"Proof submitted by {user.id} for mission {mission_progress_id}. AI Result: {proof.ai_result is not None}")

    return {
        "proof_id": str(proof.id),
        "status": proof.status.value,
        "ai_analyzed": proof.ai_result is not None,
        "message": f"Proof submitted successfully. {ai_status_msg}Awaiting expert review.",
        "file_url": file_url,
    }


# ─── FARMER: VIEW OWN PROOFS ─────────────────────────────────

async def get_my_proofs(user: User, page: int = 1, limit: int = 20) -> dict:
    """Farmer views their own proof submission history."""
    skip = (page - 1) * limit
    proofs = await ProofSubmission.find(
        ProofSubmission.farmer_id == str(user.id)
    ).sort(-ProofSubmission.submitted_at).skip(skip).limit(limit).to_list()

    total = await ProofSubmission.find(
        ProofSubmission.farmer_id == str(user.id)
    ).count()

    return {
        "page": page, "limit": limit, "total": total,
        "has_next": (skip + limit) < total,
        "proofs": [_proof_to_dict(p) for p in proofs],
    }


# ─── EXPERT: VIEW FLAGGED PROOFS ─────────────────────────────

async def get_flagged_proofs(reviewer: User, page: int = 1, limit: int = 20) -> dict:
    """Expert/Admin views all proofs pending review."""
    skip = (page - 1) * limit
    proofs = await ProofSubmission.find(
        ProofSubmission.status == ProofStatus.PENDING_REVIEW
    ).sort(ProofSubmission.submitted_at).skip(skip).limit(limit).to_list()

    total = await ProofSubmission.find(
        ProofSubmission.status == ProofStatus.PENDING_REVIEW
    ).count()

    return {
        "page": page, "limit": limit, "total": total,
        "has_next": (skip + limit) < total,
        "proofs": [_proof_to_dict(p) for p in proofs],
    }


# ─── EXPERT: REVIEW PROOF ────────────────────────────────────

async def review_proof(
    proof_id: str,
    reviewer: User,
    decision: str,
    notes: Optional[str] = None,
) -> dict:
    """
    Expert/Admin approves or rejects a proof.
    approve → triggers mission completion cascade
    reject  → notifies farmer, can resubmit
    """
    proof = await ProofSubmission.get(proof_id)
    if not proof:
        not_found("Proof submission")

    if proof.status != ProofStatus.PENDING_REVIEW:
        error_response(f"Proof is already '{proof.status.value}', cannot review again.", 400)

    proof.reviewer_id = str(reviewer.id)
    proof.reviewer_notes = notes
    proof.reviewed_at = datetime.utcnow()

    mp = await MissionProgress.get(proof.mission_progress_id)
    if not mp:
        not_found("Mission progress")

    if decision == "approve":
        proof.status = ProofStatus.APPROVED
        await proof.save()

        # Trigger full mission completion cascade
        result = await complete_mission(
            mission_progress=mp,
            approved_by=str(reviewer.id),
        )

        # 7.5 Create social post for achievement
        try:
            from app.controllers import social_controller
            from app.models.mission import Mission
            from app.models.post import Post
            
            mission_template = await Mission.get(mp.mission_id)
            mission_title = mission_template.title if mission_template else "a farming mission"
            
            await social_controller.create_post(
                user=await User.get(proof.farmer_id),
                content=f"Mission Accomplished! 🌟 Just completed: {mission_title}. Doing my part for the planet!",
                tags=["Achievement", "Organic", "Sustainable"],
                mission_progress_id=str(mp.id),
                image=None
            )
            # Link proof image to the post
            post = await Post.find_one(Post.mission_progress_id == str(mp.id))
            if post:
                post.image_url = proof.file_url
                await post.save()
        except Exception as e:
            logger.error(f"Failed to create accomplishment post: {e}")

        # Award community verification bonus score
        await update_score(
            farmer_id=proof.farmer_id,
            reason=ScoreChangeReason.COMMUNITY_VERIFIED,
            description=f"Proof verified by expert {reviewer.name}",
        )

        await send_notification(
            user_id=proof.farmer_id,
            notif_type=NotificationType.PROOF_APPROVED,
            title="✅ Proof Approved!",
            message=f"Your proof was approved by {reviewer.name}. Mission complete!",
        )

        logger.info(f"Proof {proof_id} APPROVED by {reviewer.id}")
        return {"status": "approved", "mission_result": result}

    else:  # reject
        proof.status = ProofStatus.REJECTED
        await proof.save()

        # Reset mission to ACTIVE so farmer can resubmit
        mp.status = MissionStatus.ACTIVE
        mp.proof_submission_id = None
        await mp.save()

        # Penalty
        await update_score(
            farmer_id=proof.farmer_id,
            reason=ScoreChangeReason.PROOF_REJECTED,
            description=f"Proof rejected by {reviewer.name}: {notes or 'No reason given'}",
        )

        await send_notification(
            user_id=proof.farmer_id,
            notif_type=NotificationType.PROOF_REJECTED,
            title="❌ Proof Rejected",
            message=f"Your proof was rejected: {notes or 'Please resubmit with a clearer photo.'}",
            link="/missions",
        )

        logger.info(f"Proof {proof_id} REJECTED by {reviewer.id}")
        return {"status": "rejected", "notes": notes}


# ─── SERIALIZER ──────────────────────────────────────────────

def _proof_to_dict(proof: ProofSubmission) -> dict:
    return {
        "id": str(proof.id),
        "farmer_id": proof.farmer_id,
        "mission_progress_id": proof.mission_progress_id,
        "file_url": proof.file_url,
        "file_type": proof.file_type,
        "gps": {
            "latitude": proof.metadata.latitude,
            "longitude": proof.metadata.longitude,
        },
        "status": proof.status.value,
        "reviewer_id": proof.reviewer_id,
        "reviewer_notes": proof.reviewer_notes,
        "reviewed_at": proof.reviewed_at.isoformat() if proof.reviewed_at else None,
        "submitted_at": proof.submitted_at.isoformat(),
    }
