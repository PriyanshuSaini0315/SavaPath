from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    role: str  # "volunteer" or "organisation"
    name: Optional[str] = None  # Full name or Org name
    org_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Volunteer Profile
class VolunteerProfileSchema(BaseModel):
    id: Optional[int] = None
    name: str
    age: Optional[int] = None
    contact: Optional[str] = None
    interests: List[str] = []
    skills: List[str] = []
    experience_level: str = "beginner"  # beginner, some, experienced
    availability: Dict[str, Any] = {"days": [], "hours": []}
    location_lat: float
    location_lng: float
    neighbourhood_name: str
    max_distance_km: float = 10.0
    willingness_to_learn: bool = True

    class Config:
        from_attributes = True

# Organisation Profile
class OrganisationProfileSchema(BaseModel):
    id: Optional[int] = None
    org_name: str
    contact: Optional[str] = None
    location_city: str = "Lucknow"
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Mission & Roles
class MissionRoleSchema(BaseModel):
    id: Optional[int] = None
    role_name: str
    required_skills: List[str] = []
    people_needed: int = 1
    beginner_friendly: bool = False

    class Config:
        from_attributes = True

class MissionCreateSchema(BaseModel):
    title: str
    cause: str
    date: str
    time_slot: str
    location_lat: float
    location_lng: float
    neighbourhood_name: str
    city: str = "Lucknow"
    roles: List[MissionRoleSchema]

class MissionResponseSchema(BaseModel):
    id: int
    org_id: int
    org_name: Optional[str] = None
    title: str
    cause: str
    date: str
    time_slot: str
    location_lat: float
    location_lng: float
    neighbourhood_name: str
    city: str
    created_at: Any
    roles: List[MissionRoleSchema]

    class Config:
        from_attributes = True

# AI Parsing
class ParseMissionRequest(BaseModel):
    prompt: str

# Application Schemas
class ApplicationCreateSchema(BaseModel):
    mission_role_id: int

class ApplicationStatusUpdateSchema(BaseModel):
    status: str  # applied, invited, selected_primary, selected_backup, not_selected

class ApplicationResponseSchema(BaseModel):
    id: int
    mission_role_id: int
    role_name: str
    mission_id: int
    mission_title: str
    mission_date: str
    volunteer_id: int
    volunteer_name: str
    status: str
    match_score: float
    score_breakdown: Dict[str, Any]
    updated_at: Any

    class Config:
        from_attributes = True

# Match Recommendation
class MatchRecommendationSchema(BaseModel):
    mission_id: int
    mission_title: str
    mission_cause: str
    mission_date: str
    mission_time_slot: str
    neighbourhood_name: str
    city: str
    org_name: str
    role_id: int
    role_name: str
    required_skills: List[str]
    beginner_friendly: bool
    people_needed: int
    match_score: float
    distance_km: float
    is_eligible: bool
    breakdown: Dict[str, float]
    why_fits_you: str
    application_status: Optional[str] = None  # None, "applied", "invited", etc.

