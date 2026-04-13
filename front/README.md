# Frontend

## Que contiene

`front/` contiene la interfaz web del sistema.

Corre localmente en el navegador y consume la API del backend local.

## Stack

- React
- TypeScript
- Vite

## Estructura interna

- `src/app/`: arranque y providers
- `src/layouts/`: layouts compartidos
- `src/pages/`: paginas de alto nivel
- `src/features/`: modulos funcionales
- `src/shared/`: estilos, tipos, cliente API y utilidades

## Instalacion

```powershell
copy .env.example .env
npm install
```

## Arranque

```powershell
npm run dev
```

## Resultado esperado

Abrir `http://127.0.0.1:5173` y verificar que cargue la pantalla inicial del proyecto.

## Nota

La interfaz actual es una base inicial pensada para empezar el desarrollo de modulos reales sin depender de generadores externos.
