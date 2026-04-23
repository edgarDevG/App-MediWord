## ── Stage 1: builder ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (capa cacheada si package.json no cambia)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copiar fuentes y construir
COPY . .

# VITE_API_URL usa ruta relativa para que nginx proxy funcione en cualquier entorno
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

## ── Stage 2: runner ───────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Eliminar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config personalizada con proxy al backend y fallback SPA
COPY nginx.conf /etc/nginx/conf.d/mediword.conf

# Bundle de producción
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
