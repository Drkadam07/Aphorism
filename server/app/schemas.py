from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., max_length=50)
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)

class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class ResendOTP(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    name: str
    username: str
    email: EmailStr
    bio: Optional[str]
    avatar_url: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=280)

class CommentOut(BaseModel):
    id: int
    content: str
    user: UserOut
    created_at: datetime

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    quoted_post_id: Optional[int] = None
    parent_id: Optional[int] = None

class QuotedPostSummary(BaseModel):
    id: int
    content: str
    author: UserOut
    created_at: datetime

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    content: str
    author: UserOut
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    is_saved_by_me: bool = False
    quoted_post: Optional[QuotedPostSummary] = None
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True