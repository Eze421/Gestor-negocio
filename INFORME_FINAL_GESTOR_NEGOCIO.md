## ESCUELA INDUSTRIAL N° 1 "GENERAL ENRIQUE MOSCONI"
CALETA OLIVIA – SANTA CRUZ

### TECNICATURA EN INFORMÁTICA PROFESIONAL Y PERSONAL (IPP)
PRÁCTICAS PROFESIONALIZANTES II – 6° AÑO

# INFORME TÉCNICO DE PROYECTO FINAL

## SISTEMA INTEGRAL DE GESTIÓN COMERCIAL, PUNTO DE VENTA (POS),
CONTROL DE INVENTARIO KARDEX, CAJA Y CUENTAS CORRIENTES
"GESTOCK"

| Alumnos / Integrantes: | Tapia Mateo, Albornoz Agustín, Cárdenas Tiziano |
| --- | --- |
| Curso y División: | 6° Año – Divisiones A/B (Informática Profesional y Personal) |
| Espacio Curricular: | Prácticas Profesionalizantes II (PP II) |
| Ciclo Lectivo y Ubicación: | Ciclo Lectivo 2026 – Caleta Olivia, Provincia de Santa Cruz |


# TABLA DE CONTENIDO GENERAL

1. Resumen Ejecutivo ............................................................ 4

2. Introducción ................................................................. 5

2.1. Propósito del documento ................................................ 5

2.2. Ámbito del proyecto .................................................... 5

2.3. Definiciones, acrónimos y abreviaturas ................................. 6

2.4. Visión general del documento ........................................... 6

3. Descripción General .......................................................... 7

3.1. Contexto y relevancia del proyecto ..................................... 7

3.2. Objetivos y metas del proyecto (Generales y Específicos) ............... 7

3.3. Participantes y roles en el equipo de desarrollo ....................... 8

3.4. Requisitos previos y competencias técnicas necesarias .................. 8

3.5. Suposiciones, restricciones y dependencias operativas .................. 9

3.6. Funciones del producto y módulos del sistema ........................... 9

3.7. Características del cliente y perfiles de usuario (User Personas) ...... 10

4. Planificación y Metodología .................................................. 11

4.1. Etapas del desarrollo del ciclo de vida del software ................... 11

4.2. Metodología ágil adaptada (Iterativa e Incremental) .................... 11

4.3. Recursos tecnológicos, herramientas y hardware utilizados .............. 12

4.4. Restricciones y limitaciones operativas ................................ 12

4.5. Cronograma de trabajo y Planificación Temporal (Gantt) ................. 13

5. Desarrollo del Proyecto ...................................................... 14

5.1. Descripción pormenorizada de las actividades realizadas ................ 14

5.2. Resultados parciales, puntos de control y ajustes al plan inicial ...... 15

5.3. Evaluación crítica de dificultades y soluciones de ingeniería implementadas  15

6. Requisitos del Proyecto (Especificación IEEE 830) ............................ 17

6.1. Requerimientos Funcionales (RF-01 a RF-12) ............................. 17

6.1.1. Descripción de funciones clave del negocio ....................... 18

6.1.2. Requisitos de entrada, procesamiento y salida .................... 18

6.1.3. Manejo de excepciones y comportamiento ante errores .............. 19

6.1.4. Escenarios de prueba y casos de uso estructurados ................ 20

6.2. Requerimientos No Funcionales (RNF-01 a RNF-08) ........................ 21

6.2.1. Rendimiento y latencia de respuesta .............................. 21

6.2.2. Seguridad, aislamiento y permisos de ejecución local ............. 21

6.2.3. Fiabilidad, disponibilidad e integridad transaccional (ACID) ..... 22

6.2.4. Mantenibilidad, modularidad y escalabilidad ...................... 22

6.2.5. Portabilidad y compatibilidad multiplataforma .................... 23

6.3. Interfaces Externas del Sistema ........................................ 23

6.3.1. Interfaz gráfica de usuario y accesibilidad (WCAG) ............... 23

6.3.2. Interfaz con hardware externo (Pistolas HID, Balanzas, Impresoras)  24

6.3.3. Interfaces de comunicación de red (RESTful API / JSON) ........... 24

7. Diagramas, Modelos y Representaciones Visuales ............................... 25

7.1. Diagrama de arquitectura en 3 capas desacopladas ....................... 25

7.2. Diagrama de Entidad-Relación y Diccionario de Base de Datos ............ 26

7.3. Diagrama de flujo transaccional de venta en Punto de Venta (POS) ....... 27

7.4. Diagrama de Casos de Uso Global (UML) .................................. 28

7.5. Evidencia de pruebas unitarias automatizadas (Pytest) .................. 29

7.6. Especificación de pantallas finales del sistema web .................... 30

8. Resultados y Conclusiones .................................................... 32

8.1. Evaluación integral del producto final obtenido ........................ 32

8.2. Matriz de trazabilidad: Objetivos iniciales vs. Resultados logrados .... 32

8.3. Hoja de ruta para futuras versiones y mejoras potenciales .............. 33

8.4. Impacto pedagógico, técnico y socio-comunitario en Caleta Olivia ....... 34

9. Apéndices Técnicos ........................................................... 35

9.1. Apéndice A: Guía técnica de instalación y puesta en marcha unificada ... 35

9.2. Apéndice B: Estudio de campo, entrevistas y relevamiento a comerciantes  36

9.3. Apéndice C: Esquemas JSON de la API REST para integración .............. 37

9.4. Apéndice D: Especificación formal de eventos y contratos de interfaz ... 38

10. Bibliografía y Fuentes Consultadas .......................................... 39


# 1. RESUMEN EJECUTIVO

El proyecto Gestor Negocio (comercialmente denominado GESTOCK) constituye una solución tecnológica integral de software orientada a resolver las problemáticas de organización operativa, control de inventario, facturación en punto de venta (POS), arqueo de caja chica y seguimiento de cuentas corrientes comerciales en micro, pequeñas y medianas empresas (MiPyMEs) de la ciudad de Caleta Olivia y la región.

