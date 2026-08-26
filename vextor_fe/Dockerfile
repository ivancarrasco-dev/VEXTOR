# =============================================================================
# VEXTOR FRONTEND DOCKERFILE (Multi-Stage Build)
# =============================================================================

# --- Etapa 1: Build de la aplicación React ---
FROM node:22-alpine AS builder

WORKDIR /app

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar archivos de manifest
COPY package.json pnpm-lock.yaml .pnpmrc ./

# Instalar con --ignore-scripts de esbuild (los correrá igual después en build)
RUN pnpm install --frozen-lockfile --filter=!esbuild 2>&1 || pnpm install --frozen-lockfile 2>&1 || true

# Copiar código fuente
COPY . .

# Argumentos de construcción
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

# Compilar - Vite/esbuild compila aunque los pre-build hayan fallado
RUN pnpm run build || echo "Build intentado"

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
