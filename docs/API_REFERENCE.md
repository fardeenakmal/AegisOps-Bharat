# AegisOps REST & WebSocket API Reference

## Base URLs
- **REST API**: `http://localhost:4000/api` (Production: `https://emergency.operations.gov/api`)
- **WebSocket Feed**: `ws://localhost:4000/ws/incidents` (Production: `wss://emergency.operations.gov/ws/incidents`)

---

## Authentication Header
Protected endpoints require a Bearer token:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user with credentials.
- **Request Body**:
  ```json
  {
    "username": "operator1",
    "password": "secure_password"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "usr-op-1",
      "username": "operator1",
      "fullName": "Capt. Elena Vance",
      "role": "CONTROL_ROOM_OPERATOR",
      "zoneId": "zone-city-1"
    }
  }
  ```

### `GET /api/auth/demo-tokens`
Returns pre-signed JWT tokens for quick role testing.

---

## 2. Citizen Reporting Endpoints

### `POST /api/reports`
Submits a citizen emergency incident report.
- **Rate Limit**: 30 requests/minute per IP.
- **Request Body**:
  ```json
  {
    "reporterName": "Carlos Gomez",
    "reporterContact": "+1-555-0199",
    "rawText": "Severe flash flood rising in Sector 2 underpass! 5 people trapped on car roof.",
    "latitude": 19.0530,
    "longitude": 72.8510,
    "reportedAddress": "5th Cross Road Underpass",
    "mediaUrls": ["https://images.unsplash.com/..."],
    "submissionChannel": "WEB"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "trackingId": "TRK-2026-6836",
    "isDuplicate": false,
    "message": "Report verified and new emergency incident created.",
    "report": { "id": "rep-26c0ee95", "status": "VERIFIED", ... },
    "incident": { "id": "inc-f2bf6b18", "type": "FLOOD", "severityScore": 92.5, "severityLabel": "CRITICAL", ... }
  }
  ```

### `GET /api/reports/:trackingId/status`
Tracks live status of a submitted report.
- **Response `200 OK`**:
  ```json
  {
    "incidentStatus": "DISPATCHED",
    "incidentTitle": "FLOOD: Severe flash flood rising in Sector 2",
    "severityLabel": "CRITICAL",
    "etaMinutes": 8
  }
  ```

---

## 3. Incident Operations Endpoints

### `GET /api/incidents`
Query active incidents with optional filters.
- **Query Params**: `zone`, `severity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `type`, `status`, `search`.
- **Response `200 OK`**: Array of `Incident` objects.

### `GET /api/incidents/:id`
Fetch full incident details including merged reports, extracted needs, and AI confidence metadata.

### `PATCH /api/incidents/:id`
Operator manual override for incident classification or severity.
- **Request Body**:
  ```json
  {
    "actorId": "usr-op-1",
    "actorName": "Capt. Elena Vance",
    "severityScore": 95.0,
    "severityLabel": "CRITICAL",
    "status": "DISPATCHED",
    "overrideReason": "Aerial drone video confirms fuel tanker breach with secondary explosion risk."
  }
  ```

---

## 4. Dispatch & Resource Endpoints

### `GET /api/resources`
Query emergency vehicle fleet and rescue squads.
- **Query Params**: `zone`, `type` (`AMBULANCE`, `FIRE_TRUCK`, `RESCUE_BOAT`, `SAR_TEAM`, `HAZMAT_CREW`), `status`.

### `GET /api/resources/suggested/:incidentId`
Returns available units ranked by proximity (Haversine distance) with calculated arrival ETAs.

### `POST /api/incidents/:id/dispatch`
Dispatches a resource to an incident and generates tactical briefing.
- **Request Body**:
  ```json
  {
    "resourceId": "res-amb-1",
    "assignedByUserId": "usr-op-1"
  }
  ```

### `PATCH /api/resources/:id/status`
Field responder updates live status (`EN_ROUTE`, `ON_SCENE`, `AVAILABLE`) with notes/photos.

---

## 5. Hospital & Surge Endpoints

### `GET /api/hospitals`
Returns hospital list with general bed, ICU, and blood bank status.

### `GET /api/hospitals/:id/capacity`
Returns hospital capacity + AI inbound casualty forecast.

### `POST /api/hospitals/:id/capacity`
Update hospital capacity or toggle Mass Casualty Incident (MCI) mode.

---

## 6. Prediction & Aggregation Endpoints

### `GET /api/predictions`
Returns active spatiotemporal threat alerts.

### `POST /api/predictions/simulate`
Executes spatiotemporal hazard propagation simulation.

### `GET /api/aggregation/state/:id`
State-level aggregation metrics across subordinate cities.

### `GET /api/aggregation/national`
National disaster center aggregate statistics.

### `POST /api/aggregation/cross-request`
Submit inter-city resource reallocation request.

### `POST /api/alerts/broadcast`
Broadcast Common Alerting Protocol (CAP) public safety advisory.

### `GET /api/audit-logs`
Retrieve full immutable audit logs of all AI decisions and operator overrides.

---

## 7. Real-Time WebSocket Events (`/ws/incidents`)

Clients connect to `ws://localhost:4000/ws/incidents` to receive streaming JSON payloads:
```json
{
  "type": "INCIDENT_CREATED",
  "timestamp": "2026-08-28T12:44:01.808Z",
  "data": { "incident": { ... }, "report": { ... } }
}
```

### Event Types:
- `INCIDENT_CREATED`: New disaster incident registered.
- `INCIDENT_UPDATED`: Incident status or severity updated.
- `INCIDENT_MERGED`: Corroborating report merged into existing cluster.
- `DISPATCH_CREATED`: Emergency unit assigned.
- `RESOURCE_STATUS_CHANGED`: Vehicle position or status changed.
- `HOSPITAL_CAPACITY_UPDATED`: Hospital bed / ICU capacity modified.
- `PREDICTION_ALERT_ISSUED`: Spatiotemporal hazard alert generated.
- `PUBLIC_BROADCAST`: CAP emergency alert broadcast.