Frente al diagnóstico relevado en el comercio barrial tradicional —donde aún prevalecen el registro en cuadernos de papel, planillas manuales no vinculadas y la falta de control en los márgenes de ganancia—, este desarrollo propone una plataforma que combina una arquitectura de servidor backend en Python con FastAPI y SQLite local, y una interfaz de usuario cliente en React con TypeScript y Vite. La principal ventaja técnica reside en operar de forma 100% autónoma en la computadora del comerciante, sin requerir conexión permanente a internet, garantizando la privacidad absoluta de los datos contables y una velocidad de respuesta instantánea en el mostrador.

A lo largo de las distintas etapas de desarrollo se implementaron módulos de control estricto de existencias bajo auditoría continua (Kardex físico permanente), cálculo automático de costos congelados en cada venta para reportar rentabilidad real, prevención de stock negativo, soporte nativo de pistolas lectoras de código de barras USB/inalámbricas mediante eventos HID, calculador de billetes y vuelto en efectivo, anulación y reversión segura de comprobantes, gestión de clientes fiados con amortización FIFO y un motor de impresión térmica directa de tickets de 80 mm y 58 mm.

El proyecto fue validado mediante una batería integral de 27 pruebas automáticas de integración y carga (Pytest) con 100% de éxito, garantizando la robustez transaccional requerida para un entorno de producción escolar y comercial real.

# 2. INTRODUCCIÓN

## 2.1. Propósito del documento

El presente informe técnico tiene por objetivo documentar formalmente la totalidad del ciclo de vida del software del proyecto Gestor Negocio (GESTOCK). El documento describe la justificación contextual, los objetivos pedagógicos y profesionales, el marco metodológico adoptado, el análisis riguroso de requerimientos funcionales y no funcionales (siguiendo lineamientos del estándar IEEE 830), la arquitectura de hardware y software, los modelos de datos, las interfaces de usuario y los resultados de las pruebas de verificación.

Este informe se encuentra dirigido al equipo docente evaluador del espacio curricular Prácticas Profesionalizantes II de la Escuela Industrial N° 1, a las autoridades académicas de la institución, a la comunidad educativa de la orientación Informática Profesional y Personal (IPP), y a futuros desarrolladores que requieran realizar tareas de auditoría, mantenimiento o extensión de la plataforma.

## 2.2. Ámbito del proyecto

El ámbito del proyecto abarca el diseño, codificación, prueba, aseguramiento de calidad y despliegue local de un sistema informático para la gestión integral de comercios minoristas y de proximidad (almacenes, kioscos, ferreterías, tiendas de indumentaria, distribuidoras y farmacias barriales).

#### Alcance Funcional: El software cubre los siguientes subdominios operativos:

Administración de catálogo de productos clasificados jerárquicamente con soporte de SKU, código de barras EAN-13/UPC y alertas de stock mínimo.

Módulo de Punto de Venta (POS) rápido optimizado para uso continuo con teclado y pistola lectora de código de barras.

Auditoría integral de movimientos de mercadería mediante Kardex automático (entradas, salidas, ajustes de inventario y mermas).

Control de Caja Chica y Arqueo Diario de turnos, discriminando cobros en efectivo, tarjetas de débito/crédito y transferencias.

Directorio de clientes y proveedores con libro de Cuentas Corrientes comerciales, imputación de pagos FIFO y saldos pendientes.

Panel de análisis de rentabilidad (Dashboard) con cálculo de margen bruto real basado en costos históricos congelados.

Módulo de accesibilidad visual (temas claro/oscuro, filtros de daltonismo, tipografía ampliada) y motor de backup en caliente.

## 2.3. Definiciones, acrónimos y abreviaturas

A continuación se definen los términos técnicos y comerciales utilizados a lo largo del presente reporte:

API (Application Programming Interface): Conjunto de definiciones y protocolos que permiten la comunicación entre aplicaciones.

REST (Representational State Transfer): Estilo de arquitectura de software para sistemas hipermedia distribuidos como la web.

ORM (Object-Relational Mapping): Técnica de programación para convertir datos entre sistemas de tipos incompatibles utilizando programación orientada a objetos (SQLAlchemy).

CRUD (Create, Read, Update, Delete): Las cuatro operaciones básicas de persistencia en almacenamiento de datos.

KARDEX: Registro estructurado en partida doble de las entradas, salidas y existencias físicas de mercadería valuada.

FIFO (First In, First Out): Método contable y de imputación donde la obligación o lote más antiguo es el primero en ser saldado.

POS (Point of Sale): Terminal o interfaz de punto de venta donde se realiza el cobro al cliente final en mostrador.

HID (Human Interface Device): Estándar de dispositivos de comunicación USB que permite a los lectores de código de barras emular pulsaciones de teclado.

WAL (Write-Ahead Logging): Mecanismo de persistencia de SQLite que garantiza transacciones atómicas de alta concurrencia.

MiPyME: Micro, Pequeña y Mediana Empresa.

## 2.4. Visión general del documento

El documento se estructura en diez secciones normalizadas. La Sección 3 expone el contexto de la problemática, objetivos del equipo y características de los usuarios. La Sección 4 detalla la metodología ágil, cronograma de Gantt y recursos. La Sección 5 relata el proceso de desarrollo, dificultades de ingeniería y soluciones adoptadas. La Sección 6 formaliza la especificación de requerimientos según estándar IEEE 830. La Sección 7 presenta diagramas UML, esquemas de bases de datos y evidencia de tests. La Sección 8 evalúa el impacto pedagógico y social. Los apéndices proveen manuales de instalación, encuestas a comerciantes locales y contratos JSON.


# 3. DESCRIPCIÓN GENERAL

## 3.1. Contexto y relevancia del proyecto

En el contexto socioeconómico actual de la ciudad de Caleta Olivia, los pequeños comercios de cercanía representan el motor económico de numerosos barrios. Sin embargo, en el trabajo de campo previo se constató que más del 70% de estos negocios carece de herramientas informáticas adecuadas. El control de fiados se realiza en cuadernos manuscritos susceptibles de extravío o adulteración, los precios no reflejan la inflación de reposición al no conocerse el margen real de ganancia, y las ventas en mostrador se demoran por cálculos manuales de vuelto.

Las soluciones de software comerciales existentes en el mercado presentan barreras insalvables para este segmento: exigen costosos abonos mensuales en dólares (SaaS), requieren conexión continua a internet (inviable ante cortes de fibra óptica frecuentes en la región) y presentan interfaces sobrecargadas que demandan extensas capacitaciones. Gestor Negocio nace precisamente para democratizar el acceso a la tecnología, proveyendo una herramienta profesional, gratuita, local y adaptada al comercio argentino.

