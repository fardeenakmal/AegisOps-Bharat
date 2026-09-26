# ==============================================================================
# Multi-Stage Production Dockerfile for AegisOps Frontend (React + Vite + Nginx)
# ==============================================================================

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install exact dependencies
RUN npm ci --prefer-offline --no-audit

# Copy application sources
COPY . .

# Build production bundle with Vite
RUN npm run build

# --- Stage 2: Production Nginx Server ---
FROM nginx:1.27-alpine

# Set working directory to Nginx html folder
WORKDIR /usr/share/nginx/html

# Clean default Nginx site files
RUN rm -rf ./*

# Copy compiled SPA assets from builder
COPY --from=builder /app/dist ./

# Copy optimized Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Health check to ensure Nginx is serving traffic
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/nginx-health || exit 1

# Launch Nginx in foreground
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
