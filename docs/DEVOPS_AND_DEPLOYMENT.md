# DevOps, Containerization & Kubernetes Deployment Guide

## 1. Local Development
Start the full stack locally:
```bash
# Start backend (Port 4000)
cd backend && npm run dev

# Start frontend (Port 3000)
cd frontend && npm run dev
```

---

## 2. Docker Compose Deployment
To run PostgreSQL with PostGIS 3.4, Redis 7, and the Backend in containerized mode:
```bash
docker compose up --build -d
```
Verify running services:
```bash
docker compose ps
```

---

## 3. Production Kubernetes (K8s) Cluster Deployment

### 3.1 Apply Cluster Manifests
```bash
# 1. Create Namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 3. Deploy Databases (PostGIS StatefulSet & Redis)
kubectl apply -f k8s/postgres-postgis.yaml
kubectl apply -f k8s/redis.yaml

# 4. Deploy Application Workloads & Autoscalers
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# 5. Apply Ingress Controller with TLS & WebSocket routing
kubectl apply -f k8s/ingress.yaml
```

### 3.2 Verify Deployment Status
```bash
kubectl get pods -n aegisops-production
kubectl get hpa -n aegisops-production
```

---

## 4. Horizontal Pod Autoscaling (HPA) Rules
The backend deployment uses Kubernetes HPA to automatically scale pod replicas between **3 (minimum)** and **20 (maximum)** based on:
- **CPU Threshold**: > 70% average pod utilization.
- **Memory Threshold**: > 75% average pod memory limit.

---

## 5. Monitoring & Prometheus Scraping
Prometheus can scrape cluster metrics by targeting:
```yaml
scrape_configs:
  - job_name: 'aegisops-backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend-service.aegisops-production.svc.cluster.local:4000']
```