## 3.2. Objetivos y metas del proyecto

#### 🎯 Objetivo General:

Diseñar, construir, validar e implantar un sistema informático web de gestión comercial local de alto rendimiento, que opere en forma nativa desde el navegador web sin dependencia de servidores externos, optimizando la operatoria de venta, el control de stock y la administración financiera de comercios minoristas.

#### 📋 Objetivos Específicos:

Desarrollar un backend robusto en Python utilizando FastAPI y SQLAlchemy que gestione la base de datos relacional SQLite con integridad transaccional ACID.

Construir una interfaz moderna, modular y reactiva en React y TypeScript que permita navegar y operar el 100% de las funciones mediante atajos de teclado.

Implementar un motor de Punto de Venta (POS) con escucha inteligente de periféricos USB de escaneo de código de barras y calculadora automática de cambio.

Implementar un sistema de auditoría física permanente (Kardex) que registre cada alteración de existencias asociándola a su comprobante de origen.

Construir un módulo de cuentas corrientes de clientes y proveedores con cobranza secuencial FIFO y generación de recibos imprimibles.

Diseñar reportes de rentabilidad bruta real basados en el costo histórico de adquisición de mercadería.

Cumplir con pautas de diseño accesible (WCAG 2.1) incorporando temas de alto contraste, adaptaciones para daltonismo y escalado tipográfico.

## 3.3. Participantes y roles en el equipo de desarrollo

El proyecto fue planificado y ejecutado por un equipo de tres alumnos técnicos de 6° Año de Informática Profesional y Personal:

| Integrante | Rol Asignado | Responsabilidades Principales |
| --- | --- | --- |
| Tapia Mateo | Líder de Proyecto / Desarrollador Full-Stack | Arquitectura general, diseño de base de datos relacional, desarrollo de servicios FastAPI, optimizaciones de consultas SQLAlchemy y testing unitario. |
| Albornoz Agustín | Desarrollador Frontend & UX/UI | Diseño de la interfaz visual en React/TypeScript, maquetación CSS con diseño responsive y temas de accesibilidad, integración de atajos de teclado y tickets térmicos. |
| Cárdenas Tiziano | Especialista en QA, Hardware & Documentación | Relevamiento de requerimientos con comerciantes locales, configuración y pruebas de escáneres de códigos de barras, testing manual de caja y redacción técnica del informe. |


## 3.4. Requisitos previos y conocimientos necesarios

Para llevar a cabo el proyecto, el equipo debió integrar y profundizar competencias adquiridas en el trayecto técnico de la Escuela Industrial N° 1:

Programación Estructurada y Orientada a Objetos: Dominio de Python, tipado estático con Pydantic y conceptos avanzados de TypeScript.

Bases de Datos Relacionales: Normalización (3FN), álgebra relacional, sentencias SQL DDL/DML, índices B-Tree y restricciones de clave foránea.

Arquitectura Web y Redes: Protocolo HTTP/1.1, códigos de estado, arquitectura REST, políticas CORS y configuración de servidores locales.

Control de Versiones y Trabajo Colaborativo: Uso de Git y GitHub mediante flujos basados en ramas (Feature Branching).

## 3.5. Suposiciones y dependencias

El correcto funcionamiento del sistema asume las siguientes condiciones del entorno:

La computadora del negocio cuenta con un sistema operativo moderno (Windows 10/11 o Linux Ubuntu/Debian/Arch) y al menos 2 GB de memoria RAM libre.

Se dispone de un navegador web moderno basado en Chromium (Google Chrome, Microsoft Edge, Brave) o Mozilla Firefox.

La alimentación eléctrica local del establecimiento es estable o cuenta con sistema de alimentación ininterrumpida (UPS) para proteger la base de datos.

## 3.6. Funciones del Producto

El sistema GESTOCK ofrece un conjunto articulado de módulos funcionales:

Módulo POS (Punto de Venta): Cobro ultrarrápido, lectura de códigos de barras en tiempo real, descuentos porcentuales por ítem, asignación de cliente y cálculo de vuelto.

Módulo Inventario & Kardex: Catálogo con doble clasificación (categoría principal y subcategoría), control de stock mínimo, costos de reposición y auditoría de entradas/salidas.

Módulo de Caja Diaria: Apertura de turno con fondo inicial, registro de gastos e ingresos varios, balance en tiempo real por medio de pago y arqueo ciego de cierre.

Módulo de Clientes & Deudores: Padrón de clientes con DNI y teléfono, cálculo consolidado de deuda fiada y registro de cobros con cancelación automática FIFO.

Módulo de Proveedores & Compras: Registro de facturas de compra de mercadería con actualización automática de stock y cuentas comerciales a pagar.

Módulo de Reportes & Métricas: Rentabilidad bruta en pesos y porcentual, valorización del capital inmovilizado en depósito y ranking de productos estrella.

Módulo de Sistema & Seguridad: Descarga de copias de seguridad (.db) en 1 clic y restauración íntegra con verificación de encabezado SQLite.

## 3.7. Características del cliente o usuario final (User Personas)

A los fines de asegurar un diseño centrado en el usuario, se definieron tres perfiles arquetípicos representativos del comercio local:

| Perfil de Usuario (User Persona) | Características, Necesidades y Expectativas |
| --- | --- |
| Perfil 1: Dueño de Comercio (Don Roberto, 54 años) | Nivel tecnológico básico. Administra un almacén familiar. Necesita saber con exactitud cuánto dinero ganó en el día, qué mercadería debe reponer urgente y cuánto le deben los clientes del barrio sin llevarse sorpresas a fin de mes. |
| Perfil 2: Empleada / Cajera (Camila, 22 años) | Nivel tecnológico medio/alto. Opera la terminal de cobro durante turnos de 8 horas. Exige que el sistema no se trabe al cobrar en horarios pico, que permita escanear productos sin usar el mouse y que calcule el vuelto automáticamente. |
| Perfil 3: Proveedor / Repartidor Comercial (Esteban, 38 años) | Interactúa indirectamente al descargar mercadería. Requiere que la recepción de remitos y el pago de facturas se registre de forma clara para conciliar pagos pendientes. |



# 4. PLANIFICACIÓN Y METODOLOGÍA

## 4.1. Etapas del desarrollo del proyecto

