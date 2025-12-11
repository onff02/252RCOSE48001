from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    political_party: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    political_party: Optional[str] = None
    real_name: Optional[str]
    affiliation: Optional[str] = None
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

class EvidenceResponse(BaseModel):
    id: int
    source: str
    publisher: str
    text: str
    url: Optional[str] = None
    
    model_config = {"from_attributes": True}

class ClaimCreate(BaseModel):
    topic_id: int
    title: str
    content: str
    type: str
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
    author: Optional[dict] = None
    user_vote: Optional[str] = None
    evidence: List[EvidenceResponse] = []
    
    model_config = {"from_attributes": True}

class RebuttalCreate(BaseModel):
    claim_id: int
    parent_id: Optional[int] = None
    title: str
    content: str
    type: str  # rebuttal, counter
    evidence: Optional[List[dict]] = []

class RebuttalResponse(BaseModel):
    id: int
    claim_id: int
    parent_id: Optional[int]
    user_id: int
    title: Optional[str] = None
    content: str
    type: str
    votes: int
    created_at: datetime
    author: Optional[dict] = None  # 사용자 정보
    user_vote: Optional[str] = None  # 현재 사용자의 투표 (like, dislike)
    evidence: List[EvidenceResponse] = []
    
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

