from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import router
from app.models import Cliente, Promocion, RegistroRuleta  # ensure model import for metadata


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.version, root_path=settings.root_path)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup():
        # Create tables on startup (simple setup; replace with Alembic in prod)
        Base.metadata.create_all(bind=engine)

    app.include_router(router)

    return app


app = create_app()
