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
- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PATCH /api/products/{id}`
- `DELETE /api/products/{id}`

## Nota

El backend ya tiene un primer dominio funcional implementado:

- categorias
- productos
- relacion entre productos y categorias
- soft delete de productos
- filtros basicos por categoria y busqueda por nombre
