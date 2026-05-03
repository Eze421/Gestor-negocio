# Database Schema

## Objetivo

Este documento describe el modelo de datos actual del backend.

Busca responder:

- que tablas existen
- para que sirve cada una
- con cuales se relaciona
- como se corresponde con `guia_prototipo`

## Filosofia de esta version

Se replican todas las entidades del prototipo, pero con mejoras internas:

- nombres de clases y tablas en ingles para mantener consistencia en el backend nuevo
- relaciones ORM explicitas con SQLAlchemy
- constraints e indices mas claros
- bootstrap automatico de archivo SQLite y tablas

La equivalencia funcional con el prototipo se mantiene.

## Vista general del esquema

Tablas actuales:

- `categories`
- `products`
- `product_categories`
- `suppliers`
- `product_suppliers`
- `clients`
- `sales`
- `sale_items`
- `sale_payments`
- `cash_movements`
- `cash_closings`

## Mapa de equivalencia con el prototipo

- `categorias` -> `categories`
- `productos` -> `products`
- `productos_categorias` -> `product_categories`
- `proveedores` -> `suppliers`
- `productos_proveedores` -> `product_suppliers`
- `clientes` -> `clients`
- `ventas` -> `sales`
- `detalles_ventas` -> `sale_items`
- `pagos_ventas` -> `sale_payments`
- `caja_movimientos` -> `cash_movements`
- `cierres_caja` -> `cash_closings`

## Tabla por tabla

### `categories`

Representa categorias de productos.

Campos principales:

- `id`
- `name`

Se comunica con:

- `products` mediante `product_categories`

Notas:

- se crea automaticamente la categoria por defecto `sin categoria`
- `name` es unico

### `products`

Representa productos vendibles o inventariables.

Campos principales:

- `id`
- `name`
- `price`
- `stock`
- `active`

Se comunica con:

- `categories` mediante `product_categories`
- `suppliers` mediante `product_suppliers`
- `sale_items` de forma directa

Notas:

- `active` permite soft delete
- `stock` queda preparado para ventas e inventario

### `product_categories`

Tabla intermedia para relacion muchos a muchos entre productos y categorias.

Campos principales:

- `product_id`
- `category_id`

Se comunica con:

- `products`
- `categories`

Notas:

- su clave primaria es compuesta
- replica la misma idea de `productos_categorias` del prototipo

### `suppliers`

Representa proveedores.

Campos principales:

- `id`
- `name`
- `phone`
- `email`
- `address`

Se comunica con:

- `products` mediante `product_suppliers`

Notas:

- `name` es unico
- esta tabla prepara el terreno para compras y abastecimiento
- ya tiene modulo CRUD inicial implementado en API

### `product_suppliers`

Tabla intermedia para relacion productos con proveedores.

Campos principales:

- `product_id`
- `supplier_id`

Se comunica con:

- `products`
- `suppliers`

Notas:

- su clave primaria es compuesta
- replica la idea de `productos_proveedores`

### `clients`

Representa clientes del negocio.

Campos principales:

- `id`
- `dni`
- `name`
- `phone`
- `active`

Se comunica con:

- `sales`

Notas:

- `dni` es unico cuando existe
- `active` permite conservar historial sin borrar fisicamente
- ya tiene modulo CRUD inicial implementado en API

### `sales`

Representa una venta.

Campos principales:

- `id`
- `sold_at`
- `total_amount`
- `status`
- `client_id`

Se comunica con:

- `clients`
- `sale_items`
- `sale_payments`
- `cash_movements`

Notas:

- es la tabla central del flujo comercial
- `status` replica la logica de estados del prototipo
- ya tiene modulo transaccional implementado en API

### `sale_items`

Representa el detalle de una venta.

Campos principales:

- `id`
- `sale_id`
- `product_id`
- `quantity`
- `unit_price`
- `subtotal`

Se comunica con:

- `sales`
- `products`

Notas:

- replica `detalles_ventas`
- permite mantener snapshot del precio vendido
- se crea automaticamente dentro del flujo de venta

### `sale_payments`

Representa pagos asociados a una venta.

Campos principales:

- `id`
- `sale_id`
- `amount`
- `paid_at`
- `is_excess`

Se comunica con:

- `sales`

Notas:

- replica `pagos_ventas`
- `is_excess` cubre excedentes de pago como en el prototipo
- se registra tanto en venta inicial como en pagos posteriores

### `cash_movements`

Representa movimientos de caja.

Campos principales:

- `id`
- `moved_at`
- `amount`
- `movement_type`
- `payment_method`
- `concept`
- `sale_id`

Se comunica con:

- `sales`

Notas:

- replica `caja_movimientos`
- `amount` tiene constraint positivo
- se puede asociar a una venta o existir como movimiento manual
- hoy se registra automaticamente al cobrar pagos de ventas

### `cash_closings`

Representa cierres de caja.

Campos principales:

- `id`
- `closed_at`

Se comunica con:

- actualmente no tiene foreign keys directas

Notas:

- replica `cierres_caja`
- sirve como base para auditoria y resumenes diarios

## Resumen de relaciones

### Relaciones muchos a muchos

- `products` <-> `categories`
- `products` <-> `suppliers`

### Relaciones uno a muchos

- `clients` -> `sales`
- `sales` -> `sale_items`
- `sales` -> `sale_payments`
- `sales` -> `cash_movements`
- `products` -> `sale_items`

## Orden funcional del dominio

Una lectura practica del esquema seria:

1. primero existen `categories`, `products` y `suppliers`
2. luego se registran `clients`
3. despues una `sale`
4. la venta genera `sale_items`
5. la venta puede generar `sale_payments`
6. la operacion impacta en `cash_movements`
7. el cierre diario se registra en `cash_closings`

## Consideraciones de mejora ya aplicadas

- separacion clara entre entidades y tablas intermedias
- soft delete en productos
- soft delete en clientes
- nombres consistentes para fechas y montos
- constraints basicos para integridad
- bootstrap automatico de SQLite local

## Siguientes pasos sugeridos sobre este esquema

- agregar migraciones formales
- definir enums compartidos para estados y medios de pago
- crear schemas y services por modulo real
- implementar casos de uso para `cash` administrativo y cierres
