#!/usr/bin/env bash
# =============================================================================
# AegisOps Platform: Automated SSL/TLS Certificate & PKCS12 Keystore Generator
# Generates cryptographic credentials for local HTTPS, WSS, Web Audio,
# Geolocation API, and Service Worker PWA secure contexts.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="$ROOT_DIR/certs"
BACKEND_CERTS_DIR="$ROOT_DIR/backend/src/main/resources/certs"
FRONTEND_CERTS_DIR="$ROOT_DIR/frontend/certs"

KEY_PASSWORD="aegisops-secure-cert-2026"
VALIDITY_DAYS=3650
SUBJECT="/C=IN/ST=Delhi/L=NewDelhi/O=National Disaster Management Authority/OU=AegisOps Intelligence Platform/CN=localhost"

echo "================================================================================"
echo "🛡️  AegisOps SSL/TLS Certificate & Keystore Generation Tool"
echo "================================================================================"

mkdir -p "$CERTS_DIR"
mkdir -p "$BACKEND_CERTS_DIR"
mkdir -p "$FRONTEND_CERTS_DIR"

echo "1. Generating 2048-bit RSA Private Key & Self-Signed X.509 Certificate with SAN..."
openssl req -x509 -nodes -days "$VALIDITY_DAYS" -newkey rsa:2048 \
  -keyout "$CERTS_DIR/localhost.key" \
  -out "$CERTS_DIR/localhost.crt" \
  -subj "$SUBJECT" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,DNS:*.localhost"

chmod 600 "$CERTS_DIR/localhost.key"
chmod 644 "$CERTS_DIR/localhost.crt"

echo "2. Exporting PKCS#12 Keystore (for Spring Boot / Java 21)..."
openssl pkcs12 -export \
  -in "$CERTS_DIR/localhost.crt" \
  -inkey "$CERTS_DIR/localhost.key" \
  -out "$CERTS_DIR/keystore.p12" \
  -name aegisops \
  -passout pass:"$KEY_PASSWORD"

chmod 600 "$CERTS_DIR/keystore.p12"

echo "3. Distributing Keystore to Spring Boot backend..."
cp -f "$CERTS_DIR/keystore.p12" "$BACKEND_CERTS_DIR/keystore.p12"

echo "4. Distributing PEM Certificate & Key to Vite frontend..."
cp -f "$CERTS_DIR/localhost.crt" "$FRONTEND_CERTS_DIR/localhost.crt"
cp -f "$CERTS_DIR/localhost.key" "$FRONTEND_CERTS_DIR/localhost.key"

echo ""
echo "✅ Certificate Generation Complete!"
echo "--------------------------------------------------------------------------------"
echo "Root Certificates:     $CERTS_DIR/localhost.crt & localhost.key"
echo "PKCS#12 Keystore:      $BACKEND_CERTS_DIR/keystore.p12"
echo "Vite Frontend Keys:    $FRONTEND_CERTS_DIR/localhost.crt & localhost.key"
echo "Keystore Alias:        aegisops"
echo "Keystore Password:     $KEY_PASSWORD"
echo "Validity:              $VALIDITY_DAYS days (Expires: $(date -d "+$VALIDITY_DAYS days" +%Y-%m-%d))"
echo "SAN Extensions:        DNS:localhost, IP:127.0.0.1, DNS:*.localhost"
echo "================================================================================"

