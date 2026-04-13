# Repository Guide

## Para quien es esta guia

Esta guia esta pensada para cualquier persona que clone el repo y necesite entender rapido:

- que contiene
- como levantarlo
- como orientarse
- como contribuir sin romper la estructura

## Primeras lecturas recomendadas

Cuando clones el repo, este es el orden sugerido:

1. `README.md`
2. `docs/architecture.md`
3. `docs/getting-started.md`
4. `docs/manual-testing.md`

## Que no tocar como fuente principal

La carpeta `guia_prototipo/` representa una referencia historica externa al nuevo sistema.

Se puede usar para:

- entender modulos viejos
- comparar funcionalidades
- rescatar reglas de negocio

No se debe usar para:

- seguir desarrollando la nueva version dentro de esa carpeta
- copiar y pegar estructura sin criterio
- mezclar la arquitectura vieja con la nueva

## Donde va cada cosa

### Backend

En `back/app/`:

- `api/`
  endpoints y routers
- `core/`
  configuracion y utilidades globales
- `db/`
  engine y sesiones
- `models/`
  modelos ORM
- `repositories/`
  acceso a datos
- `services/`
  reglas de negocio
- `schemas/`
  contratos Pydantic

### Frontend

En `front/src/`:

- `app/`
  arranque y providers
- `layouts/`
  layouts generales
- `pages/`
  vistas de alto nivel
- `features/`
  funcionalidad por modulo
- `shared/`
  piezas reutilizables

## Convenciones recomendadas

### Backend

- endpoint en `api/routes`
- esquema de request/response en `schemas`
- logica en `services`
- acceso a datos en `repositories`

### Frontend

- componentes de un modulo dentro de su propia `feature`
- utilidades comunes en `shared`
- estilos globales o transversales en `shared/styles`

## Como agregar un modulo nuevo

Ejemplo: `inventario`

Backend:

1. crear schemas si hacen falta
2. crear service
3. crear repository
4. crear route
5. registrar router en `api/router.py`

Frontend:

1. crear carpeta en `front/src/features/inventario`
2. agregar componentes y tipos del modulo
3. conectar con `shared/api/client.ts` si consume backend

## Como validar cambios antes de seguir

- revisar imports
- probar backend manualmente
- probar frontend manualmente
- actualizar documentacion si cambia algo importante

## Archivos importantes

- [README.md](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/README.md)
- [back/pyproject.toml](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/back/pyproject.toml)
- [back/requirements.txt](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/back/requirements.txt)
- [front/package.json](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/front/package.json)
- [front/requirements.txt](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/front/requirements.txt)

## Regla practica

Si una decision de estructura no es obvia:

- priorizar claridad
- evitar mezclar capas
- documentar la decision