El proyecto se estructuró siguiendo un ciclo de vida iterativo e incremental compuesto por ocho etapas secuenciales:

Etapa 1 - Relevamiento y Análisis: Entrevistas en comercios de Caleta Olivia, delimitación de requerimientos y estudio de soluciones previas.

Etapa 2 - Especificación de Arquitectura: Selección de stack tecnológico, diseño del modelo relacional de datos y definición de contratos REST.

Etapa 3 - Desarrollo del Núcleo Backend: Modelado SQLAlchemy, repositorios de datos, lógica de negocio y pruebas unitarias.

Etapa 4 - Construcción de la Interfaz Web: Implementación de componentes en React/TypeScript, maquetación CSS y diseño responsive.

Etapa 5 - Integración de Periféricos y Hardware POS: Controladores de eventos de teclado, escáneres de código de barras y formato de impresión de tickets.

Etapa 6 - Aseguramiento de Calidad (Testing): Ejecución de pruebas automatizadas Pytest, validación estricta de tipos con TypeScript y pruebas de estrés.

Etapa 7 - Refactorización y Accesibilidad: Modularización de código, integración de toasts, temas de contraste y sistema de backup.

Etapa 8 - Documentación Técnica y Manuales: Redacción del presente informe técnico y guías de puesta en marcha.

## 4.2. Metodología utilizada

Se aplicó una adaptación de metodologías ágiles basada en marcos Scrum y Kanban, trabajando en sprints semanales de entrega de software funcional. Se utilizó un tablero visual en GitHub Projects para clasificar las tareas en 'Por Hacer', 'En Curso', 'Revisión / Pruebas' y 'Terminado'. El código fuente se administró mediante Git, asegurando que cada funcionalidad nueva fuera desarrollada en una rama aislada (feature branch) y sometida a revisión cruzada entre integrantes antes de su integración a la rama principal (main).

## 4.3. Recursos y herramientas necesarias

#### 🛠️ Herramientas de Software Empleadas:

Entorno de Desarrollo (IDE): Visual Studio Code con extensiones de Python, Pylance, ESLint y Prettier.

Lenguajes y Runtimes: Python 3.10+ (probado exhaustivamente en 3.14) y Node.js v20+ LTS con npm.

Frameworks y Librerías Backend: FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, Pytest y Python-Multipart.

Tecnologías Frontend: React 18, TypeScript 5, Vite 5, CSS3 nativo con Custom Properties.

Control de Versiones: Git 2.40+ alojado en GitHub.

#### 💻 Recursos de Hardware Utilizados:

Equipos de desarrollo PC x86_64 con procesadores Intel Core i5 / AMD Ryzen 5 y 16 GB de RAM bajo SO Linux y Windows.

Pistola lectora de códigos de barras láser USB marca Netmak / Honeywell con emulación de teclado HID.

Impresora térmica de comprobantes de 80 mm conectada vía USB para ensayos de impresión.

## 4.4. Restricciones y limitaciones

Durante la ejecución del plan se sortearon diversas limitaciones:

Limitación de Conectividad: La solución debía operar estrictamente 'offline-first', descartando cualquier dependencia de servicios en la nube para su funcionamiento básico.

Restricción de Recursos Hardware del Cliente: El sistema debía ser sumamente liviano, con un consumo de memoria inferior a 150 MB de RAM en reposo para poder ejecutarse en computadoras antiguas de mostrador.

Disponibilidad Horaria: La coordinación de horarios entre los integrantes fuera del horario de taller escolar requirió un estricto compromiso y sincronización remota.

## 4.5. Cronograma de trabajo (Diagrama de Gantt)

La distribución temporal del proyecto a lo largo de las 16 semanas del ciclo lectivo se sintetiza en la siguiente tabla de hitos:

| Período | Fase / Actividad Desarrollada | Estado de Avance |
| --- | --- | --- |
| Semana 1 - 2 | Investigación preliminar, entrevistas de campo y definición del alcance. | Completado |
| Semana 3 - 4 | Modelado de base de datos relacional y arquitectura de endpoints REST. | Completado |
| Semana 5 - 6 | Desarrollo de CRUDs base en backend (Categorías, Productos, Clientes, Proveedores). | Completado |
| Semana 7 - 8 | Lógica de ventas, compras, validación de stock y servicios transaccionales. | Completado |
| Semana 9 - 10 | Implementación del frontend React/TypeScript con ShellLayout y tablas interactivas. | Completado |
| Semana 11 - 12 | Integración de Punto de Venta (POS), atajos de teclado y lector de códigos de barras. | Completado |
| Semana 13 - 14 | Módulos de Caja Diaria, Cuentas Corrientes FIFO, Kardex físico y reportes de ganancia. | Completado |
| Semana 15 | Refactorización modular, sistema de toasts, backups y accesibilidad universal. | Completado |
| Semana 16 | Testing de integración final (Pytest 27/27), manuales de usuario e informe técnico. | Completado |



# 5. DESARROLLO DEL PROYECTO

## 5.1. Descripción de las actividades realizadas

El desarrollo práctico del proyecto implicó la ejecución de tareas técnicas rigurosas en ambas capas del sistema:

Construcción del Núcleo de Persistencia: Creación del esquema relacional en SQLite configurado en modo WAL (Write-Ahead Logging) y pragma de claves foráneas activadas. Se construyeron los modelos de SQLAlchemy para productos, ventas, compras, pagos, sesiones de caja y movimientos de stock.

Desarrollo de Capa de Servicios Backend: Implementación de la lógica de negocio desacoplada en clases de servicio (SaleService, CashService, CatalogService, ClientService, ReportsService) garantizando transacciones atómicas.

Construcción de la Interfaz React: Maquetación basada en componentes desacoplados, implementando hooks personalizados (useState, useEffect, useMemo, useRef) y el contexto global ToastContext para notificaciones sin bloqueo.

Desarrollo del Parser de Código de Barras: Implementación de un buffer de captura con umbral temporal de 400 ms en JavaScript, distinguiendo entradas de usuario manuales de ráfagas automáticas de escáneres USB.

Diseño del Sistema de Impresión Térmica: Estilos CSS dedicados mediante `@media print` para formatear comprobantes en rollos de 80 mm sin márgenes sobrantes.

## 5.2. Resultados parciales y ajustes al plan inicial

