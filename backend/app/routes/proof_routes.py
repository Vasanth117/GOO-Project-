from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from app.controllers import proof_controller
from app.schemas.mission_schema import ReviewProofRequest
from app.middleware.auth_middleware import get_current_user, require_farmer, require_expert
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/proofs", tags=["Proof Verification"])


# ─── FARMER ROUTES ───────────────────────────────────────────

@router.post("/submit", summary="Submit proof for a mission (multipart)")
async def submit_proof(
    mission_progress_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_farmer),
):
    """
    Submit a proof photo/video.
    - mission_progress_id: from active missions list
    - latitude / longitude: current GPS location (must be near farm)
    - file: photo (JPEG/PNG/WebP) or video (MP4)
    """
    result = await proof_controller.submit_proof(
        user=current_user,
        mission_progress_id=mission_progress_id,
        file=file,
        latitude=latitude,
        longitude=longitude,
    )
    return success_response(result, "Proof submitted for review")


@router.get("/my-proofs", summary="View my proof submission history")
async def get_my_proofs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_farmer),
):
    result = await proof_controller.get_my_proofs(current_user, page=page, limit=limit)
    return success_response(result)


# ─── EXPERT / ADMIN ROUTES ───────────────────────────────────

@router.get("/flagged", summary="Expert: View proofs pending review")
async def get_flagged_proofs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_expert),
):
    result = await proof_controller.get_flagged_proofs(current_user, page=page, limit=limit)
    return success_response(result)


@router.patch("/{proof_id}/review", summary="Expert: Approve or reject a proof")
async def review_proof(
    proof_id: str,
    data: ReviewProofRequest,
    current_user: User = Depends(require_expert),
):
    result = await proof_controller.review_proof(
        proof_id=proof_id,
        reviewer=current_user,
        decision=data.decision,
        notes=data.notes,
    )
    return success_response(result, f"Proof {data.decision}d successfully")
