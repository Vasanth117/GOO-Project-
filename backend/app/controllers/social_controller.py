from fastapi import UploadFile
from typing import Optional, List
import os
import aiofiles
import hashlib
from datetime import datetime

from app.models.post import Post
from app.models.comment import Comment
from app.models.reaction import Reaction
from app.models.follow import Follow
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.models.badge import FarmerBadge
from app.models.grc_member import GRCMember
from app.schemas.social_schema import CreatePostRequest, CreateCommentRequest
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.services.score_service import get_score_tier
from app.utils.response_utils import error_response, not_found
from app.config import settings
import logging
from beanie.operators import In

logger = logging.getLogger(__name__)


# ─── HELPERS ─────────────────────────────────────────────────

async def _build_author_info(user_id: str) -> dict:
    user = await User.get(user_id)
    if not user:
        return {"id": user_id, "name": "Unknown", "role": "farmer", "profile_picture": None, "score_tier": None}
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == user_id)
    tier = get_score_tier(farm.sustainability_score)["tier"] if farm else None
    return {
        "id": user_id,
        "name": user.name,
        "role": user.role.value,
        "profile_picture": user.profile_picture,
        "score_tier": tier,
    }


async def _post_to_dict(post: Post, viewer_id: str) -> dict:
    author = await _build_author_info(post.author_id)
    liked = await Reaction.find_one(
        Reaction.post_id == str(post.id),
        Reaction.user_id == viewer_id,
    ) is not None
    followed = await Follow.find_one(
        Follow.follower_id == viewer_id,
        Follow.following_id == post.author_id
    ) is not None

    return {
        "id": str(post.id),
        "author": {**author, "is_followed_by_me": followed},
        "content": post.content,
        "image_url": post.image_url,
        "video_url": post.video_url,
        "tags": post.tags,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "is_verified_post": post.is_verified_post,
        "is_liked_by_me": liked,
        "impact": post.impact,
        "mission_progress_id": post.mission_progress_id,
        "created_at": post.created_at.isoformat(),
    }


# ─── POST ACTIONS ────────────────────────────────────────────

async def create_post(
    user: User, 
    content: str, 
    tags: List[str] = [], 
    mission_progress_id: Optional[str] = None,
    image: Optional[UploadFile] = None
) -> dict:
    image_url = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1]
        filename = f"{user.id}_{datetime.utcnow().timestamp()}{ext}"
        post_dir = os.path.join(settings.UPLOAD_DIR, "posts")
        os.makedirs(post_dir, exist_ok=True)
        
        path = os.path.join(post_dir, filename)
        async with aiofiles.open(path, "wb") as f:
            content_bytes = await image.read()
            await f.write(content_bytes)
        
        image_url = f"/uploads/posts/{filename}"

    post = Post(
        author_id=str(user.id),
        content=content,
        tags=tags,
        image_url=image_url,
        mission_progress_id=mission_progress_id,
    )
    # Generate some random/mock impact stats if none provided (for flavor)
    post.impact = {
        "water": f"{len(content)*2}L saved",
        "chemical": f"{len(tags)*10}g avoided",
        "method": "Organic" if "organic" in [t.lower() for t in tags] else "Eco-Friendly"
    }
    
    await post.insert()
    logger.info(f"Post created by {user.id}")
    return await _post_to_dict(post, str(user.id))


from beanie.operators import In

async def get_feed(user: User, page: int = 1, limit: int = 20, post_type: Optional[str] = None) -> dict:
    """
    Returns paginated feed: posts from followed users + recent community posts.
    """
    skip = (page - 1) * limit

    # Get followed user IDs
    follows = await Follow.find(Follow.follower_id == str(user.id)).to_list()
    following_ids = [f.following_id for f in follows]
    following_ids.append(str(user.id))  # Include own posts

    # Query building
    query = In(Post.author_id, following_ids)
    if post_type == "missions":
        query = { "$and": [ { "author_id": { "$in": following_ids } }, { "mission_progress_id": { "$ne": None } } ] }
    elif post_type == "eco":
        # posts with chemical or water impact
        query = { "$and": [ { "author_id": { "$in": following_ids } }, { "impact": { "$ne": None } } ] }

    # Fetch posts
    posts = (
        await Post.find(query)
        .sort(-Post.created_at)
        .skip(skip)
        .limit(limit)
        .to_list()
    )

    # If feed is sparse, pad with recent community posts
    if len(posts) < limit:
        extra_limit = limit - len(posts)
        found_ids = {str(p.id) for p in posts}
        extra = await Post.find().sort(-Post.created_at).limit(extra_limit + 10).to_list()
        for p in extra:
            if str(p.id) not in found_ids and len(posts) < limit:
                posts.append(p)

    total_following_posts = await Post.find(In(Post.author_id, following_ids)).count()

    enriched = [await _post_to_dict(p, str(user.id)) for p in posts]
    return {
        "page": page, "limit": limit,
        "total": total_following_posts,
        "has_next": (skip + limit) < total_following_posts,
        "posts": enriched,
    }