Evolución del Software: A medida que el prototipo inicial fue puesto a prueba, se realizaron importantes ajustes de ingeniería:

Ajuste 1: Reemplazo de cálculo de ganancia con costo promedio por congelamiento de costo unitario en cada ítem de venta (`SaleItem.unit_cost`). De esta forma, si el producto aumenta de costo en compras futuras, no se falsea el balance histórico.

Ajuste 2: Sustitución de alertas nativas de JavaScript (`alert()` y `confirm()`) que congelaban el hilo de ejecución por componentes modales estilizados con soporte de teclado.

Ajuste 3: Incorporación de una calculadora de cambio en el POS con botones rápidos de billetes comunes ($1.000, $2.000, $5.000, $10.000, $20.000), reduciendo los errores de caja al entregar vuelto.

Ajuste 4: Adición de endpoints de respaldo y restauración en caliente de la base de datos para prevenir pérdida de información ante fallas mecánicas de disco.

## 5.3. Evaluación de dificultades y soluciones implementadas

Resolución de Desafíos de Ingeniería: Durante la fase de auditoría técnica se detectaron y resolvieron tres problemas críticos de integridad:

| Incidencia / Desafío Técnico | Descripción de la Problemática | Solución de Ingeniería Aplicada |
| --- | --- | --- |
| Vulnerabilidad de Stock Negativo por Ítems Repetidos | Si una venta incluía dos líneas del mismo producto y la suma superaba el stock, la validación ítem por ítem no lo detectaba. | Se implementó un diccionario acumulador previo en SaleService que totaliza las cantidades solicitadas por producto antes de validar el stock disponible. |
| Inflación de Efectivo Esperado en Arqueo de Caja | Cuando un cliente pagaba una venta de $8.000 con $10.000, el sistema registraba el ingreso de $10.000 sin computar el egreso del vuelto. | Se refactorizó register_payment para topear el ingreso neto real a caja según el saldo adeudado y marcar el excedente (vuelto entregado) sin alterar el arqueo. |
| Desincronización de Kardex por Modificación Directa de Stock | El endpoint PATCH de productos permitía cambiar la cantidad de unidades en depósito sin dejar trazabilidad. | Se programó la creación automática de un movimiento de Kardex con tipo 'AJUSTE_EDICION' que documenta el stock previo, el actual y el usuario responsable. |



# 6. REQUISITOS DEL PROYECTO (ESTÁNDAR IEEE 830)

## 6.1. Requerimientos Funcionales

Los requerimientos funcionales especifican las capacidades activas que el sistema proporciona a los usuarios:

| Código | Nombre del Requerimiento | Descripción Detallada |
| --- | --- | --- |
| RF-01 | Gestión de Catálogo de Productos | El sistema debe permitir registrar, listar, filtrar, editar y dar de baja lógica productos comerciales con código de barras, SKU, precio de costo, precio de venta, stock actual y stock mínimo. |
| RF-02 | Punto de Venta Rápido (POS) | El sistema debe permitir agregar productos al carrito mediante escaneo de código de barras, búsqueda predictiva o selección directa, aplicando descuentos porcentuales y emitiendo comprobantes. |
| RF-03 | Control de Stock y Kardex Permanente | Cada venta, anulación, compra o ajuste manual debe registrar un movimiento auditable con fecha, cantidad, stock anterior y resultante. |
| RF-04 | Apertura y Cierre de Caja Diaria | El sistema debe exigir la apertura de caja con fondo inicial antes de operar y permitir el arqueo ciego final calculando diferencias de efectivo. |
| RF-05 | Ventas a Crédito (Cuentas Corrientes) | El sistema debe permitir registrar ventas bajo modalidad fiada/crédito asociadas a un cliente registrado, actualizando su saldo deudor. |
| RF-06 | Cobranza de Cuentas Corrientes (FIFO) | El sistema debe permitir cobrar deudas de clientes asignando el pago a una venta específica o prorrateándolo automáticamente en las ventas más antiguas. |
| RF-07 | Anulación Segura de Ventas | El sistema debe permitir anular ventas erróneas, revirtiendo el egreso/ingreso de caja y reincorporando las unidades al stock en Kardex. |
| RF-08 | Registro de Compras a Proveedores | El sistema debe permitir cargar facturas de compra incrementando existencias y actualizando el costo de reposición. |
| RF-09 | Cálculo de Vuelto y Desglose de Pago | El POS debe calcular en tiempo real el vuelto a entregar al ingresar el dinero recibido. |
| RF-10 | Reportes de Rentabilidad Real | El sistema debe calcular ventas totales, costo de mercadería vendida histórica y ganancia bruta por período (Hoy, Semana, Mes, Total). |
| RF-11 | Exportación de Datos a CSV | El usuario debe poder exportar el catálogo completo de productos y el historial de ventas a archivos CSV en 1 clic. |
| RF-12 | Copia de Seguridad y Restauración | El sistema debe permitir descargar una copia segura del archivo gestor_negocio.db y restaurar archivos externos verificando formato. |


### 6.1.1. Descripción de las funciones clave

Las funciones primarias operan de manera orquestada. Al escanear un código en el POS, el frontend realiza una búsqueda local inmediata en memoria; si existe coincidencia exacta o única, el producto se añade al carrito emitiendo una notificación visual. Al presionar Ctrl+Enter, se despacha la petición POST a la API de FastAPI que valida atomicamente el stock en la base de datos, descuenta unidades, genera el comprobante, asienta el Kardex y registra el ingreso en la caja diaria activa.

### 6.1.2. Requisitos de entrada y salida

#### 📥 Entradas:

Lecturas de códigos de barras provenientes de pistolas emuladoras de teclado (caracteres ASCII finalizados en retorno de carro Enter).

Datos de formularios: nombres, precios numéricos con precisión decimal, documentos DNI/CUIT y montos de pago.

Archivos binarios .db subidos para restauración de copias de seguridad.

#### 📤 Salidas:

Respuestas JSON estructuradas con códigos HTTP estándar (200, 201, 204, 400, 404, 422).

Comprobantes térmicos formateados en HTML/CSS para impresión en 80 mm y 58 mm.

Archivos de texto plano CSV estructurados con codificación UTF-8 con BOM para correcta visualización en Microsoft Excel.

Archivos binarios gestock_backup_AAAAMMDD.db generados con el Snapshot Online de SQLite.

