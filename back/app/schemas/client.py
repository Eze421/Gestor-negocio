from pydantic import BaseModel, ConfigDict, Field


class ClientBase(BaseModel):
    dni: str | None = Field(default=None, max_length=32)
    name: str = Field(min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    dni: str | None = Field(default=None, max_length=32)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    active: bool | None = None


class ClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dni: str | None
    name: str
    phone: str | None
    active: bool
