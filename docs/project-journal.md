# Project Journal

## Objetivo

Este documento registra el historial tecnico del proyecto.

Su funcion es dejar trazabilidad de:

- cambios importantes realizados
- errores encontrados
- causa detectada
- solucion aplicada
- decisiones tecnicas relevantes

La idea es que cualquier persona que entre al repo pueda entender que paso, cuando paso y por que se resolvio de cierta forma.

## Como usar este documento

Agregar una nueva entrada cuando ocurra cualquiera de estos casos:

- se crea o cambia estructura del proyecto
- se incorpora una dependencia importante
- aparece un error de instalacion o arranque
- se corrige una configuracion delicada
- se toma una decision arquitectonica relevante

## Formato sugerido para nuevas entradas

```text
## YYYY-MM-DD - Titulo corto

### Contexto
- que se estaba haciendo

### Cambio realizado
- que archivos o partes se tocaron

### Error detectado
- que fallo aparecio

### Causa
- por que ocurrio

### Solucion
- que se hizo para resolverlo

### Notas
- impacto, deuda tecnica o siguientes pasos
```

## 2026-04-13 - Inicio del nuevo repo

### Contexto

- se creo el repo nuevo `Gestor-negocio`
- el objetivo fue reconstruir el sistema desde cero
- `guia_prototipo/` quedo como referencia historica externa

### Cambio realizado

- clonacion del repo publico
- configuracion inicial del workspace
- separacion base entre `front/` y `back/`

### Error detectado

- Git impidio operar normalmente dentro del repo por `dubious ownership`

### Causa

- el repo quedo con un owner distinto al usuario del sandbox

### Solucion

- se agrego el repo a `safe.directory` en Git

### Notas

- esto habilito el uso normal de comandos Git dentro del entorno actual

## 2026-04-13 - Definicion de arquitectura inicial

### Contexto

- se definio que el sistema nuevo seria local
- el frontend debia funcionar desde navegador
- el backend debia correr localmente en la misma PC

### Cambio realizado

- se eligio `FastAPI + SQLite + SQLAlchemy + Pydantic` para backend
- se eligio `React + Vite + TypeScript` para frontend
- se documento la arquitectura y la separacion por capas

### Error detectado

- no hubo error tecnico en esta etapa

### Causa

- no aplica

### Solucion

- no aplica

### Notas

- la arquitectura se penso para separar UI, dominio, persistencia y configuracion desde el arranque

## 2026-04-13 - Scaffold completo del backend y frontend

### Contexto

- se necesitaba dejar una estructura real de trabajo en vez de carpetas vacias

### Cambio realizado

- se creo la estructura de `back/app`
- se agregaron routers iniciales:
  - `GET /`
  - `GET /api/health`
  - `GET /api/modules`
- se agregaron placeholders de `repositories`, `services`, `schemas` y `licensing`
- se creo la estructura de `front/src`
- se agrego una UI inicial con layout lateral y tarjetas de modulos
- se agregaron `.env.example`, scripts de arranque y archivos de requisitos

### Error detectado

- la maquina no tenia `node` ni `npm` disponibles al momento del scaffold

### Causa

- entorno local todavia sin instalacion de Node.js

### Solucion

- se dejo el frontend estructurado sin instalar dependencias
- se documento el requisito de `Node.js 20 LTS+`

### Notas

- el backend si pudo validarse sintacticamente con Python

## 2026-04-13 - Creacion de archivos de dependencias

### Contexto

- hacia falta dejar una forma simple de instalar backend y aclarar como instalar frontend

### Cambio realizado

- se creo `back/requirements.txt`
- se creo `front/requirements.txt` como guia de runtime y dependencias del frontend

### Error detectado

- posible confusion entre instalacion Python y instalacion frontend

### Causa

- en frontend no corresponde usar `pip`

### Solucion

- se documento explicitamente que el frontend se instala con `npm install`
- se dejo `front/requirements.txt` solo como referencia, no como archivo consumido por una herramienta

### Notas

- la fuente real del frontend sigue siendo `front/package.json`

## 2026-04-13 - Documentacion expandida para clonacion y trabajo colaborativo

### Contexto

- hacia falta una documentacion mas completa para quienes clonen el repo

### Cambio realizado

- se amplió `README.md`
- se creo documentacion dedicada:
  - `docs/architecture.md`
  - `docs/getting-started.md`
  - `docs/manual-testing.md`
  - `docs/repository-guide.md`
- se actualizaron `back/README.md` y `front/README.md`

### Error detectado

- no hubo error tecnico puntual

### Causa

- no aplica

### Solucion

- no aplica

### Notas

- la docs ya cubre instalacion, estructura, testing manual y guia para quienes clonen el repo

## 2026-04-13 - Error de Node y npm no reconocidos

### Contexto

- despues de instalar Node mediante MSI, `npm install` seguia fallando

### Error detectado

- PowerShell no reconocia `node` ni `npm`

### Causa

- `C:\Program Files\nodejs` no estaba disponible en el `PATH` de la sesion actual

### Solucion

- se verifico que Node estaba efectivamente instalado en `C:\Program Files\nodejs`
- se indico agregar esa ruta al `PATH` de la sesion o reiniciar VS Code y terminal
- se dejo como alternativa ejecutar `npm.cmd` por ruta absoluta

### Notas

- este problema fue del entorno local, no del proyecto

## 2026-04-13 - Error al levantar Uvicorn por CORS_ORIGINS

### Contexto

- el backend fallaba al iniciar al cargar configuracion desde `.env`

### Error detectado

- `pydantic_settings.exceptions.SettingsError`
- fallo parseando `cors_origins`

### Causa

- `Pydantic Settings` intentaba interpretar `CORS_ORIGINS` como JSON
- en `.env` estaba definido como texto separado por comas:
  `http://127.0.0.1:5173,http://localhost:5173`

### Solucion

- se actualizo [back/app/core/config.py](Gestor-negocio/back/app/core/config.py)
- se uso `NoDecode` para evitar el parseo JSON automatico
- se agrego un validador para aceptar strings separados por comas

### Notas

- ahora el backend acepta:
  - lista separada por comas
  - lista JSON

## 2026-04-13 - Primer backend funcional real

### Contexto

- se empezo a transformar el backend en una API util de verdad
- se eligio arrancar por catalogo e inventario base

### Cambio realizado

- se implementaron modelos ORM reales para:
  - categorias
  - productos
  - relacion producto-categoria
- se agrego inicializacion de tablas SQLite
- se implementaron repositories y services de catalogo
- se agregaron rutas CRUD para:
  - `categories`
  - `products`
- se incorporo soft delete para productos
- se agregaron tests para health y catalogo

### Error detectado

- los tests del catalogo fallaron con `no such table`

### Causa

- SQLite en memoria estaba usando conexiones separadas durante las pruebas
- las tablas se creaban en una conexion y las consultas se hacian en otra

### Solucion

- se actualizo `back/tests/conftest.py`
- se configuro `StaticPool` para compartir la misma conexion en tests

### Notas

- los tests quedaron pasando
- el backend ya expone endpoints reales para que el frontend pueda empezar a integrarse

## Proximas entradas sugeridas

- primer modelo ORM real
- primera migracion
- primer modulo funcional implementado
- integracion real entre frontend y backend
- estrategia de licencias
- backup y restauracion local
