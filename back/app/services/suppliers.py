from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.supplier import Supplier
from app.repositories.catalog import ProductRepository
from app.repositories.suppliers import SupplierRepository
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.services.catalog import _normalize_name
from app.services.clients import _normalize_optional_text


class SupplierService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SupplierRepository(db)
        self.product_repository = ProductRepository(db)

    def list_suppliers(self, *, search: str | None = None) -> list[Supplier]:
        return self.repository.list(search=search)

    def get_supplier(self, supplier_id: int) -> Supplier:
        supplier = self.repository.get_by_id(supplier_id)
        if supplier is None:
            raise LookupError("Proveedor no encontrado")
        return supplier

    def create_supplier(self, payload: SupplierCreate) -> Supplier:
        name = _normalize_name(payload.name)
        if self.repository.get_by_name(name):
            raise ValueError("Ya existe un proveedor con ese nombre")

        supplier = Supplier(
            name=name,
            phone=_normalize_optional_text(payload.phone),
            email=_normalize_optional_text(payload.email),
            address=_normalize_optional_text(payload.address),
            products=self._resolve_products(payload.product_ids),
        )
        self.repository.create(supplier)
        self.db.commit()
        return self.get_supplier(supplier.id)

    def update_supplier(self, supplier_id: int, payload: SupplierUpdate) -> Supplier:
        supplier = self.get_supplier(supplier_id)

        if payload.name is not None:
            name = _normalize_name(payload.name)
            existing = self.repository.get_by_name(name)
            if existing and existing.id != supplier.id:
                raise ValueError("Ya existe un proveedor con ese nombre")
            supplier.name = name

        if payload.phone is not None:
            supplier.phone = _normalize_optional_text(payload.phone)
        if payload.email is not None:
            supplier.email = _normalize_optional_text(payload.email)
        if payload.address is not None:
            supplier.address = _normalize_optional_text(payload.address)
        if payload.product_ids is not None:
            supplier.products = self._resolve_products(payload.product_ids)

        self.db.commit()
        self.db.refresh(supplier)
        return self.get_supplier(supplier.id)

    def delete_supplier(self, supplier_id: int) -> None:
        supplier = self.get_supplier(supplier_id)
        self.repository.delete(supplier)
        self.db.commit()

    def _resolve_products(self, product_ids: list[int]) -> list[Product]:
        products: list[Product] = []
        seen: set[int] = set()

        for product_id in product_ids:
            if product_id in seen:
                continue
            seen.add(product_id)
            product = self.product_repository.get_by_id(product_id)
            if product is None:
                raise ValueError(f"Producto no encontrado: {product_id}")
            products.append(product)

        return products
