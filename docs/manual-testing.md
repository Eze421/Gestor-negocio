# Manual Testing

## Objetivo

Esta guia sirve para validar manualmente que la base del proyecto funciona despues de instalar dependencias.

## Antes de empezar

Tener levantados:

- backend en `http://127.0.0.1:8000`
- frontend en `http://127.0.0.1:5173`

Si todavia no lo hiciste, seguir [docs/getting-started.md](Gestor-negocio/docs/getting-started.md).

## Checklist del backend

### 1. Root de la API

Abrir:

- `http://127.0.0.1:8000/`

Resultado esperado:

- respuesta JSON con nombre de la app
- campo `status` con valor `ok`

### 2. Healthcheck

Abrir:

- `http://127.0.0.1:8000/api/health`

Resultado esperado:

- `status = ok`
- `timestamp` presente

### 3. Modulos

Abrir:

- `http://127.0.0.1:8000/api/modules`

Resultado esperado:

- lista JSON
- modulos planificados visibles
- sin error 500

### 4. Crear categoria

En `http://127.0.0.1:8000/docs`, usar `POST /api/categories` con:

```json
{
  "name": "Ropa"
}
```

Resultado esperado:

- status `201`
- categoria creada con `id`

### 5. Listar categorias

Abrir:

- `http://127.0.0.1:8000/api/categories`

Resultado esperado:

- lista JSON con la categoria creada

### 6. Crear producto

En `http://127.0.0.1:8000/docs`, usar `POST /api/products` con:

```json
{
  "name": "Remera Basica",
  "price": 15999.9,
  "stock": 12,
  "active": true,
  "category_ids": [1]
}
```

Resultado esperado:

- status `201`
- producto creado con categorias embebidas

### 7. Listar productos

Abrir:

- `http://127.0.0.1:8000/api/products`

Resultado esperado:

- lista JSON con productos activos

### 8. Filtrar productos por categoria

Abrir:

- `http://127.0.0.1:8000/api/products?category_id=1`

Resultado esperado:

- lista de productos asociados a esa categoria

### 9. Soft delete de producto

En `http://127.0.0.1:8000/docs`, usar `DELETE /api/products/{id}`.

Resultado esperado:

- status `204`
- el producto ya no aparece en `GET /api/products`
- el producto aparece si se consulta con `include_inactive=true`

### 10. Documentacion interactiva de FastAPI

Abrir:

- `http://127.0.0.1:8000/docs`

Resultado esperado:

- swagger cargando correctamente
- endpoints visibles

## Checklist del frontend

### 1. Carga inicial

Abrir:

- `http://127.0.0.1:5173`

Resultado esperado:

- pagina carga sin pantalla en blanco
- aparece el layout lateral
- aparece el titulo `Gestor Negocio`

### 2. Hero principal

Resultado esperado:

- texto introductorio visible
- panel de estado visible
- sin errores visuales graves

### 3. Tarjetas de modulos

Resultado esperado:

- aparecen modulos como `Dashboard`, `Ventas`, `Caja`, `Inventario`
- el grid responde bien al ancho de la ventana

### 4. Responsive basico

Reducir el ancho de la ventana.

Resultado esperado:

- la barra lateral se acomoda
- el contenido no se rompe
- no hay solapamientos evidentes

## Checklist tecnico de consola

### Backend

Esperado:

- sin excepciones al iniciar
- sin error de importacion

### Frontend

Esperado:

- Vite inicia
- no hay errores de compilacion TypeScript
- no hay error de dependencias faltantes

## Checklist de smoke test rapido

1. levantar backend
2. verificar `/api/health`
3. levantar frontend
4. abrir la pagina principal
5. comprobar que el front renderiza
6. comprobar que el back responde

## Estado actual cubierto por esta guia

Esta guia valida la base tecnica del proyecto, no reglas reales de negocio. A medida que existan modulos concretos, conviene agregar casos manuales por modulo.