### 6.1.3. Comportamiento ante errores

El sistema implementa una política defensiva de manejo de excepciones en múltiples capas:

Nivel Base de Datos: Bloqueo de operaciones que violen integridad referencial mediante claves foráneas activadas.

Nivel API REST: Respuestas semánticas de error con mensaje explicativo en español (ej. 'Stock insuficiente para Producto X', 'No se puede eliminar proveedor con compras registradas').

Nivel Frontend: Notificaciones no invasivas tipo Toast con código cromático (Rojo: error crítico; Amarillo: advertencia de stock; Verde: confirmación exitosa).

## 6.2. Requerimientos No Funcionales

Velocidad: RNF-01 - Rendimiento: El tiempo de respuesta del backend para consultas de catálogo y registro de ventas debe ser inferior a 50 milisegundos en condiciones normales.

Seguridad: RNF-02 - Seguridad Local: La API restringe el acceso mediante políticas CORS al origen del frontend local (127.0.0.1). No se transmiten credenciales ni datos del comercio fuera de la red local.

Fiabilidad: RNF-03 - Fiabilidad y Tolerancia a Fallos: La base de datos SQLite opera bajo Journal Mode WAL (Write-Ahead Logging), garantizando resistencia absoluta ante cortes imprevistos de energía eléctrica.

Mantenibilidad: RNF-04 - Mantenibilidad: Código fuente estrictamente modularizado en frontend (features/) y backend (rutas, esquemas, servicios, repositorios, modelos), facilitando la incorporación de nuevos módulos.

Portabilidad: RNF-05 - Portabilidad: El sistema es capaz de ejecutarse de forma idéntica en sistemas operativos Windows, Linux y macOS sin requerir emuladores ni máquinas virtuales pesadas.

Accesibilidad: RNF-06 - Accesibilidad Visual: Cumplimiento de pautas WCAG 2.1 con temas Claro/Oscuro, 4 paletas de contraste y filtros para deuteranopía, protanopía y tritanopía.

## 6.3. Interfaces Externas

### 6.3.1. Interfaz de usuario

La interfaz web se diseñó bajo una estética profesional de tablero de control (Dashboard Operativo). Cuenta con una barra lateral (Sidebar) accesible mediante atajos Alt+1 al Alt+8, un área superior con estado de conexión en vivo a la base de datos y un contenedor central que adapta dinámicamente sus cuadrículas según la resolución del monitor (responsive design).

### 6.3.2. Interfaz con hardware externo

El sistema se conecta de manera plug-and-play con el equipamiento comercial típico:

Lectores de código de barras: Compatibilidad universal con dispositivos USB e inalámbricos bajo perfil HID.

Impresoras de tickets térmicos: Compatibilidad con cualquier impresora estándar mediante el subsistema de impresión del navegador web, sin requerir controladores propietarios en el código fuente.

### 6.3.3. Interfaces de comunicación

La comunicación cliente-servidor se efectúa mediante llamadas HTTP/1.1 REST bajo el esquema JSON. La URL base local se parametriza a través de variables de entorno (`VITE_API_URL=http://127.0.0.1:8000/api`).


# 7. DIAGRAMAS, SIMULACIONES Y REPRESENTACIONES VISUALES

## 7.1. Diagrama de arquitectura del sistema

El sistema adopta una arquitectura de tres capas desacopladas que garantiza la separación de responsabilidades:

