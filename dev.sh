#!/usr/bin/env bash

set -Eeuo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/back"
FRONTEND_DIR="$ROOT_DIR/front"
BACKEND_PID=""
FRONTEND_PID=""

fail() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

cleanup() {
    if [ -n "$BACKEND_PID$FRONTEND_PID" ]; then
        echo -e "\n${YELLOW}Deteniendo servidores...${NC}"
    fi

    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    wait 2>/dev/null || true
}

trap cleanup EXIT
trap 'exit 0' INT TERM

command -v python3 >/dev/null 2>&1 || fail "No se encontro python3. Instala Python 3.10 o superior."
command -v npm >/dev/null 2>&1 || fail "No se encontro npm. Instala Node.js 20 LTS o superior."

echo -e "${BLUE}=== Iniciando Gestor Negocio (Entorno de Desarrollo) ===${NC}"

echo -e "\n${GREEN}[Backend] Preparando entorno...${NC}"
cd "$BACKEND_DIR"

if [ ! -x ".venv/bin/python" ]; then
    if [ -e ".venv" ]; then
        fail "El entorno back/.venv no es valido. Eliminalo manualmente y volve a ejecutar el script."
    fi
    echo -e "${YELLOW}[Backend] Creando entorno virtual...${NC}"
    python3 -m venv .venv || fail "No se pudo crear .venv. Verifica que python3-venv este instalado."
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[Backend] Creando .env desde .env.example...${NC}"
    cp .env.example .env
fi

echo -e "${GREEN}[Backend] Instalando dependencias...${NC}"
.venv/bin/python -m pip install -r requirements.txt || fail "No se pudieron instalar las dependencias del backend."

echo -e "${GREEN}[Backend] Iniciando FastAPI...${NC}"
.venv/bin/python -m uvicorn app.main:app --reload &
BACKEND_PID=$!

echo -e "\n${BLUE}[Frontend] Preparando entorno...${NC}"
cd "$FRONTEND_DIR"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[Frontend] Creando .env desde .env.example...${NC}"
    cp .env.example .env
fi

if [ ! -x "node_modules/.bin/vite" ]; then
    echo -e "${YELLOW}[Frontend] Instalando dependencias...${NC}"
    npm ci || fail "No se pudieron instalar las dependencias del frontend."
fi

echo -e "${BLUE}[Frontend] Iniciando Vite...${NC}"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}=== Servidores iniciados ===${NC}"
echo -e "Backend:  ${BLUE}http://127.0.0.1:8000${NC} (docs: http://127.0.0.1:8000/docs)"
echo -e "Frontend: ${BLUE}http://127.0.0.1:5173${NC}"
echo -e "${YELLOW}Presiona Ctrl+C para detener ambos servidores.${NC}\n"

wait "$BACKEND_PID" "$FRONTEND_PID"
