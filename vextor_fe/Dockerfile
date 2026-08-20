# =============================================================================
# VEXTOR FRONTEND DOCKERFILE (Multi-Stage Build)
# =============================================================================

# --- Etapa 1: Build de la aplicación React ---
FROM node:22-alpine AS builder

WORKDIR /app

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar archivos de manifest de dependencias
COPY package.json pnpm-lock.yaml ./

# Copiar configuración pnpm
COPY .pnpmrc ./

# Instalar dependencias (skip build script warnings)
RUN pnpm install --frozen-lockfile 2>&1 | grep -v "ERR_PNPM_IGNORED_BUILDS" || true

# Copiar código fuente
COPY . .

# Argumentos de construcción para variables VITE_*
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

# Compilar para producción
RUN pnpm run build

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine AS runner

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos compilados desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
