from pydantic import BaseModel, Field, validator
from typing import List, Optional, ClassVar
from enum import Enum

class GenderType(str, Enum):
    GENDER_NEUTRAL = "Gender-Neutral"
    FEMALE_ONLY = "Female-only (including Supernumerary)"
    MALE_ONLY = "Male-only"

class CategoryType(str, Enum):
    GENERAL = "GENERAL"
    OPEN = "OPEN"
    OBC = "OBC"
    OBC_NCL = "OBC-NCL"
    SC = "SC"
    ST = "ST"
    EWS = "EWS"

class StudentInput(BaseModel):
    rank: int = Field(..., ge=1, description="JEE rank (must be positive)")
    category: CategoryType = Field(..., description="Student category")
    gender: GenderType = Field(..., description="Gender preference")
    home_city: Optional[str] = None
    preferred_institutes: List[str] = Field(
        default=["IIT", "NIT", "IIIT", "GFTI"], 
        description="Preferred institute types"
    )
    preferred_branches: List[str] = Field(
        default=["CSE", "ECE", "ME", "CE"], 
        description="Preferred branches"
    )
    max_distance_km: Optional[int] = Field(
        default=None, 
        ge=0, 
        description="Maximum distance from home in kilometers"
    )
    priority_preference: Optional[str] = Field(
        default="rank", 
        description="Priority: 'rank', 'distance', or 'institute'"
    )
    max_closing_rank: Optional[int] = Field(
        default=None,
        ge=1,
        description="Maximum closing rank to filter colleges (optional)"
    )

    @validator('rank')
    def validate_rank(cls, v):
        if v <= 0:
            raise ValueError('Rank must be a positive integer')
        if v > 1000000:  # Reasonable upper limit
            raise ValueError('Rank seems too high, please check')
        return v

    @validator('preferred_institutes')
    def validate_institutes(cls, v):
        # Allow empty list for relaxed filtering
        return v

    @validator('preferred_branches')
    def validate_branches(cls, v):
        # Allow empty list for relaxed filtering
        return v

    model_config: ClassVar[dict] = {
        "json_schema_extra": {
            "example": {
                "rank": 23000,
                "category": "OBC",
                "gender": "Female-only",
                "home_city": "Chennai",
                "preferred_institutes": ["NIT", "IIIT"],
                "preferred_branches": ["CSE", "ECE"],
                "max_distance_km": 500,
                "priority_preference": "rank"
            }
        }
    }