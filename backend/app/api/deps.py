from fastapi import Header, HTTPException
from ..core.config import settings


def require_admin(x_admin_token: str = Header(..., alias="X-Admin-Token")):
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Token admin inválido")
    return True
