from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    political_party: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    political_party: Optional[str]
    real_name: Optional[str]
    affiliation: Optional[str]
    level: int
    
    model_config = {"from_attributes": True}

class TopicCreate(BaseModel):
    title: str
    category: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    topic_type: str  # topic, region, pledge

class TopicResponse(BaseModel):
    id: int
    title: str
    category: Optional[str]
    region: Optional[str]
    district: Optional[str]
    topic_type: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

class ClaimCreate(BaseModel):
    topic_id: int
    title: str
    content: str
    type: str  # pro, con
    evidence: Optional[List[dict]] = []

class ClaimResponse(BaseModel):
    id: int
    topic_id: int
    user_id: int
    title: str
    content: str
    type: str
    votes: int
    sticker: Optional[str]
    created_at: datetime
    author: Optional[dict] = None  # 사용자 정보
    
    model_config = {"from_attributes": True}

class RebuttalCreate(BaseModel):
    claim_id: int
    parent_id: Optional[int] = None
    content: str
    type: str  # rebuttal, counter

class RebuttalResponse(BaseModel):
    id: int
    claim_id: int
    parent_id: Optional[int]
    user_id: int
    content: str
    type: str
    votes: int
    created_at: datetime
    author: Optional[dict] = None  # 사용자 정보
    user_vote: Optional[str] = None  # 현재 사용자의 투표 (like, dislike)
    
    model_config = {"from_attributes": True}

class VoteCreate(BaseModel):
    claim_id: Optional[int] = None
    rebuttal_id: Optional[int] = None
    vote_type: str  # like, dislike

class ClaimResponse(BaseModel):
    id: int
    topic_id: int
    user_id: int
    title: str
    content: str
    type: str
    votes: int
    sticker: Optional[str]
    created_at: datetime
    author: Optional[dict] = None  # 사용자 정보
    user_vote: Optional[str] = None  # 현재 사용자의 투표 (like, dislike)
    
    model_config = {"from_attributes": True}

