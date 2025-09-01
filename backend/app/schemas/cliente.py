from pydantic import BaseModel


class ClienteCreate(BaseModel):
    nombre_completo: str
    semestre: str


class ClienteOut(BaseModel):
    id: int
    nombre_completo: str
    semestre: str

    class Config:
        from_attributes = True

