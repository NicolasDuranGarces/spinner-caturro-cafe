from pydantic import BaseModel


class RegisterRequest(BaseModel):
    cedula: str
    password: str
    nombre_completo: str
    semestre: str


class LoginRequest(BaseModel):
    cedula: str
    password: str


class ClienteAuthOut(BaseModel):
    id: int
    cedula: str
    nombre_completo: str
    puntos: int

    class Config:
        from_attributes = True

