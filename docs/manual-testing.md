# Manual Testing

## Objetivo

Esta guia sirve para validar manualmente que la base del proyecto funciona despues de instalar dependencias.

## Antes de empezar

Tener levantados:

- backend en `http://127.0.0.1:8000`
- frontend en `http://127.0.0.1:5173`

Si todavia no lo hiciste, seguir [docs/getting-started.md](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/docs/getting-started.md).

## Checklist de archivo de base de datos

### 1. Creacion del archivo SQLite

Despues de levantar el backend por primera vez, verificar que exista:

- `back/data/gestor_negocio.db`

Resultado esperado:

- el archivo fue creado automaticamente
- no hizo falta agregarlo manualmente al repo
- pueden existir tambien `gestor_negocio.db-wal` y `gestor_negocio.db-shm`

## Checklist del backend

### 2. Root de la API

Abrir:

- `http://127.0.0.1:8000/`

Resultado esperado:

- respuesta JSON con nombre de la app
- campo `status` con valor `ok`

### 3. Healthcheck

Abrir:

- `http://127.0.0.1:8000/api/health`

Resultado esperado:

- `status = ok`
- `timestamp` presente

### 4. Modulos

Abrir:

- `http://127.0.0.1:8000/api/modules`

Resultado esperado:

- lista JSON
- modulos planificados visibles
- sin error 500

### 5. Crear categoria

En `http://127.0.0.1:8000/docs`, usar `POST /api/categories` con:

```json
{
  "name": "Ropa"
}
```

Resultado esperado:

- status `201`
- categoria creada con `id`

### 6. Listar categorias

Abrir:

- `http://127.0.0.1:8000/api/categories`

Resultado esperado:

- lista JSON con la categoria creada

### 7. Crear producto

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

### 8. Listar productos

Abrir:

- `http://127.0.0.1:8000/api/products`

Resultado esperado:

- lista JSON con productos activos

### 9. Filtrar productos por categoria

Abrir:

- `http://127.0.0.1:8000/api/products?category_id=1`

Resultado esperado:

- lista de productos asociados a esa categoria

### 10. Soft delete de producto

En `http://127.0.0.1:8000/docs`, usar `DELETE /api/products/{id}`.

Resultado esperado:

- status `204`
- el producto ya no aparece en `GET /api/products`
- el producto aparece si se consulta con `include_inactive=true`

### 11. Crear cliente

En `http://127.0.0.1:8000/docs`, usar `POST /api/clients` con:

```json
{
  "dni": "12345678",
  "name": "Juan Perez",
  "phone": "1122334455",
  "active": true
}
```

Resultado esperado:

- status `201`
- cliente creado con `id`

### 12. Soft delete de cliente

En `http://127.0.0.1:8000/docs`, usar `DELETE /api/clients/{id}`.

Resultado esperado:

- status `204`
- el cliente deja de aparecer en `GET /api/clients`
- aparece en `GET /api/clients?include_inactive=true`

### 13. Crear proveedor asociado a producto

En `http://127.0.0.1:8000/docs`, usar `POST /api/suppliers` con:

```json
{
  "name": "Mayorista Centro",
  "phone": "1144556677",
  "email": "ventas@mayoristacentro.test",
  "address": "Calle 123",
  "product_ids": [1]
}
```

Resultado esperado:

- status `201`
- proveedor creado con `id`
- lista `products` embebida en la respuesta

### 14. Editar proveedor

En `http://127.0.0.1:8000/docs`, usar `PATCH /api/suppliers/{id}`.

Resultado esperado:

- se actualizan datos basicos
- se puede cambiar la asociacion con productos

### 15. Documentacion interactiva de FastAPI

Abrir:

- `http://127.0.0.1:8000/docs`

Resultado esperado:

- swagger cargando correctamente
- endpoints visibles

### 16. Crear venta fiada

En `http://127.0.0.1:8000/docs`, usar `POST /api/sales` con:

```json
{
  "status": 0,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

Resultado esperado:

- status `201`
- se crea la venta
- baja el stock del producto
- el saldo queda igual al total

### 17. Crear venta parcial con pago inicial

En `http://127.0.0.1:8000/docs`, usar `POST /api/sales` con:

```json
{
  "status": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ],
  "payment": {
    "amount": 5000,
    "payment_method": 0
  }
}
```

Resultado esperado:

- la venta queda en estado parcial
- aparece un pago registrado
- se genera movimiento de caja

### 18. Crear venta pagada con cliente

En `http://127.0.0.1:8000/docs`, usar `POST /api/sales` con:

```json
{
  "status": 2,
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ],
  "client": {
    "dni": "30111222",
    "name": "Ana Gomez",
    "phone": "1133445566"
  },
  "payment": {
    "payment_method": 1
  }
}
```

Resultado esperado:

- la venta queda pagada
- si el cliente no existia, se crea
- el saldo final queda en `0`

### 19. Registrar pago sobre venta existente

En `http://127.0.0.1:8000/docs`, usar `POST /api/sales/{id}/payments`.

Resultado esperado:

- se registra un nuevo pago
- se actualiza el saldo
- si el total se cubre, la venta pasa a pagada

### 20. Listar ventas pendientes

Abrir:

- `http://127.0.0.1:8000/api/sales/pending`

Resultado esperado:

- devuelve ventas con saldo pendiente
- incluye identificacion simple del cliente y saldo

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
