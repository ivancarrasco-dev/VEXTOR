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

# Instalar dependencias de forma reproducible; cualquier error debe detener la imagen.
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Argumentos de construcción
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_TOMTOM_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL
ENV VITE_TOMTOM_API_KEY=$VITE_TOMTOM_API_KEY

# La imagen solo se publica si el build de Vite termina correctamente.
RUN pnpm run build

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
