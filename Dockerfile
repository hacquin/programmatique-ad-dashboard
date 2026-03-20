# =============================================================================
# NURU - Dashboard Programmatique | Production Dockerfile
# Multi-stage build: Node (build) -> Nginx (serve)
# =============================================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