async def get_my_posts(user: User, page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    posts = await Post.find(Post.author_id == str(user.id)).sort(-Post.created_at).skip(skip).limit(limit).to_list()
    total = await Post.find(Post.author_id == str(user.id)).count()
    enriched = [await _post_to_dict(p, str(user.id)) for p in posts]
    return {"page": page, "limit": limit, "total": total, "has_next": (skip + limit) < total, "posts": enriched}


async def delete_post(post_id: str, user: User) -> dict:
    post = await Post.get(post_id)
    if not post:
        not_found("Post")
    if post.author_id != str(user.id) and user.role.value != "admin":
        error_response("You can only delete your own posts", 403)
    await post.delete()
    return {"message": "Post deleted"}


# ─── LIKE / UNLIKE ───────────────────────────────────────────

async def toggle_like(post_id: str, user: User) -> dict:
    post = await Post.get(post_id)
    if not post:
        not_found("Post")

    existing = await Reaction.find_one(
        Reaction.post_id == post_id,
        Reaction.user_id == str(user.id),
    )
    if existing:
        await existing.delete()
        post.likes_count = max(0, post.likes_count - 1)
        await post.save()
        return {"liked": False, "likes_count": post.likes_count}
    else:
        await Reaction(post_id=post_id, user_id=str(user.id)).insert()
        post.likes_count += 1
        await post.save()
        # Notify post owner (not self)
        if post.author_id != str(user.id):
            await send_notification(
                user_id=post.author_id,
                notif_type=NotificationType.POST_LIKE,
                title="❤️ Someone liked your post",
                message=f"{user.name} liked your post.",
                link=f"/posts/{post_id}",
            )
        return {"liked": True, "likes_count": post.likes_count}


# ─── COMMENTS ────────────────────────────────────────────────

async def add_comment(post_id: str, user: User, data: CreateCommentRequest) -> dict:
    post = await Post.get(post_id)
    if not post:
        not_found("Post")

    comment = Comment(post_id=post_id, author_id=str(user.id), content=data.content)
    await comment.insert()

    post.comments_count += 1
    await post.save()

    if post.author_id != str(user.id):
        await send_notification(
            user_id=post.author_id,
            notif_type=NotificationType.POST_COMMENT,
            title="💬 New comment on your post",
            message=f"{user.name}: {data.content[:60]}",
            link=f"/posts/{post_id}",
        )

    author = await _build_author_info(str(user.id))
    return {
        "id": str(comment.id),
        "author": author,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
    }


async def get_comments(post_id: str, page: int = 1, limit: int = 20) -> dict:
    post = await Post.get(post_id)
    if not post:
        not_found("Post")
    skip = (page - 1) * limit
    comments = await Comment.find(Comment.post_id == post_id).sort(Comment.created_at).skip(skip).limit(limit).to_list()
    total = await Comment.find(Comment.post_id == post_id).count()
    enriched = []
    for c in comments:
        author = await _build_author_info(c.author_id)
        enriched.append({"id": str(c.id), "author": author, "content": c.content, "created_at": c.created_at.isoformat()})
    return {"page": page, "limit": limit, "total": total, "has_next": (skip + limit) < total, "comments": enriched}


# ─── FOLLOW / UNFOLLOW ───────────────────────────────────────

async def toggle_follow(target_user_id: str, user: User) -> dict:
    if target_user_id == str(user.id):
        error_response("You cannot follow yourself", 400)

    target = await User.get(target_user_id)
    if not target:
        not_found("User")

    existing = await Follow.find_one(
        Follow.follower_id == str(user.id),
        Follow.following_id == target_user_id,
    )
    if existing:
        await existing.delete()
        return {"following": False, "message": f"Unfollowed {target.name}"}
    else:
        await Follow(follower_id=str(user.id), following_id=target_user_id).insert()
        await send_notification(
            user_id=target_user_id,
            notif_type=NotificationType.NEW_FOLLOWER,
            title="👤 New Follower!",
            message=f"{user.name} started following you.",
            link=f"/profile/{user.id}",
        )
        return {"following": True, "message": f"Now following {target.name}"}


# ─── PROFILE ─────────────────────────────────────────────────

async def get_profile(target_user_id: str, viewer: User) -> dict:
    target = await User.get(target_user_id)
    if not target:
        not_found("User")

    farm = await FarmProfile.find_one(FarmProfile.farmer_id == target_user_id)
    badges = await FarmerBadge.find(FarmerBadge.farmer_id == target_user_id).count()
    posts = await Post.find(Post.author_id == target_user_id).count()
    followers = await Follow.find(Follow.following_id == target_user_id).count()
    following = await Follow.find(Follow.follower_id == target_user_id).count()
    is_following = await Follow.find_one(
        Follow.follower_id == str(viewer.id),
        Follow.following_id == target_user_id,
    ) is not None
    is_grc = await GRCMember.find_one(GRCMember.farmer_id == target_user_id) is not None

    tier = get_score_tier(farm.sustainability_score) if farm else None

    return {
        "id": target_user_id,
        "name": target.name,
        "role": target.role.value,
        "bio": target.bio,
        "profile_picture": target.profile_picture,
        "sustainability_score": farm.sustainability_score if farm else None,
        "score_tier": tier["tier"] if tier else None,
        "badges_count": badges,
        "posts_count": posts,
        "followers_count": followers,
        "following_count": following,
        "is_following": is_following,
        "is_grc_member": is_grc,
        "joined_at": target.created_at.isoformat(),
    }


async def get_followers(user_id: str, page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    follows = await Follow.find(Follow.following_id == user_id).skip(skip).limit(limit).to_list()
    total = await Follow.find(Follow.following_id == user_id).count()
    users = []
    for f in follows:
        u = await User.get(f.follower_id)
        if u:
            users.append({"id": str(u.id), "name": u.name, "role": u.role.value, "profile_picture": u.profile_picture})
    return {"page": page, "limit": limit, "total": total, "has_next": (skip + limit) < total, "users": users}


async def get_following(user_id: str, page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    follows = await Follow.find(Follow.follower_id == user_id).skip(skip).limit(limit).to_list()
    total = await Follow.find(Follow.follower_id == user_id).count()
    users = []
    for f in follows:
        u = await User.get(f.following_id)
        if u:
            users.append({"id": str(u.id), "name": u.name, "role": u.role.value, "profile_picture": u.profile_picture})
    return {"page": page, "limit": limit, "total": total, "has_next": (skip + limit) < total, "users": users}
