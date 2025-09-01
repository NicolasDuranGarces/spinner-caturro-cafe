from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # App
    app_name: str = "Caturro Café Underground API"
    version: str = "1.0.0"
    root_path: str = "/api"

    # Security / CORS
    admin_token: str
    cors_origins: List[str] = ["http://localhost:3000"]

    # Database
    database_url: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


settings = Settings()
