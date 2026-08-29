# AegisOps System Architecture & Technical Specification

## 1. Executive Summary
**AegisOps** is an enterprise-grade, multi-tenant Emergency Response and Disaster Coordination Platform designed to reduce the time between incident occurrence and tactical resource dispatch. The platform fuses multi-channel citizen reports, NLP intent/entity extraction, computer vision hazard analysis, geospatial PostGIS clustering, and spatiotemporal predictive risk forecasting into a single operational picture.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                CLIENT LAYER                                       |
|  [Citizen Web/PWA]       [Field Responder App]    [Hospital Module]   [Command]   |
+-----------------------------------------------------------------------------------+
                                         │ HTTPS / WSS
                                         ▼
+-----------------------------------------------------------------------------------+
|                             NGINX API GATEWAY                                    |
|   - SSL/TLS Termination    - DDoS Rate Limiting     - Request Correlation ID      |
|   - WebSocket Upgrade      - Gzip/Brotli Comp       - Path-Based Routing          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        APPLICATION SERVICES (Express / Node.js)                   |
|                                                                                   |
|  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  |
|  │  Auth & RBAC Service  │  │ Ingestion & Triage    │  │ Incident Lifecycle    │  |
|  │  (JWT / OAuth2 / PII) │  │ (NLP / Vision / Dedup)│  │ (Aggregate Root)      │  |
|  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘  |
|                                                                                   |
|  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  |
|  │ Dispatch & Logistics  │  │ Hospital Surge Engine │  │ Predictive Modeling   │  |
|  │ (Nearest ETA Routing) │  │ (Casualty Forecast)   │  │ (Spatiotemporal Risk) │  |
|  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘  |
|                                                                                   |
|  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  |
|  │ Aggregation Service   │  │ Realtime WebSocket Hub│  │ Metrics & Telemetry   │  |
|  │ (City->State->Natl)   │  │ (Cluster Synchronizer)│  │ (Prometheus / Health) │  |
|  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘  |
+-----------------------------------------------------------------------------------+
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
+---------------------------------------+ +-----------------------------------------+
|      POSTGRESQL 16 + POSTGIS 3.4      | |               REDIS 7                   |
|  - Spatial Point & Polygon GIST Index | |  - Real-time Pub/Sub Multi-Pod Sync     |
|  - Relational Incident Aggregates     | |  - High-Volume Ingestion Buffer         |
|  - Full Immutable Audit Trails        | |  - Session & Rate Limiting Tokens       |
+---------------------------------------+ +-----------------------------------------+
```

---

## 3. Microservice Bounded Contexts

| Bounded Context | Core Responsibilities |
|---|---|
| **auth-service** | JWT issuance, password hashing, role enforcement (`CITIZEN`, `OPERATOR`, `RESPONDER`, `HOSPITAL_ADMIN`, `STATE_COMMANDER`, `SYSTEM_ADMIN`). |
| **report-ingestion-service** | Ingests multi-channel reports (Web, PWA, SMS, WhatsApp), metadata extraction, anti-spam validation. |
| **ai-triage-service** | NLP intent/needs extraction, computer vision hazard classification, perceptual hashing, and deduplication clustering. |
| **incident-service** | Aggregate root for incident lifecycle (`REPORTED` → `TRIAGED` → `DISPATCHED` → `ON_SCENE` → `CONTAINED` → `RESOLVED`). |
| **dispatch-service** | Calculates nearest available resource vectors using Haversine distance, generates task briefs & checklists. |
| **hospital-service** | Tracks bed/ICU/blood bank capacity, dynamic inbound casualty forecasting, mass casualty surge protocol. |
| **prediction-service** | Spatiotemporal hazard spread simulation (flash flood river surges, wildfire ember propagation). |
| **aggregation-service** | Hierarchical data rollups (City → State → National) and cross-jurisdiction resource reallocation workflow. |
| **realtime-hub** | WebSocket broadcasting of operational events to all connected operator and field consoles. |

---

## 4. Scalability & Availability Target
- **High Availability**: 99.99% uptime with Kubernetes multi-replica deployments and PostGIS replication.
- **Ingestion Latency**: < 200ms for raw text reports; < 3s for multi-image computer vision analysis.
- **Horizontal Scaling**: Horizontal Pod Autoscaler (HPA) dynamically scales backend pods from 3 to 20 instances during disaster surges based on CPU utilization and message queue lag.
