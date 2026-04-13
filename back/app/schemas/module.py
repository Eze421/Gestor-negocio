from pydantic import BaseModel


class ModuleInfo(BaseModel):
    key: str
    name: str
    status: str
