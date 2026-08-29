# AegisOps Operator & User Standard Operating Procedures (SOP)

## 1. Control Room Operator Guide

### 1.1 Monitoring the Operational Picture
1. Access the **Control Room** tab.
2. The **Live GIS Map** displays all active incidents.
   - 🔴 **Red Pulsing Markers**: Critical uncontained incidents.
   - 🟠 **Orange Markers**: High severity incidents.
   - 🚑 / 🚒 **Moving Unit Markers**: Available (cyan) or Dispatched (orange) emergency vehicles.
3. Review the **Active Incident Queue** on the right. Incidents are sorted by severity score (0 to 100).
4. Watch the dynamic SLA timer countdown. If an incident is uncontained past its SLA threshold, it triggers an audible escalation.

### 1.2 Inspecting an Incident & 1-Click Dispatch
1. Click an incident card or map pin to open the **Incident Detail Modal**.
2. Review the **AI Confidence Breakdown** and **Merged Citizen Report Timeline**.
3. Check the **Extracted Operational Needs** (e.g. `2 Rescue Boats`, `3 Ambulances`).
4. Under **Nearest Available Units**, review the ETA and distance of nearby fleets.
5. Click **Dispatch** next to the selected unit. The system automatically creates a task brief, sends the coordinates to the field team, and updates the incident status to `DISPATCHED`.

### 1.3 Executing a Manual Operator Override
1. If aerial drone footage or field intelligence contradicts the AI label, click **Operator Override** in the incident modal.
2. Adjust the hazard classification type, severity score slider, or status.
3. Enter a mandatory **Justification Reason** (e.g. *"Visual confirmation from drone 4 shows flames suppressed"*).
4. Click **Commit Override**. The action is permanently recorded in the `audit_logs` for model feedback.

---

## 2. Field Responder Mobile Guide

1. Navigate to the **Field Responder** tab.
2. Select your assigned squad or vehicle callsign from the dropdown (e.g. `MEDIC-ONE (ALS)`).
3. Review your **Active Tactical Mission Brief** and incident destination address.
4. Complete the pre-deployment **Equipment & Safety Checklist**.
5. Update your operational status by tapping:
   - 🚨 **En Route**: Signals dispatch you are en route.
   - 📍 **On Scene**: Signals arrival at the disaster site.
   - ✅ **Mission Completed**: Marks task as resolved, releasing the unit back to `AVAILABLE`.

---

## 3. Hospital Surge Administrator Guide

1. Navigate to the **Hospital Surge** tab.
2. Select your facility from the dropdown.
3. Monitor the **AI Inbound Casualty Forecast Radar** for projected incoming patient surge, ETA, and critical/urgent/minor triage distribution.
4. If incoming casualty demand exceeds facility capacity, click **Activate MCI Protocol** to broadcast mass-casualty status to the state network and balance incoming ambulances to neighboring trauma centers.
5. Update available general and ICU bed counts using the **-1 Intake / +1 Discharge** buttons.

---

## 4. Citizen Reporting Portal Guide

1. Click the **+ Report Incident** button on the top navigation bar.
2. Describe the emergency situation in free text (e.g. *"Flood water rising in underpass, 4 people trapped on car roof"*).
3. Confirm or auto-detect your GPS coordinates.
4. Optionally attach a photo.
5. Click **Dispatch Emergency Report**.
6. Note your unique **Tracking ID** (e.g. `TRK-2026-6836`). You can return at any time to track real-time dispatcher status (Received → Verified → Dispatched → Resolved).
