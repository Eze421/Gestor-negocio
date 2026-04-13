from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.repositories.catalog import CategoryRepository, ProductRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import ProductCreate, ProductUpdate


def _normalize_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError("El nombre no puede estar vacio")
    return normalized


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = CategoryRepository(db)

    def list_categories(self) -> list[Category]:
        return self.repository.list()

    def create_category(self, payload: CategoryCreate) -> Category:
        name = _normalize_name(payload.name)
        if self.repository.get_by_name(name):
            raise ValueError("La categoria ya existe")

        category = Category(name=name)
        self.repository.create(category)
        self.db.commit()
        return category

    def update_category(self, category_id: int, payload: CategoryUpdate) -> Category:
        category = self.repository.get_by_id(category_id)
        if category is None:
            raise LookupError("Categoria no encontrada")

        name = _normalize_name(payload.name)
        existing = self.repository.get_by_name(name)
        if existing and existing.id != category.id:
            raise ValueError("La categoria ya existe")

        category.name = name
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, category_id: int) -> None:
        category = self.repository.get_by_id(category_id)
        if category is None:
            raise LookupError("Categoria no encontrada")
        if category.products:
            raise ValueError("No se puede eliminar una categoria con productos asociados")

        self.repository.delete(category)
        self.db.commit()


class ProductService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = ProductRepository(db)
        self.category_repository = CategoryRepository(db)

    def list_products(
        self,
        *,
        search: str | None = None,
        category_id: int | None = None,
        include_inactive: bool = False,
    ) -> list[Product]:
        return self.repository.list(
            search=search,
            category_id=category_id,
            include_inactive=include_inactive,
        )

    def get_product(self, product_id: int) -> Product:
        product = self.repository.get_by_id(product_id)
        if product is None:
            raise LookupError("Producto no encontrado")
        return product

    def create_product(self, payload: ProductCreate) -> Product:
        name = _normalize_name(payload.name)
        if self.repository.get_by_name(name):
            raise ValueError("Ya existe un producto con ese nombre")

        categories = self._resolve_categories(payload.category_ids)
        product = Product(
            name=name,
            price=payload.price,
            stock=payload.stock,
            active=payload.active,
            categories=categories,
        )

        self.repository.create(product)
        self.db.commit()
        return self.get_product(product.id)

    def update_product(self, product_id: int, payload: ProductUpdate) -> Product:
        product = self.get_product(product_id)

        if payload.name is not None:
            name = _normalize_name(payload.name)
            existing = self.repository.get_by_name(name)
            if existing and existing.id != product.id:
                raise ValueError("Ya existe un producto con ese nombre")
            product.name = name

        if payload.price is not None:
            product.price = payload.price
        if payload.stock is not None:
            product.stock = payload.stock
        if payload.active is not None:
            product.active = payload.active
        if payload.category_ids is not None:
            product.categories = self._resolve_categories(payload.category_ids)

        self.db.commit()
        self.db.refresh(product)
        return self.get_product(product.id)

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        product.active = False
        self.db.commit()

    def _resolve_categories(self, category_ids: list[int]) -> list[Category]:
        categories: list[Category] = []
        seen: set[int] = set()

        for category_id in category_ids:
            if category_id in seen:
                continue
            seen.add(category_id)
            category = self.category_repository.get_by_id(category_id)
            if category is None:
                raise ValueError(f"Categoria no encontrada: {category_id}")
            categories.append(category)

        return categories
