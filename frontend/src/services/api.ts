import { Incident, Report, Resource, Hospital, PredictionAlert, AuditLog, Dispatch } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

function getAuthHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem('aegisops_token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {};
}

// Emergency Requests / Incidents API
export async function fetchIncidents(params: {
  zone?: string;
  severity?: string;
  type?: string;
  status?: string;
  search?: string;
} = {}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params.zone) query.set('zone', params.zone);
  if (params.severity) query.set('severity', params.severity);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentById(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to fetch incident details');
  return res.json();
}

export async function submitCitizenReport(data: {
  reporterName?: string;
  reporterContact?: string;
  rawText: string;
  normalizedText?: string;
  detectedLanguage?: string;
  latitude: number;
  longitude: number;
  reportedAddress?: string;
  mediaUrls?: string[];
  submissionChannel?: string;
  zoneId?: string;
  voiceAudioBase64?: string;
}): Promise<{ report: any; incident: any; isDuplicate: boolean; trackingId: string }> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit report');
  }
  return res.json();
}

export async function trackReportStatus(trackingId: string) {
  const res = await fetch(`${API_BASE}/reports/${trackingId}/status`);
  if (!res.ok) throw new Error('Failed to track report');
  return res.json();
}

export async function operatorOverrideIncident(
  id: string,
  payload: {
    actorId?: string;
    actorName?: string;
    type?: string;
    severityScore?: number;
    severityLabel?: string;
    priorityScore?: number;
    priorityLevel?: string;
    status?: string;
    needsSummary?: any;
    overrideReason: string;
  }
): Promise<any> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to override incident');
  }
  return res.json();
}

// Tactical Response Teams / Resources
export async function fetchResources(params: { zone?: string; type?: string; status?: string } = {}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params.zone) query.set('zone', params.zone);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/teams?${query.toString()}`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to fetch resources');
  return res.json();
}

export async function fetchSuggestedResources(incidentId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/teams/suggested/${incidentId}`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to fetch suggested resources');
  return res.json();
}

