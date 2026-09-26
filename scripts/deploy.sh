#!/usr/bin/env bash
# ==============================================================================
# AegisOps Bharat - Automated Production Deployment Orchestrator
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "🛡️  AegisOps Bharat - Automated Deployment Suite"
echo "======================================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 1. Check prerequisites
echo "🔍 Checking system prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose v2 is not installed."
    exit 1
fi

# 2. Check or create .env
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Generating from .env.example..."
    cp .env.example .env
fi

# 3. Pull / Build all container images
echo "🔨 Building multi-stage container images (Spring Boot & Nginx Frontend)..."
docker compose build --parallel

# 4. Launch containers in background
echo "🚀 Booting AegisOps stack (MySQL 8.4, Redis 7, Spring Boot 3.3.4, Nginx Frontend)..."
docker compose up -d

# 5. Wait and verify health
echo "⏳ Waiting for backend healthcheck to turn green (up to 60s)..."
RETRIES=12
until docker compose ps | grep -E "aegisops-backend.*healthy" &> /dev/null || [ $RETRIES -eq 0 ]; do
    echo "   ...waiting for Spring Boot Actuator health probe ($RETRIES attempts left)"
    sleep 5
    RETRIES=$((RETRIES-1))
done

echo ""
echo "📊 Current Container Status:"
docker compose ps

echo ""
echo "======================================================================"
echo "✅ AegisOps Bharat is live and operational!"
echo "   🌐 Web Application (HUD):    http://localhost"
echo "   ⚡ Spring Boot REST/WS API:  http://localhost:4000/api"
echo "   🩺 Actuator Health Monitor:  http://localhost:4000/actuator/health"
echo "   🔐 Default Admin Sign-in:   fardeen / admin123"
echo "======================================================================"
