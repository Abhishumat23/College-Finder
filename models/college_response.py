from pydantic import BaseModel
from typing import Optional, Dict, Any, ClassVar, List

class QuotaOption(BaseModel):
    quota: str
    opening_rank: Optional[int]
    closing_rank: int

class CollegeResponse(BaseModel):
    institute_name: str
    college_name: str
    branch: str
    quota_options: List[QuotaOption]
    category: str
    gender: str
    state: str
    city: Optional[str]
    distance_km: Optional[float]
    institute_type: str
    recommendation_score: float
    cutoff_year: Optional[str]
    additional_info: Optional[Dict[str, Any]] = {}

    model_config: ClassVar[dict] = {
        "json_schema_extra": {
            "example": {
                "institute_name": "IIT Madras",
                "college_name": "Indian Institute of Technology Madras",
                "branch": "Computer Science and Engineering",
                "quota_options": [
                    {
                        "quota": "HS",
                        "opening_rank": 2000,
                        "closing_rank": 2500
                    },
                    {
                        "quota": "OS",
                        "opening_rank": 1500,
                        "closing_rank": 2000
                    }
                ],
                "category": "OBC",
                "gender": "Gender-Neutral",
                "state": "Tamil Nadu",
                "city": "Chennai",
                "distance_km": 15.5,
                "institute_type": "IIT",
                "recommendation_score": 95.5,
                "cutoff_year": "2023"
            }
        }
    }