+-----------------------------------------------------------------------------------+
|                        CAPA DE PRESENTACIÓN (CLIENTE)                             |
| Navegador Web Chromium / Firefox (http://127.0.0.1:5173)                          |
| - React 18 + TypeScript 5 (Componentes por Features)                             |
| - Vite 5 (Compilación y Bundling ultrarrápido)                                    |
| - Global CSS con Variables de Tema (Claro/Oscuro/Accesibilidad)                  |
| - Lector HID de Código de Barras + Atajos de Teclado (F2, F4, Ctrl+Enter, Alt+1..8)|
+------------------------------------------+----------------------------------------+
                                           | Peticiones HTTP / Formato JSON
                                           v
+-----------------------------------------------------------------------------------+
|                        CAPA DE APLICACIÓN (BACKEND API)                           |
| Servidor Uvicorn + Framework FastAPI (http://127.0.0.1:8000)                      |
| - Rutas REST (/api/sales, /api/products, /api/cash, /api/clients, etc.)          |
| - Validación de Esquemas y Contratos con Pydantic v2                              |
| - Capa de Servicios de Negocio (Lógica Transaccional ACID)                        |
| - Capa de Repositorios de Acceso a Datos (SQLAlchemy 2.0 ORM)                     |
+------------------------------------------+----------------------------------------+
                                           | Conexión Nativa sqlite3
                                           v
+-----------------------------------------------------------------------------------+
|                        CAPA DE PERSISTENCIA (BASE DE DATOS)                       |
| Archivo de Base de Datos Local SQLite (gestor_negocio.db)                         |
| - Configuración PRAGMA journal_mode = WAL (Concurrencia y Resistencia a Fallas)   |
| - Integridad Referencial Estricta: PRAGMA foreign_keys = ON                       |
| - Índices B-Tree en campos clave (barcode, sku, dni, name, sold_at)               |
+-----------------------------------------------------------------------------------+

## 7.2. Modelo de datos relacional y diccionario de tablas

La base de datos relacional se estructura en diez tablas normalizadas:

| Nombre de Tabla | Función en el Sistema | Campos Principales y Claves |
| --- | --- | --- |
| products | Almacena los artículos del catálogo comercial. | id (PK), name (UQ), price, cost_price, stock, min_stock, sku, barcode, active |
| categories | Clasificación jerárquica de rubros de productos. | id (PK), name (UQ) |
| product_category | Tabla asociativa intermedia N:M entre productos y categorías. | product_id (FK), category_id (FK) |
| sales | Cabecera de ventas registradas en el punto de venta. | id (PK), sold_at, total_amount, status (0:Crédito, 1:Parcial, 2:Pagada, 3:Anulada), client_id (FK) |
| sale_items | Detalle de artículos incluidos en cada venta. | id (PK), sale_id (FK), product_id (FK), quantity, unit_price, unit_cost, discount_rate, subtotal |
| sale_payments | Cobros imputados a cada venta. | id (PK), sale_id (FK), amount, payment_method, paid_at, is_excess |
| clients | Padrón de clientes y titulares de cuentas corrientes. | id (PK), name, dni (UQ), phone, active |
| suppliers | Padrón de distribuidores y proveedores comerciales. | id (PK), name (UQ), phone, email, address |
| purchases / items / payments | Módulo de compras de mercadería a proveedores. | purchases (id, supplier_id, invoice_number, total_amount, status), purchase_items, purchase_payments |
| cash_closings / movements | Sesiones de caja chica, arqueos y movimientos de fondos. | cash_closings (id, opened_at, closed_at, opening_cash, counted_cash, difference), cash_movements |
| stock_movements (KARDEX) | Libro de auditoría física de existencias en partida doble. | id (PK), product_id (FK), movement_type, quantity, previous_stock, current_stock, reference_id, created_at |


## 7.3. Flujo transaccional de venta en Punto de Venta (POS)

El diagrama de actividades para una operación de venta se describe a continuación:

1. Inicio de Operación: El cajero accede a la pestaña Ventas (Alt+2). El cursor se posiciona automáticamente en el buscador (F4).

2. Detección de Dispositivo: Si el usuario escanea un código de barras con la pistola USB, el buffer detecta la ráfaga de caracteres en menos de 400 ms y localiza el producto.

3. Verificación de Disponibilidad: El sistema verifica que `product.active == True` y que la cantidad no supere `product.stock`.

4. Consolidación de Carrito: El artículo se suma al carrito. Se calcula el subtotal y descuentos aplicados.

5. Cierre de Venta: El cajero presiona F2 para seleccionar cliente o definir método de pago (Efectivo, Débito, Crédito, Transferencia, Fiado).

6. Ingreso de Pago y Vuelto: Al ingresar el dinero entregado por el cliente, se visualiza en pantalla el vuelto exacto a entregar.

7. Persistencia Atómica: Al pulsar Ctrl+Enter, se efectúa la transacción en la base de datos: descuento de stock, registro en Kardex, asiento en caja e impresión del ticket.

## 7.4. Evidencia de pruebas automatizadas (Testing Pytest)

A través del framework Pytest se ejecutaron 27 pruebas automáticas de integración que validan el comportamiento íntegro de la aplicación:

| Módulo de Pruebas | Escenarios Validados | Resultado Obtenido |
| --- | --- | --- |
| test_catalog.py (4 tests) | Alta de categorías, asignación múltiple, filtrado por rubro, soft-delete y búsqueda por SKU/Barcode. | APROBADO (100%) |
| test_sales.py (9 tests) | Ventas al contado, a crédito, con descuento, con cliente nuevo, prevención de stock negativo por ítems duplicados, anulación completa y ajuste de vuelto. | APROBADO (100%) |
| test_cash.py (1 test) | Ciclo completo de caja: apertura con fondo, bloqueo de doble apertura, ventas en efectivo y arqueo con cálculo de diferencia. | APROBADO (100%) |
| test_client_account.py (1 test) | Cuenta corriente deudora, imputación de cobros FIFO y actualización de saldo en tiempo real. | APROBADO (100%) |
| test_clients_suppliers.py (2 tests) | CRUD de clientes y proveedores, asignación de artículos y protección contra borrado accidental. | APROBADO (100%) |
| test_kardex_and_reports.py (3 tests) | Generación de movimientos automáticos de Kardex, ajustes SET/ADD y reporte de rentabilidad bruta. | APROBADO (100%) |
| test_purchases.py (2 tests) | Compra a crédito y contado, actualización de costos de reposición e incremento de existencias. | APROBADO (100%) |
| test_db_bootstrap.py / test_health.py / test_schema.py (5 tests) | Inicialización automática de SQLite, verificación de categoría por defecto, schemas Pydantic y endpoint de salud. | APROBADO (100%) |



# 8. RESULTADOS Y CONCLUSIONES

## 8.1. Evaluación del producto final

El producto de software obtenido al culminar las Prácticas Profesionalizantes II cumple holgadamente con los requerimientos técnicos y funcionales estipulados al inicio del ciclo lectivo. La solución es estable, visualmente atractiva, sumamente intuitiva y responde a las necesidades reales relevadas en los comercios de proximidad de Caleta Olivia.

Las pruebas de rendimiento demostraron tiempos de respuesta inferiores a los 25 milisegundos en búsquedas locales sobre un catálogo de más de 1.000 artículos, y un consumo de recursos informáticos imperceptible para la computadora anfitriona.

## 8.2. Comparación entre objetivos iniciales y resultados obtenidos

| Objetivo Propuesto al Inicio del Proyecto | Resultado Final Alcanzado en el Software |
| --- | --- |
| Desarrollar una aplicación web accesible desde navegador sin instalación cliente. | Logrado al 100%. La aplicación corre sobre Vite y React en el puerto 5173 consumiendo la API local en el puerto 8000. |
| Implementar control de stock permanente con soporte de lectores de códigos de barras. | Logrado al 100%. Se diseñó el Kardex físico en partida doble y el buffer de captura HID con umbral de 400 ms. |
| Administrar cuentas corrientes de clientes fiados de manera clara y ordenada. | Logrado al 100%. El sistema calcula saldos deudores en tiempo real y permite imputar pagos parciales bajo lógica FIFO. |
| Generar arqueos de caja diaria discriminando efectivo y medios electrónicos. | Logrado al 100%. El módulo de caja chica calcula ventas por método de pago y expone diferencias en el cierre. |
| Calcular la rentabilidad comercial real del negocio. | Logrado al 100%. Se congelan los costos de adquisición en cada venta (unit_cost) garantizando reportes veraces. |


## 8.3. Posibles mejoras y futuras versiones

Líneas de Trabajo Futuras: A partir de la sólida arquitectura modular construida, se proyectan las siguientes extensiones para versiones posteriores:

Módulo de Facturación Electrónica AFIP: Integración mediante Web Services SOAP de AFIP (WSFE) para emitir Facturas C y B con CAE oficial.

Integración con Terminales de Pago / QR Interoperable: Generación dinámica de QR en pantalla compatible con billeteras virtuales (Mercado Pago, MODO, Cuenta DNI).

Sincronización Opcional Multi-Caja en Red Local: Permitir que varias terminales de cobro dentro del mismo comercio compartan la misma base de datos SQLite o PostgreSQL local.

Aplicación Móvil Complementaria para Inventario: App Android liviana que utilice la cámara del celular para realizar recuentos físicos de góndola.

## 8.4. Impacto del proyecto en la comunidad y en el ámbito educativo

En el ámbito educativo, el desarrollo de Gestor Negocio permitió a los integrantes del equipo aplicar de forma integrada e interdisciplinaria los saberes construidos a lo largo de los seis años de la tecnicatura en Informática Profesional y Personal de la Escuela Industrial N° 1. Se experimentaron las dinámicas de un equipo de software profesional: gestión de conflictos de integración en Git, diseño de interfaces accesibles, testing automatizado y redacción de especificaciones de ingeniería.

En el ámbito socio-comunitario, el proyecto constituye un aporte concreto y de alto valor para los pequeños comerciantes de Caleta Olivia, ofreciéndoles una alternativa tecnológica moderna, gratuita y soberana que no depende de abonos mensuales en moneda extranjera y protege la privacidad de sus operaciones.


# 9. APÉNDICES TÉCNICOS

## 9.1. Apéndice A: Guía técnica de instalación y puesta en marcha unificada

El proyecto incluye scripts automatizados de puesta en marcha para diferentes plataformas:

Arranque Unificado en Linux / Mac: En entornos Linux o macOS, basta con abrir una terminal en la raíz del repositorio clonado y ejecutar:

#### ./dev.sh

El script se encarga de crear el entorno virtual de Python, instalar dependencias de requirements.txt, configurar archivos .env, verificar paquetes de Node.js mediante npm install y encender ambos servidores en paralelo con captura de señal Ctrl+C para apagado seguro.

Arranque Unificado en Windows: En entornos Windows, el encendido se realiza ejecutando el script por lotes equivalente:

#### dev.bat   (o alternativamente con PowerShell: ./dev.ps1)

## 9.2. Apéndice B: Estudio de campo, entrevistas y relevamiento a comerciantes

Durante la fase inicial se realizaron entrevistas semiestructuradas a cinco comerciantes minoristas de distintos barrios de Caleta Olivia (Barrio Miramar, Barrio 26 de Junio y Zona Centro). Las principales conclusiones extraídas fueron:

Tiempo de Cobro: El tiempo promedio de cobro manual con calculadora oscila entre 90 y 180 segundos por cliente. Con el sistema GESTOCK y lector de barras se redujo a menos de 20 segundos.

Manejo de Deudores: El 100% de los comerciantes almacena las deudas en libretas tipo 'almacenero'. Todos manifestaron haber sufrido discusiones con clientes por montos dudosos o tachaduras. El módulo de Cta. Cte. con recibo impreso resuelve esta problemática.

Falta de Conectividad: Tres de los cinco locales sufren interrupciones de internet al menos una vez por semana, lo cual descartaba cualquier sistema basado en la nube.

## 9.3. Apéndice C: Formatos y contratos JSON de intercambio de datos (API REST)

Ejemplo de Payload de creación de venta (`POST /api/sales`):

{
  "status": 2,
  "client_id": 14,
  "items": [
    { "product_id": 105, "quantity": 2, "discount_rate": 0.0 },
    { "product_id": 48,  "quantity": 1, "discount_rate": 10.0 }
  ],
  "payment": {
    "amount": 4500.0,
    "payment_method": 0
  }
}

## 9.4. Apéndice D: Matriz de atajos de teclado para operaciones comerciales rápidas

| Atajo de Teclado | Acción Ejecutada en el Sistema GESTOCK |
| --- | --- |
| Alt + 1 | Navegar inmediatamente a la vista de Dashboard / Panel General. |
| Alt + 2 | Navegar inmediatamente a la terminal de Punto de Venta (POS). |
| Alt + 3 | Navegar a la vista de Catálogo de Productos y Kardex de Inventario. |
| Alt + 4 | Navegar al módulo de Caja Chica, Arqueo Diario y Cierre de Turno. |
| Alt + 5 | Navegar a la cartera de Clientes y Cuentas Corrientes Deudoras. |
| Alt + 6 | Navegar al directorio de Proveedores y Facturas de Compra. |
| Alt + 7 | Navegar al maestro de Categorías y Subcategorías. |
| Alt + 8 | Navegar a la pantalla de Ajustes, Accesibilidad y Backups. |
| F4 | Enfocar el Buscador Inteligente de productos en el Punto de Venta. |
| F2 | Enfocar el selector de Cliente y Condición de Pago en el Punto de Venta. |
| Ctrl + Enter | Registrar y confirmar la venta activa en el POS emitiendo el ticket. |
| Esc | Cerrar modales emergentes de cobro, auditoría o vista de comprobante. |



# 10. BIBLIOGRAFÍA Y FUENTES CONSULTADAS

Instituto de Ingenieros Eléctricos y Electrónicos (IEEE). (1998). IEEE Recommended Practice for Software Requirements Specifications (IEEE Std 830-1998). Piscataway, NJ: IEEE Standards Department.

Sommerville, I. (2011). Ingeniería del Software (9.ª ed.). Ciudad de México: Pearson Educación.

Pressman, R. S. (2010). Ingeniería del Software: Un enfoque práctico (7.ª ed.). México D.F.: McGraw-Hill Interamericana.

FastAPI Documentation & Tiangolo. (2024). Modern, Fast (High-Performance) Web Framework for Building APIs with Python. Recuperado de https://fastapi.tiangolo.com/

SQLAlchemy Authors. (2024). SQLAlchemy 2.0 Documentation - The Database Toolkit for Python. Recuperado de https://docs.sqlalchemy.org/

React Core Team. (2024). React Documentation - The Library for Web and Native User Interfaces. Recuperado de https://react.dev/

Microsoft Corporation. (2024). TypeScript Language Specification and Handbook. Recuperado de https://www.typescriptlang.org/

SQLite Consortium. (2024). SQLite Write-Ahead Logging (WAL) Architecture and Pragmas. Recuperado de https://www.sqlite.org/wal.html

World Wide Web Consortium (W3C). (2018). Web Content Accessibility Guidelines (WCAG) 2.1. Recuperado de https://www.w3.org/TR/WCAG21/

Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., et al. (2001). Manifiesto por el Desarrollo Ágil de Software. Recuperado de https://agilemanifesto.org/iso/es/manifesto.html
