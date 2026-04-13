# Getting Started

## Objetivo de esta guia

Esta guia explica como preparar el entorno local para trabajar o probar el proyecto desde cero.

Aplica para:

- quien clona el repo por primera vez
- quien quiere probar el proyecto manualmente
- quien necesita reconstruir el entorno en otra PC

## Requisitos previos

### Backend

- `Python 3.10` o superior
- `pip`

### Frontend

- `Node.js 20 LTS` o superior
- `npm 10` o superior

## Verificar instalaciones

Abrir PowerShell y ejecutar:

```powershell
python --version
pip --version
node --version
npm --version
```

Si `node` o `npm` no aparecen:

- cerrar y volver a abrir la terminal
- cerrar y volver a abrir VS Code
- verificar que `C:\Program Files\nodejs` este en el `PATH`

## Clonar el repositorio

```powershell
git clone https://github.com/Eze421/Gestor-negocio.git
cd Gestor-negocio
```

## Preparar el backend

### 1. Ir a la carpeta del backend

```powershell
cd back
```

### 2. Crear un entorno virtual

```powershell
python -m venv .venv
```

### 3. Activar el entorno virtual

```powershell
.\.venv\Scripts\activate
```

### 4. Instalar dependencias

Opcion recomendada:

```powershell
pip install -r requirements.txt
```

Opcion alternativa usando metadatos del proyecto:

```powershell
pip install -e .[dev]
```

### 5. Crear archivo de entorno

```powershell
copy .env.example .env
```

### 6. Levantar la API

```powershell
uvicorn app.main:app --reload
```

## Preparar el frontend

### 1. Ir a la carpeta del frontend

Desde la raiz del repo:

```powershell
cd front
```

### 2. Crear archivo de entorno

```powershell
copy .env.example .env
```

### 3. Instalar dependencias

```powershell
npm install
```

### 4. Levantar el frontend

```powershell
npm run dev
```

## URLs esperadas

- backend root: `http://127.0.0.1:8000/`
- backend health: `http://127.0.0.1:8000/api/health`
- backend modules: `http://127.0.0.1:8000/api/modules`
- frontend: `http://127.0.0.1:5173`

## Scripts incluidos

En la carpeta `scripts/` hay ayudas de arranque:

- `scripts/dev-back.ps1`
- `scripts/dev-front.ps1`

Pueden usarse desde PowerShell, aunque primero conviene entender el arranque manual.

## Problemas comunes

### `node` o `npm` no se reconoce

Causa probable:

- Node instalado pero no visible en el `PATH`

Soluciones:

- cerrar y reabrir terminal
- reiniciar VS Code
- verificar `C:\Program Files\nodejs` en el `PATH`
- probar con:

```powershell
& "C:\Program Files\nodejs\npm.cmd" --version
```

### Error al activar el entorno virtual

Si PowerShell bloquea scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### `uvicorn` no encontrado

Significa que el entorno virtual no esta activo o que faltan dependencias. Reactivar `.venv` y reinstalar.

### `npm install` falla

Revisar:

- que `node --version` funcione
- que `npm --version` funcione
- que estes parado en `front/`
- que exista [front/package.json](/c:/Users/mateo/Documents/github/repos/Gestor-negocio/front/package.json)
