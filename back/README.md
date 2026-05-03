# Backend

## Que contiene

`back/` contiene la API local del proyecto.

Su objetivo es:

- recibir solicitudes del frontend
- ejecutar reglas de negocio
- acceder a la persistencia local
- devolver respuestas estructuradas

## Stack

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

## Estructura interna

- `app/api/`: routers y endpoints
- `app/core/`: configuracion
- `app/db/`: base declarativa y sesion
- `app/models/`: modelos ORM
- `app/repositories/`: acceso a datos
- `app/services/`: logica de negocio
- `app/schemas/`: contratos de API
- `tests/`: pruebas

## Instalacion

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Base de datos local

La base usa `SQLite` y el archivo se genera automaticamente al arrancar.

Por defecto se crea en:

- `back/data/gestor_negocio.db`

Ese archivo no forma parte del codigo fuente ni se versiona en Git.

Se puede personalizar desde `.env` con:

- `APP_DATA_DIR`
- `DATABASE_NAME`
- `DATABASE_URL` si queres una ruta completa

## Arranque

```powershell
uvicorn app.main:app --reload
```

## Endpoints base

- `GET /`
- `GET /api/health`
- `GET /api/modules`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/{id}`
- `DELETE /api/categories/{id}`
- `GET /api/clients`
- `GET /api/clients/{id}`
- `POST /api/clients`
- `PATCH /api/clients/{id}`
- `DELETE /api/clients/{id}`
- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PATCH /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/sales`
- `GET /api/sales/pending`
- `GET /api/sales/{id}`
- `POST /api/sales`
- `POST /api/sales/{id}/payments`
- `GET /api/suppliers`
- `GET /api/suppliers/{id}`
- `POST /api/suppliers`
- `PATCH /api/suppliers/{id}`
- `DELETE /api/suppliers/{id}`

## Nota

El backend ya tiene un primer dominio funcional implementado:

- categorias
- productos
- clientes
- proveedores
- ventas
- relacion entre productos y categorias
- relacion entre productos y proveedores
- soft delete de productos
- soft delete de clientes
- filtros basicos por categoria y busqueda por nombre
- registro atomico de ventas con validacion de stock, pagos y caja
