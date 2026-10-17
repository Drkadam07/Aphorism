from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models import Post, PostLike, Bookmark, User
from app.schemas import PostResponse
from app.dependencies import get_optional_current_user

router = APIRouter(prefix="/api/v1/feed", tags=["Feed"])


@router.get("", response_model=List[PostResponse])
def get_feed(
    cursor: Optional[int] = Query(None, description="Cursor for pagination (Post ID)"),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    query = db.query(Post).filter(
        Post.parent_id == None
    )  # Primary timeline: only top-level posts and quotes
    if cursor:
        query = query.filter(Post.id < cursor)

    posts = query.order_by(Post.id.desc()).limit(limit).all()

    # Optimized batch lookup to prevent N+1 queries for like/save status
    liked_ids, saved_ids = set(), set()
    if current_user and posts:
        post_ids = [p.id for p in posts]
        liked_ids = set(
            row[0]
            for row in db.query(PostLike.post_id)
            .filter(PostLike.user_id == current_user.id, PostLike.post_id.in_(post_ids))
            .all()
        )
        saved_ids = set(
            row[0]
            for row in db.query(Bookmark.post_id)
            .filter(Bookmark.user_id == current_user.id, Bookmark.post_id.in_(post_ids))
            .all()
        )

    return [
        {
            "id": p.id,
            "content": p.content,
            "author": p.author,
            "created_at": p.created_at,
            "likes_count": len(p.likes),
            "comments_count": len(p.comments),
            "is_liked_by_me": p.id in liked_ids,
            "is_saved_by_me": p.id in saved_ids,
            "quoted_post": p.quoted_post,
            "parent_id": p.parent_id,
        }
        for p in posts
    ]
