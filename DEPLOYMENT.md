# AegisOps Bharat - Enterprise Production Deployment Manual

This guide documents the procedures for deploying the **AegisOps Bharat** Multi-Hazard Disaster Response Coordination Platform into production environments.

---

## Architecture Overview

```
                      [ Citizens / Responders / EOC Operators ]
                                        │
                                        ▼ HTTPS (Port 443 / 80)
┌─────────────────────────────────────────────────────────────────────────────┐
│ AegisOps Ingress & Reverse Proxy (Nginx 1.27 Alpine)                        │
│ ├─ Static SPA Assets: React 18, Vite 5, Leaflet GIS, PWA Service Worker     │
│ ├─ /api/*          ──▶ Reverse proxy to Spring Boot Port 4000               │
│ ├─ /ws-emergency/* ──▶ Reverse proxy with WebSocket Upgrade (STOMP Broker)  │
│ └─ /actuator/*     ──▶ Actuator Health & Metric Probes                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Internal Network
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ AegisOps Enterprise Backend (Spring Boot 3.3.4 / Eclipse Temurin Java 21)   │
│ ├─ Multilingual Indic NLP Triage (Hindi, Marathi, Bengali, Tamil, Telugu)   │
│ ├─ Multi-Hazard Prediction Engine (8 Disasters + 6 Presets + Prescriptions) │
│ ├─ Dynamic Haversine Unit Dispatch & Spatial Assignment Engine              │
│ └─ Spring Security Stateless JWT & Role-Based Access Control (RBAC)         │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼ JDBC                          ▼ TCP
┌───────────────────────────────┐     ┌───────────────────────────────────────┐
│ MySQL 8.4 LTS Database        │     │ Redis 7 Alpine                        │
│ ├─ Flyway V1 (Schema Tables)  │     │ ├─ STOMP Realtime Pub/Sub Broker      │
│ └─ Flyway V2 (India Geo Seeds)│     │ └─ Dynamic Telemetry Caching          │
└───────────────────────────────┘     └───────────────────────────────────────┘
```

---

## 1. Quick Production Deployment with Docker Compose (Recommended)

The simplest and most resilient way to run AegisOps Bharat on any cloud VM or dedicated server (Ubuntu 22.04 / 24.04 LTS, Debian, RHEL, Amazon Linux 2023):

### Step 1: Clone Repository
```bash
git clone https://github.com/fardeenakmal/AegisOps-Bharat.git
cd AegisOps-Bharat
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
# Edit credentials, JWT secret, and database passwords
nano .env
```

### Step 3: Run Automated Deployment Script
```bash
./scripts/deploy.sh
```
Or run directly via Docker Compose v2:
```bash
docker compose up -d --build
```

### Step 4: Verify Deployment Health
Check running container status:
```bash
docker compose ps
```
Verify Spring Boot Actuator:
```bash
curl http://localhost:4000/actuator/health
# {"status":"UP"}
```
Verify Multi-API Operational Telemetry:
```bash
curl http://localhost:4000/api/system/health
# {"overallStatus":"HEALTHY","operationalCount":11,"totalApis":11}
```

Access the web interface at **`http://localhost`** (or your server's public IP).

Default Admin Credentials:
* **Username**: `fardeen`
* **Password**: `admin123`

---

## 2. Kubernetes Enterprise Cluster Deployment

For state-level SDMA and national NDRF command centers running on Kubernetes (EKS, GKE, AKS, or on-premise OpenShift / MicroK8s / K3s):

### Step 1: Deploy Namespace, ConfigMaps, and Secrets
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
```

### Step 2: Deploy State & Storage Services (MySQL & Redis)
```bash
kubectl apply -f k8s/03-mysql.yaml
kubectl apply -f k8s/04-redis.yaml

# Verify MySQL and Redis are in Running state
kubectl -n aegisops get pods -w
```

### Step 3: Deploy Backend & Frontend Workloads
```bash
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml
```

### Step 4: Verify Pod Health and Rollout
```bash
kubectl -n aegisops rollout status deployment/backend
kubectl -n aegisops rollout status deployment/frontend
kubectl -n aegisops get all
```

---

## 3. Cloud Blueprint Deployments (Render / Railway / Fly.io)

### Render.com
1. Fork or push the repo to GitHub.
2. In Render Dashboard, click **New +** ➔ **Blueprint**.
3. Connect your repository; Render will automatically detect [`render.yaml`](file:///home/fardeen-akmal/Downloads/AegisOps/render.yaml).
4. Click **Apply** to provision Managed MySQL, Dockerized Spring Boot Backend, and Nginx Static/Web Frontend automatically.

### Railway.app
1. Click **New Project** ➔ **Deploy from GitHub repo**.
2. Add a MySQL database service.
3. Add a service pointing to `backend/Dockerfile` with `SPRING_DATASOURCE_URL` linked to MySQL.
4. Add a service pointing to `frontend/Dockerfile`.

---

## 4. Bare-Metal / Systemd Deployment

If hosting without Docker on Linux servers:

### Backend Service (`/etc/systemd/system/aegisops-backend.service`)
```ini
[Unit]
Description=AegisOps Spring Boot Enterprise Backend
After=network.target mysql.service redis.service

[Service]
User=aegisops
WorkingDirectory=/opt/aegisops/backend
Environment="SPRING_PROFILES_ACTIVE=mysql"
Environment="SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/emergency_db?useSSL=false&serverTimezone=UTC"
Environment="SPRING_DATASOURCE_USERNAME=emergency_user"
Environment="SPRING_DATASOURCE_PASSWORD=emergency_secure_pass_2026"
Environment="JWT_SECRET=production-secret-with-minimum-32-chars-long"
ExecStart=/usr/bin/java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -jar target/emergency-response-platform-2.0.0.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aegisops-backend
sudo systemctl status aegisops-backend
```

---

## 5. SSL/TLS Production Encryption (Let's Encrypt / Certbot)

For public production domains (e.g. `aegisops.ndma.gov.in`):

1. Install Certbot and Nginx plugin:
   ```bash
   sudo apt update && sudo apt install -y certbot python3-certbot-nginx
   ```
2. Issue certificate:
   ```bash
   sudo certbot --nginx -d aegisops.example.com
   ```
3. Test auto-renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 6. Disaster Recovery & Database Backups

### Automated Database Backup
```bash
docker exec -t aegisops-mysql mysqldump -u root -proot_secure_pass_2026 \
  --single-transaction --quick --lock-tables=false emergency_db \
  | gzip > /backup/aegisops_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore
```bash
gunzip < /backup/aegisops_backup_20260926_220000.sql.gz \
  | docker exec -i aegisops-mysql mysql -u root -proot_secure_pass_2026 emergency_db
```

---

## 7. Operational Endpoints Reference

| Endpoint | Method | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `/actuator/health` | GET | Liveness and readiness probe for Docker/K8s | Public |
| `/actuator/metrics` | GET | JVM memory, GC, threads, and HTTP latency metrics | Public |
| `/api/system/health` | GET | Status of 11 external authoritative disaster APIs | Public |
| `/ws-emergency` | WS/SockJS | Real-time bi-directional STOMP WebSocket broker | Public |
| `/api/auth/login` | POST | Operator and Field Responder authentication | Public |
| `/api/requests` | GET, POST | Emergency distress call ingestion and pipeline | Public (POST) / RBAC |
| `/api/predictions/simulate`| POST | Multi-hazard synthetic civil defense drill injector | Admin / Operator |
