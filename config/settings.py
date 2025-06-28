from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    data_folder_path: str = "data"
    max_recommendations: int = 50
    geocoding_timeout: int = 10
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()