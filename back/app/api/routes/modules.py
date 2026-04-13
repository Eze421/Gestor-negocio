from fastapi import APIRouter

from app.schemas.module import ModuleInfo

router = APIRouter()

MODULES = [
    ModuleInfo(key="dashboard", name="Dashboard", status="planned"),
    ModuleInfo(key="ventas", name="Ventas", status="planned"),
    ModuleInfo(key="caja", name="Caja", status="planned"),
    ModuleInfo(key="cobros", name="Cobros", status="planned"),
    ModuleInfo(key="inventario", name="Inventario", status="planned"),
    ModuleInfo(key="clientes", name="Clientes", status="planned"),
    ModuleInfo(key="categorias", name="Categorias", status="planned"),
    ModuleInfo(key="proveedores", name="Proveedores", status="planned"),
]


@router.get("/", response_model=list[ModuleInfo])
def list_modules() -> list[ModuleInfo]:
    return MODULES
