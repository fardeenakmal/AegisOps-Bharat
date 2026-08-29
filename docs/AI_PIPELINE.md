# AI Verification, Triage & Clustering Pipeline

## 1. Pipeline Overview
The AegisOps AI subsystem processes unstructured citizen data (text, photos, metadata) into prioritized, geolocated, deduplicated incidents with actionable operational resource requirements.

```
                  [Raw Citizen Submission]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [NLP Extraction Service]        [Vision Analysis Service]
   - Multilingual Normalization    - Scene Hazard Classification
   - Named Entity Recognition      - Structural Damage Severity (0.0-1.0)
   - Casualty & Entrapment Signals - Perceptual Image Hashing (pHash)
   - Structured Needs Extraction   - Authenticity / Stock Check
            │                                 │
            └────────────────┬────────────────┘
                             ▼
              [Spatiotemporal Dedup Service]
              - Haversine Geospatial Proximity (1.2km)
              - Temporal Window Decay (3h)
              - Text Token Semantic Cosine Similarity
              - Image Perceptual Hash Overlap
                             │
                 ┌───────────┴───────────┐
                 │ Is Cluster Match > 0.48?
                 ▼                       ▼
              [YES]                    [NO]
        Merge into Incident     Create New Incident
        Boost Report Count      Assign Canonical Coordinates
                 │                       │
                 └───────────┬───────────┘
                             ▼
              [Severity Fusion Engine (0-100)]
              - Disaster Type Base Weight
              - Corroboration Multiplier (log2)
              - Casualty & Entrapment Penalty
              - CV Damage Modifier
                             │
                             ▼
         [Dynamic SLA & One-Click Dispatch Suggestion]
```

---

## 2. NLP Intent & Needs Extraction Engine

### 2.1 Casualty & Entrapment Signal Parsing
The NLP parser detects high-urgency keywords and numeric patterns:
- **Entrapment Patterns**: `"(\d+)\s*(people|citizens|children)?\s*trapped"` → extracts `estimatedTrapped`.
- **Casualty Patterns**: `"(\d+)\s*(people|victims)?\s*(injured|hurt|casualties)"` → extracts `estimatedCasualties`.
- **High-Risk Indicators**: `"unconscious"`, `"pediatric"`, `"elderly"`, `"severe trauma"`, `"submerged vehicle"`.

### 2.2 Tactical Resource Needs Inference
Based on the classified hazard and casualty signals:
- **`FLOOD`**: Boats (`ceil(trapped / 4)`), ALS Ambulances (`ceil(casualties / 2)`), SAR squads, water pumps.
- **`FIRE`**: Fire engines (minimum 2), aerial ladder trucks (if multi-storey detected), medical burn kits.
- **`STRUCTURAL_COLLAPSE`**: SAR acoustic detectors, hydraulic extrication jaws, heavy lifting gear.
- **`GAS_LEAK`**: Hazmat level-A isolation equipment, perimeter police units.

---

## 3. Computer Vision & Perceptual Hashing

### 3.1 Damage Assessment
Analyzes keyframes for:
- Thermal flame intensity and smoke plume thickness
- Structural fractures, concrete spalling, collapsed spans
- Water inundation depth relative to vehicles and door thresholds
- Output: normalized damage score from `0.0` (minor) to `1.0` (catastrophic).

### 3.2 Perceptual Image Hashing (`pHash`)
Generates a discrete 64-bit perceptual hash of incoming imagery. Two photos sharing similar visual features will have a low Hamming distance, enabling instant detection of:
- Duplicate uploads from the same scene
- Reposted/stock disaster photos downloaded from the internet

---

## 4. Spatiotemporal Deduplication & Clustering Formula

To determine if an incoming report $R$ matches an ongoing incident $I$, a composite similarity score $S(R, I)$ is computed:

$$S(R, I) = 0.50 \cdot S_{geo} + 0.35 \cdot S_{text} + 0.15 \cdot S_{image}$$

Where:
1. **$S_{geo}$ (Geospatial Proximity)**:
   $$S_{geo} = \max\left(0, 1 - \frac{d_{haversine}(R, I)}{D_{max}}\right)$$
   *(with $D_{max} = 1200\text{ meters}$)*
2. **$S_{text}$ (Semantic Overlap)**: Jaccard/Cosine similarity on normalized keyword token sets.
3. **$S_{image}$ (Visual Similarity)**: Normalized Hamming distance match between perceptual hashes.

If $S(R, I) \ge 0.48$, the report is automatically merged into $I$.

---

## 5. Multi-Modal Severity Fusion Formula

The composite severity score (0 to 100) determines operational priority and SLA response targets:

$$\text{Score} = \text{clamp}\Big(0.40 \cdot W_{base} + \min(20, 6 \cdot \log_2(N)) + \min(25, 4.5 \cdot C) + \min(25, 4.0 \cdot T) + 15 \cdot D_{cv}, 10, 100\Big)$$

Where:
- $W_{base}$: Base incident weight (Earthquake: 75, Collapse: 70, Fire: 65, Flood: 60, Road: 45)
- $N$: Number of corroborating citizen reports linked to the incident cluster
- $C$: Estimated casualties
- $T$: Estimated trapped individuals
- $D_{cv}$: Computer vision damage score ($0.0 \le D_{cv} \le 1.0$)

### SLA Mapping:
- **`CRITICAL` (Score $\ge 80$)**: 10-minute dispatch SLA target with audio alert escalation.
- **`HIGH` (Score $60 - 79$)**: 20-minute dispatch SLA target.
- **`MEDIUM` (Score $40 - 59$)**: 35-minute dispatch SLA target.
- **`LOW` (Score $< 40$)**: 45-minute dispatch SLA target.

---

## 6. Human-in-the-Loop Feedback & Retraining
Every human operator override (adjusting severity, reclassifying hazard type, manual cluster merge/split) requires a mandatory reason and is recorded in `audit_logs`. These logged instances serve as labeled datasets for continuous fine-tuning of the NLP and CV models.
