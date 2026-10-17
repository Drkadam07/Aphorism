from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Post, PostLike, Bookmark, Comment, User
from app.schemas import CommentCreate, CommentOut, PostResponse
from app.dependencies import get_current_user
from app.routers.posts import build_post_response

router = APIRouter(prefix="/api/v1/posts", tags=["Interactions"])


@router.post("/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = (
        db.query(PostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    )
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"post_id": post_id, "liked": False}

    db.add(PostLike(user_id=current_user.id, post_id=post_id))
    db.commit()
    return {"post_id": post_id, "liked": True}


@router.post("/{post_id}/save")
def toggle_bookmark(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_bm = (
        db.query(Bookmark).filter_by(user_id=current_user.id, post_id=post_id).first()
    )
    if existing_bm:
        db.delete(existing_bm)
        db.commit()
        return {"post_id": post_id, "saved": False}

    db.add(Bookmark(user_id=current_user.id, post_id=post_id))
    db.commit()
    return {"post_id": post_id, "saved": True}


@router.get("/saved/all", response_model=List[PostResponse])
def get_saved_posts(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    posts = [bm.post for bm in bookmarks if bm.post is not None]
    return [build_post_response(p, current_user) for p in posts]


@router.post(
    "/{post_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = Comment(
        user_id=current_user.id, post_id=post_id, content=comment_in.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.get("/{post_id}/comments", response_model=List[CommentOut])
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
