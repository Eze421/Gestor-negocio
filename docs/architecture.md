# Arquitectura

## Vision general

El sistema se plantea como una aplicacion local con interfaz web.

Esto significa:

- el usuario usa el navegador como interfaz
- el backend corre localmente en la misma maquina
- la base de datos se mantiene local
- la red no es un requisito para el uso normal del sistema

## Topologia inicial

Procesos previstos durante desarrollo:

1. `backend` en `http://127.0.0.1:8000`
2. `frontend` en `http://127.0.0.1:5173`

El frontend consume la API local del backend.

## Motivacion de esta arquitectura

La version anterior estaba orientada a una UI de escritorio en Python y tenia bastante logica repartida entre vistas, flujos, servicios y acceso directo a base.

La nueva arquitectura busca:

- simplificar la interfaz usando el navegador
- centralizar la logica de negocio en el backend
- mantener una separacion clara por capas
- facilitar pruebas manuales y automatizadas
- permitir una migracion futura a despliegues mas complejos si hiciera falta

## Backend

Ruta principal: `back/app/`

### Capas del backend

- `api/`
  expone endpoints HTTP y concentra routers
- `core/`
  configuracion, utilidades globales y piezas transversales
- `db/`
  engine, sesiones y base declarativa
- `models/`
  modelos ORM
- `repositories/`
  acceso a datos y consultas persistentes
- `services/`
  reglas de negocio y casos de uso
- `schemas/`
  contratos de entrada y salida de la API

### Flujo esperado

El flujo deseado para una funcionalidad es:

1. el frontend hace una solicitud HTTP
2. `api/` valida y enruta la solicitud
3. `services/` ejecuta el caso de uso
4. `repositories/` accede a base de datos si es necesario
5. `schemas/` formatea la respuesta

### Principios

- no meter SQL en la capa de API
- no meter logica de negocio en modelos o routers
- evitar dependencias innecesarias entre modulos
- dejar la configuracion centralizada

## Frontend

Ruta principal: `front/src/`

### Capas del frontend

- `app/`
  providers globales y piezas de arranque
- `layouts/`
  estructura de pantalla compartida
- `pages/`
  pantallas o vistas de nivel alto
- `features/`
  modulos funcionales del negocio
- `shared/`
  estilos, utilidades, cliente API y tipos comunes

### Principios

- agrupar por feature antes que por tipo de archivo cuando el modulo crezca
- dejar lo compartido en `shared/`
- mantener separada la capa visual de la capa de acceso a API

## Persistencia

Base prevista para primeras etapas:

- `SQLite` local

Motivo:

- simple de levantar
- buena para una aplicacion local
- suficiente para una primera version controlada

Mas adelante se pueden agregar:

- migraciones
- exportacion y backup
- soporte para motores alternativos si fuera necesario

## Configuracion

Cada parte tiene su propio archivo de entorno de ejemplo:

- `back/.env.example`
- `front/.env.example`

Esto permite:

- separar variables por proceso
- facilitar configuracion local
- evitar valores hardcodeados

## Correspondencia con el prototipo anterior

Relacion conceptual con `guia_prototipo/`:

- `ui/` -> `front/src/pages` y `front/src/features`
- `flujos/` -> `back/app/services`
- `services/` -> `back/app/services`
- `funciones/` -> `back/app/repositories`
- `db.py` -> `back/app/db`
- `licencia/` -> `back/app/services/licensing`

Esto no significa copiar el viejo sistema uno a uno. Significa usarlo como mapa funcional para reconstruirlo mejor.

## Modulos funcionales previstos

- dashboard
- ventas
- caja
- cobros
- inventario
- clientes
- categorias
- proveedores
- licencia

## Primer dominio implementado

El primer dominio real implementado en backend es catalogo e inventario base:

- categorias
- productos
- asociacion muchos a muchos entre productos y categorias
- soft delete de productos con campo `active`

Esto permite empezar el desarrollo real del frontend contra una API concreta.

## Prioridades tecnicas

- definir entidades y casos de uso base
- implementar inventario y catalogo primero
- agregar migraciones al introducir modelos reales
- sumar tests por modulo a medida que se construya funcionalidad
