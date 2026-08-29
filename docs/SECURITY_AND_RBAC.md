# Security, Authentication & Role-Based Access Control (RBAC)

## 1. Security Architecture Overview
AegisOps adheres to strict zero-trust operational security guidelines to safeguard critical municipal infrastructure, prevent unauthorized access to emergency fleets, protect citizen PII, and maintain data integrity during crisis events.

---

## 2. Role-Based Access Control (RBAC) Matrix

| User Role | Ingest Reports | View Live GIS Map | One-Click Dispatch | Operator Override | Update Hospital Capacity | State/Natl Rollup | CAP Broadcast |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CITIZEN** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CONTROL_ROOM_OPERATOR** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **RESCUE_RESPONDER** | ❌ | ✅ (Task View) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **HOSPITAL_ADMIN** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **STATE_COMMANDER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **NATIONAL_COMMANDER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SYSTEM_ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. Authentication & JWT Tokens
- **JWT Algorithms**: Signed with HMAC-SHA256 (or RSA-256 for asymmetric public-key verification).
- **Token Claims**:
  - `userId`: Unique subject identifier.
  - `username`: Operator / Admin username.
  - `role`: Assigned RBAC role from the matrix.
  - `zoneId`: Assigned jurisdictional boundary (e.g. `zone-city-1`).
  - `exp`: 24-hour expiration token lifetime.

---

## 4. Rate Limiting & Anti-DDoS Protection
During disaster events, systems often experience severe traffic spikes and coordinated spam campaigns. AegisOps implements multi-tiered rate limiting:
1. **Nginx Layer**: `limit_req_zone` restricts client IPs to a maximum burst of 50 requests/second.
2. **Express Ingestion Layer**: `citizenReportLimiter` throttles reporting to 30 submissions per minute per IP address.
3. **Spam Classifier**: AI checks submissions for text length, gibberish content, and perceptual image hash duplication against stock photo databases.

---

## 5. PII Masking & Data Privacy
- Citizen contact phone numbers and names are stored in secure fields.
- When rolling up data from City to State or National command levels, PII is automatically stripped, aggregating only counts, coordinates, and tactical hazard metrics.
