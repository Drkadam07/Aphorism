from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Post, User
from app.schemas import PostCreate, PostResponse
from app.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/v1/posts", tags=["Posts & Quotes"])


def build_post_response(p: Post, current_user: User = None) -> dict:
    liked = False
    saved = False
    if current_user:
        liked = any(like.user_id == current_user.id for like in p.likes)
        saved = any(bm.user_id == current_user.id for bm in p.bookmarks)

    return {
        "id": p.id,
        "content": p.content,
        "author": p.author,
        "created_at": p.created_at,
        "likes_count": len(p.likes),
        "comments_count": len(p.comments),
        "is_liked_by_me": liked,
        "is_saved_by_me": saved,
        "quoted_post": p.quoted_post,
        "parent_id": p.parent_id,
    }


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    root_id = None
    if post_in.parent_id:
        parent_post = db.query(Post).filter(Post.id == post_in.parent_id).first()
        if not parent_post:
            raise HTTPException(status_code=404, detail="Parent thread post not found")
        root_id = parent_post.root_id if parent_post.root_id else parent_post.id

    if post_in.quoted_post_id:
        quoted = db.query(Post).filter(Post.id == post_in.quoted_post_id).first()
        if not quoted:
            raise HTTPException(status_code=404, detail="Quoted post not found")

    new_post = Post(
        author_id=current_user.id,
        content=post_in.content,
        quoted_post_id=post_in.quoted_post_id,
        parent_id=post_in.parent_id,
        root_id=root_id,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return build_post_response(new_post, current_user)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return build_post_response(post, current_user)


@router.get("/{post_id}/thread", response_model=List[PostResponse])
def get_thread(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    base_id = post.root_id if post.root_id else post.id
    thread_posts = (
        db.query(Post)
        .filter((Post.id == base_id) | (Post.root_id == base_id))
        .order_by(Post.created_at.asc())
        .all()
    )

    return [build_post_response(p, current_user) for p in thread_posts]


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this post"
        )
    db.delete(post)
    db.commit()
    return None
