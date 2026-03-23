from app.models.follow import Follow
from app.models.follow_request import FollowRequest, FollowRequestStatus
from app.models.user import User
from app.utils.response_utils import error_response
from datetime import datetime
from typing import List


async def follow_user(follower: User, target_user_id: str) -> dict:
    if str(follower.id) == target_user_id:
        raise ValueError("You cannot follow yourself.")

    target_user = await User.get(target_user_id)
    if not target_user:
        raise ValueError("User not found.")

    # Check if already following
    existing_follow = await Follow.find_one(
        Follow.follower_id == str(follower.id),
        Follow.following_id == target_user_id
    )
    if existing_follow:
        return {"status": "already_following", "message": "You are already following this user."}

    # Check if a request is already pending
    existing_request = await FollowRequest.find_one(
        FollowRequest.from_user_id == str(follower.id),
        FollowRequest.to_user_id == target_user_id,
        FollowRequest.status == FollowRequestStatus.PENDING
    )
    if existing_request:
        return {"status": "request_pending", "message": "Follow request already sent."}

    # If target user is private, create a follow request
    if getattr(target_user, "is_private", False):
        new_request = FollowRequest(
            from_user_id=str(follower.id),
            to_user_id=target_user_id
        )
        await new_request.insert()
        return {
            "status": "requested",
            "message": "Follow request sent to private account."
        }
    
    # If target user is public, follow directly
    new_follow = Follow(
        follower_id=str(follower.id),
        following_id=target_user_id
    )
    await new_follow.insert()
    return {
        "status": "following",
        "message": f"Successfully followed {target_user.name}."
    }


async def unfollow_user(follower: User, target_user_id: str) -> dict:
    follow = await Follow.find_one(
        Follow.follower_id == str(follower.id),
        Follow.following_id == target_user_id
    )
    if follow:
        await follow.delete()
        return {"message": "Unfollowed successfully."}
    
    # Also delete any pending requests if they exist
    request = await FollowRequest.find_one(
        FollowRequest.from_user_id == str(follower.id),
        FollowRequest.to_user_id == target_user_id,
        FollowRequest.status == FollowRequestStatus.PENDING
    )
    if request:
        await request.delete()
        return {"message": "Removed follow request."}

    return {"message": "You were not following this user."}


async def get_pending_requests(user: User) -> List[dict]:
    requests = await FollowRequest.find(
        FollowRequest.to_user_id == str(user.id),
        FollowRequest.status == FollowRequestStatus.PENDING
    ).to_list()
    
    result = []
    for req in requests:
        from_user = await User.get(req.from_user_id)
        if from_user:
            result.append({
                "request_id": str(req.id),
                "user_id": str(from_user.id),
                "name": from_user.name,
                "profile_picture": from_user.profile_picture,
                "created_at": req.created_at.isoformat()
            })
    return result


async def respond_to_request(user: User, request_id: str, accept: bool) -> dict:
    request = await FollowRequest.get(request_id)
    if not request or request.to_user_id != str(user.id):
        raise ValueError("Request not found.")

    if request.status != FollowRequestStatus.PENDING:
        raise ValueError("Request already processed.")

    from_user = await User.get(request.from_user_id)
    if not from_user:
        await request.delete()
        raise ValueError("User who requested no longer exists.")

    if accept:
        request.status = FollowRequestStatus.ACCEPTED
        request.updated_at = datetime.utcnow()
        await request.save()
        
        # Create the follow relationship
        new_follow = Follow(
            follower_id=request.from_user_id,
            following_id=request.to_user_id
        )
        await new_follow.insert()
        return {"message": f"Follow request from {from_user.name} accepted."}
    else:
        request.status = FollowRequestStatus.DECLINED
        request.updated_at = datetime.utcnow()
        await request.save()
        return {"message": f"Follow request from {from_user.name} declined."}


async def get_follow_status(follower: User, target_user_id: str) -> str:
    """Returns 'following', 'requested', or 'none'"""
    if str(follower.id) == target_user_id:
        return "self"
        
    follow = await Follow.find_one(
        Follow.follower_id == str(follower.id),
        Follow.following_id == target_user_id
    )
    if follow:
        return "following"
        
    request = await FollowRequest.find_one(
        FollowRequest.from_user_id == str(follower.id),
        FollowRequest.to_user_id == target_user_id,
        FollowRequest.status == FollowRequestStatus.PENDING
    )
    if request:
        return "requested"
        
    return "none"