export async function dispatchResource(payload: {
  incidentId: string;
  resourceId?: string;
  teamId?: string;
  assignedByUserId?: string;
  customTaskBrief?: string;
}): Promise<any> {
  const id = payload.incidentId;
  const res = await fetch(`${API_BASE}/incidents/${id}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to dispatch resource');
  }
  return res.json();
}

export async function updateResourceStatus(
  resourceId: string,
  payload: { status: string; dispatchId?: string; notes?: string; photos?: string[] }
): Promise<any> {
  const res = await fetch(`${API_BASE}/teams/${resourceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update resource status');
  return res.json();
}

// Predictions & Risk Zones
export async function fetchPredictions(zone?: string): Promise<any[]> {
  const url = zone ? `${API_BASE}/predictions?zone=${zone}` : `${API_BASE}/predictions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch predictions');
  return res.json();
}

export async function simulatePrediction(payload: {
  zoneId: string;
  riskType: string;
  windSpeedKmh?: number;
  precipitationMmHr?: number;
  riverGaugeSurgePercent?: number;
  earthquakeMagnitude?: number;
  hypocenterDepthKm?: number;
  estimatedCasualties?: number;
  estimatedTrapped?: number;
  scenarioName?: string;
  customSummary?: string;
  injectIncidents?: boolean;
  latitude?: number;
  longitude?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/predictions/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to execute simulation drill');
  return res.json();
}

export async function clearSimulationDrill(): Promise<any> {
  const res = await fetch(`${API_BASE}/predictions/simulate/clear`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to clear simulation drill');
  return res.json();
}

export async function fetchZones(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/zones`);
  if (!res.ok) throw new Error('Failed to fetch risk zones');
  return res.json();
}

// Alerts & Cell Broadcasts
export async function fetchAlerts(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function broadcastPublicAlert(payload: {
  zoneId?: string;
  headline: string;
  description: string;
  severity?: string;
  instruction?: string;
}) {
  const res = await fetch(`${API_BASE}/alerts/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to broadcast alert');
  return res.json();
}

export async function fetchAuditLogs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

// External Real-World Telemetry
export async function fetchLiveWeather(lat: number, lon: number) {
  const res = await fetch(`${API_BASE}/external/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Failed to fetch live weather telemetry');
  return res.json();
}

export async function reverseGeocode(lat: number, lon: number) {
  const res = await fetch(`${API_BASE}/external/geocode?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Failed to reverse geocode location');
  return res.json();
}

export async function searchLocations(query: string) {
  const res = await fetch(`${API_BASE}/external/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search locations');
  return res.json();
}

export async function syncExternalFeeds() {
  const res = await fetch(`${API_BASE}/external/sync`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to sync external feeds');
  return res.json();
}

export async function fetchRiverFloodTelemetry(lat: number, lon: number, basin?: string) {
  const url = `${API_BASE}/external/flood?lat=${lat}&lon=${lon}${basin ? `&basin=${encodeURIComponent(basin)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch river flood telemetry');
  return res.json();
}

export async function fetchTacticalRoute(originLat: number, originLon: number, destLat: number, destLon: number) {
  const url = `${API_BASE}/routes/tactical?originLat=${originLat}&originLon=${originLon}&destLat=${destLat}&destLon=${destLon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to calculate tactical route');
  return res.json();
}

export async function harvestDistrictInfrastructure(lat: number, lon: number, radius = 8000, zoneId?: string) {
  const url = `${API_BASE}/external/infrastructure?lat=${lat}&lon=${lon}&radius=${radius}${zoneId ? `&zoneId=${encodeURIComponent(zoneId)}` : ''}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        facilities: [],
        totalCount: 0,
        hydration: { addedHospitals: 0, addedResources: 0 }
      };
    }
    return await res.json();
  } catch (err) {
    return {
      facilities: [],
      totalCount: 0,
      hydration: { addedHospitals: 0, addedResources: 0 }
    };
  }
}

// Authentication
export async function loginUser(payload: { username: string; password?: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Authentication failed');
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('aegisops_token', data.token);
    localStorage.setItem('aegisops_user', JSON.stringify(data.user));
  }
  return data;
}

export async function registerCitizen(payload: {
  fullName: string;
  username?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  zoneId?: string;
  role?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('aegisops_token', data.token);
    localStorage.setItem('aegisops_user', JSON.stringify(data.user));
  }
  return data;
}

export async function fetchNationalRollup(): Promise<any> {
  const res = await fetch(`${API_BASE}/aggregation/national`);
  if (!res.ok) throw new Error('Failed to fetch national aggregation');
  return res.json();
}

export async function approveCrossJurisdictionRequest(id: string) {
  const res = await fetch(`${API_BASE}/aggregation/cross-request/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ approvedBy: 'NDMA_NATIONAL_COORDINATOR', notes: 'Authorized priority inter-state asset mobilization.' })
  });
  if (!res.ok) {
    throw new Error(`Failed to approve cross-jurisdiction request ${id}`);
  }
  return await res.json();
}

export async function transcribeVoiceAudio(payload: {
  audioBase64?: string;
  languageCode?: string;
  text?: string;
  latitude?: number;
  longitude?: number;
}) {
  const res = await fetch(`${API_BASE}/nlp/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to transcribe and triage voice audio via AegisOps NLP service');
  }
  return await res.json();
}

export const updateIncident = operatorOverrideIncident;

// Real Overpass & NHM-backed Trauma Centres & Emergency Hospitals
export async function fetchHospitals(zone?: string, lat?: number, lon?: number): Promise<any[]> {
  const query = new URLSearchParams();
  if (zone) query.set('zone', zone);
  if (lat !== undefined) query.set('lat', String(lat));
  if (lon !== undefined) query.set('lon', String(lon));

  const res = await fetch(`${API_BASE}/hospitals?${query.toString()}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function updateHospitalCapacity(id: string, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/hospitals/${id}/capacity`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to update capacity for hospital ${id}`);
  }
  return await res.json();
}

export async function updateTeamStatus(teamId: string, payload: { status?: string; latitude?: number; longitude?: number; notes?: string }) {
  const res = await fetch(`${API_BASE}/teams/${teamId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to update status for team ${teamId}`);
  }
  return await res.json();
}

// Live External Disaster Feeds
export async function fetchNasaEonetEvents(): Promise<{ events: any[]; count: number; isLive: boolean; disclaimer: string }> {
  const res = await fetch(`${API_BASE}/external/nasa-eonet`);
  if (!res.ok) throw new Error('Failed to fetch NASA EONET events');
  return res.json();
}

export async function fetchGdacsAlerts(): Promise<{ alerts: any[]; count: number; isLive: boolean; disclaimer: string }> {
  const res = await fetch(`${API_BASE}/external/gdacs`);
  if (!res.ok) throw new Error('Failed to fetch GDACS alerts');
  return res.json();
}

export async function fetchEarthquakes(): Promise<{ events: any[]; count: number; isLive: boolean; disclaimer: string }> {
  const res = await fetch(`${API_BASE}/external/earthquakes`);
  if (!res.ok) throw new Error('Failed to fetch USGS earthquakes');
  return res.json();
}
