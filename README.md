# AegisOps — AI-Powered Emergency Response & Disaster Coordination Platform

> Production-grade, multi-tenant emergency management and disaster coordination platform that unifies multi-channel citizen reporting, AI-powered NLP/CV triage, real-time PostGIS spatial situational awareness, automated deduplication, resource dispatching, hospital surge load-balancing, and spatiotemporal risk forecasting.

---

## 📚 Documentation
Complete architectural, API, database, and operational documentation is available in the [`docs/`](./docs) folder:
- [**System Architecture (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md)
- [**Database Design & PostGIS Model (`docs/DATABASE_DESIGN.md`)**](./docs/DATABASE_DESIGN.md)
- [**AI Verification & Triage Pipeline (`docs/AI_PIPELINE.md`)**](./docs/AI_PIPELINE.md)
- [**REST & WebSocket API Reference (`docs/API_REFERENCE.md`)**](./docs/API_REFERENCE.md)
- [**Security & RBAC Matrix (`docs/SECURITY_AND_RBAC.md`)**](./docs/SECURITY_AND_RBAC.md)
- [**DevOps & Kubernetes Deployment (`docs/DEVOPS_AND_DEPLOYMENT.md`)**](./docs/DEVOPS_AND_DEPLOYMENT.md)
- [**Operator & User Manual / SOP (`docs/OPERATOR_AND_USER_MANUAL.md`)**](./docs/OPERATOR_AND_USER_MANUAL.md)

---

## 🏛️ System Architecture

```
[Citizen Web / Mobile PWA] ---> [API Gateway / Express Server] ---> [Report Ingestion Pipeline]
                                                                          |
                                                                [Event Stream / WebSockets]
                                                                          |
        --------------------------------------------------------------------------------------------------
        |                            |                                |                                  |
  [NLP Service]               [Vision Service]             [Dedup / Cluster Service]          [Severity Fusion Service]
  (NER, Needs Extraction,     (Hazard Classification,      (Spatiotemporal Haversine          (Multi-Modal Score [0-100],
   Casualty Signals, Schema)   Damage Score, pHash)         + Embedding Similarity)            Dynamic SLA Allocation)
        --------------------------------------------------------------------------------------------------
                                                                          |
                                                              [Incident Aggregate Root]
                                                                          |
        --------------------------------------------------------------------------------------------------
        |                            |                                |                                  |
 [Control Room Live GIS]      [Field Responder App]          [Hospital Surge Triage]         [Hierarchical Aggregation]
 (Leaflet Threat Overlays,    (Task Briefs, Equipment        (Bed / ICU Monitors,             (City -> State -> National,
  1-Click Unit Dispatch)       Checklists, Status Sync)       Inbound Casualty Radar)          Cross-City Resource Share)
```

---

## 🚀 Key Features

### 1. Multi-Modal AI Verification & Triage Engine
- **NLP Extraction**: Multilingual normalization, entity recognition, casualty signal parsing (`trapped`, `unconscious`, `severe trauma`), and structured needs object extraction (e.g. `boats: 2`, `ambulances: 3`, `extricationJaws: true`).
- **Computer Vision**: Scene hazard categorization, structural damage severity rating (0.0 to 1.0), and perceptual image hashing (`pHash`) for duplicate/stock image verification.
- **Spatiotemporal Deduplication**: Fuses Haversine geospatial proximity (1.2 km decay window), temporal delta, token-based text semantic similarity, and image hash overlap into a unified cluster score to merge corroborating citizen reports into an Incident aggregate root.
- **Severity Fusion (0–100)**: Combines base disaster weights, logarithmic corroboration multipliers, casualty severity modifiers, CV damage scores, and population density into deterministic SLA-driven labels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 2. Live Operations GIS Hub (Control Room)
- Interactive Leaflet map with dark cartography, color-coded severity markers, live vehicle locations, and hazard inundation/ember storm threat overlays.
- Real-time Incident Triage Queue with search, category filtering, SLA aging countdowns, and unverified flags.
- Complete Incident Inspection Drawer with merged report threads, evidence photo gallery, AI confidence breakdown, nearest available resource recommendations, and 1-click dispatch.
- **Operator Manual Override**: Capability for human dispatchers to reclassify types or override severity scores with mandatory justification logging for model training feedback loops.

### 3. Field Responder Mobile & PWA View
- Tactical mission briefs with GPS destination addresses and incident telemetry.
- Equipment and life-support safety protocol checklists.
- 1-tap live status updates (`EN_ROUTE` → `ON_SCENE` → `COMPLETED`) with field notes.

### 4. Hospital Surge & Casualty Load-Balancing
- Real-time general bed, ICU, and blood bank capacity monitoring.
- Dynamic AI Inbound Casualty Forecasting (expected patient arrival surge, ETA, and critical/urgent/minor triage distribution).
- Mass Casualty Incident (MCI) emergency surge protocol broadcast.

### 5. Predictive Analytics & Hazard Simulation
- Spatiotemporal predictive models for flash flood river gauge surges and thermal ember storm dispersal.
- Actionable directives and tactical equipment pre-positioning suggestions.

### 6. Hierarchical Aggregation (City → State → National)
- State-level aggregate metrics across subordinate city command centers.
- Inter-city cross-jurisdiction resource-sharing request and approval workflow.
- Common Alerting Protocol (CAP) public safety emergency broadcast engine.

---

## 📂 Project Structure

```
├── db/
│   └── schema.sql                  # PostgreSQL 16+ with PostGIS 3.4 DDL schema & seed data
├── backend/
│   ├── src/
│   │   ├── types/index.ts          # Domain type definitions
│   │   ├── db/memoryStore.ts       # In-memory store with realistic seed dataset
│   │   ├── services/
│   │   │   ├── ai/nlpService.ts    # NLP triage, entity & needs extraction
│   │   │   ├── ai/visionService.ts # Computer vision hazard & damage scoring
│   │   │   ├── ai/dedupClusterService.ts # Spatiotemporal & embedding clustering
│   │   │   ├── ai/severityFusionService.ts # Multi-factor severity fusion (0-100)
│   │   │   ├── reportIngestionService.ts # Citizen submission ingestion & deduplication
│   │   │   ├── incidentService.ts  # Incident lifecycle, querying, and operator overrides
│   │   │   ├── dispatchService.ts  # Nearest unit recommendation & dispatching
│   │   │   ├── hospitalService.ts  # Hospital bed capacity & casualty forecast
│   │   │   ├── predictionService.ts# Spatiotemporal risk & hazard simulation
│   │   │   └── aggregationService.ts # Hierarchical rollups & cross-city transfers
│   │   ├── routes/api.ts           # REST API endpoints matching spec
│   │   ├── websocket/hub.ts        # Real-time WebSocket broadcasting hub
│   │   ├── tests/pipeline.test.ts  # Automated unit test suite
│   │   └── index.ts                # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Top command navigation & CAP triggers
│   │   │   ├── LiveMap.tsx         # Leaflet GIS map with pulsing markers & overlays
│   │   │   ├── IncidentQueue.tsx   # Live triage queue with SLA timers
│   │   │   ├── IncidentDetailModal.tsx # Full detail inspection, dispatch & override
│   │   │   ├── CitizenReportingModal.tsx # Public reporting form & tracking ID tracker
│   │   │   ├── ResponderView.tsx   # Mobile-ready tactical screen for field teams
│   │   │   ├── HospitalTriagePanel.tsx # Hospital surge & inbound casualty radar
│   │   │   ├── StateNationalRollup.tsx # State/National command aggregation
│   │   │   ├── PredictionSimulationModal.tsx # Spatiotemporal simulation runner
│   │   │   ├── BroadcastModal.tsx  # CAP public alert dissemination
│   │   │   └── AuditLogModal.tsx   # Traceable AI & operator decision audit trail
│   │   ├── services/api.ts         # Frontend API client
│   │   ├── index.css               # Design system tokens & dark theme
│   │   ├── App.tsx                 # Root application
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml              # PostGIS, Redis, and Backend orchestration
└── README.md
```

---

## ⚡ Quickstart

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (optional for PostGIS)

### 1. Run with Docker Compose (PostGIS + Redis + Backend)
```bash
docker compose up --build
```

### 3. Deploying to Production (Render & Vercel)

#### A. Backend Deployment on Render (Web Service)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your GitHub repository (`https://github.com/fardeenakmal/AegisOps.git`).
3. Configure settings:
   - **Root Directory**: `backend` (or use the root `render.yaml`)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables in Render:
   - `PORT`: `10000` (Render sets this automatically)
   - `NODE_ENV`: `production`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (Optional / For live SMS alerts)
   - `OPENWEATHER_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` (Optional)

#### B. Frontend Deployment on Vercel
1. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** -> **Project**.
2. Import the `AegisOps` repository.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com` (Your Render Web Service URL)
5. Click **Deploy**.

---

## 🧪 Testing

Run backend unit and pipeline integration tests:
```bash
npm run test:backend
```

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reports` | Ingest citizen emergency report with AI triage & deduplication |
| `GET` | `/api/reports/:trackingId/status` | Track status of citizen report |
| `GET` | `/api/incidents` | Filterable incident feed with spatial bounds and severity |
| `GET` | `/api/incidents/:id` | Full incident details with merged report threads & AI metadata |
| `PATCH` | `/api/incidents/:id` | Operator manual override (reclassify, severity adjustment, status) |
| `GET` | `/api/resources` | Query emergency resources (ambulances, fire engines, boats, SAR) |
| `GET` | `/api/resources/suggested/:incidentId` | Proximity-ranked units with estimated arrival times (ETA) |
| `POST` | `/api/incidents/:id/dispatch` | Dispatch resource and generate structured task brief |
| `PATCH` | `/api/resources/:id/status` | Field team status update (`EN_ROUTE`, `ON_SCENE`, `COMPLETED`) |
| `GET` | `/api/hospitals` | Hospital bed & ICU capacities with inbound casualty forecasts |
| `POST` | `/api/hospitals/:id/capacity` | Hospital self-reported capacity update |
| `GET` | `/api/predictions` | Active spatiotemporal hazard alerts |
| `POST` | `/api/predictions/simulate` | Execute hazard spread simulation |
| `GET` | `/api/aggregation/state/:id` | State-level rollup and child city matrix |
| `GET` | `/api/aggregation/national` | National disaster center aggregate statistics |
| `POST` | `/api/aggregation/cross-request` | Submit inter-city resource reallocation request |
| `PATCH` | `/api/aggregation/cross-request/:id/approve` | Approve cross-city resource transfer |
| `POST` | `/api/alerts/broadcast` | Disseminate Common Alerting Protocol (CAP) emergency alert |
| `GET` | `/api/audit-logs` | Retrieve immutable audit trail of all AI & operator decisions |
| `WS` | `/ws/incidents` | Real-time WebSocket event stream |
