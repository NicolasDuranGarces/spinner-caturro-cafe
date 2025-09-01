from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignorar variables adicionales del .env
    )
    # App
    app_name: str = "Caturro Café Underground API"
    version: str = "1.0.0"
    root_path: str = "/api"

    # Security / CORS
    admin_token: str
    # Permite string separada por comas o lista
    cors_origins: Union[List[str], str] = "http://localhost:3000"

    # Database
    database_url: str

    @property
    def cors_origins_list(self) -> List[str]:
        v = self.cors_origins
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


settings = Settings()
