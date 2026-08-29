import { Incident, Report, Resource, Hospital, PredictionAlert, AuditLog, Dispatch } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export async function fetchIncidents(params: {
  zone?: string;
  severity?: string;
  type?: string;
  status?: string;
  search?: string;
} = {}): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params.zone) query.set('zone', params.zone);
  if (params.severity) query.set('severity', params.severity);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentById(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident details');
  return res.json();
}

export async function submitCitizenReport(data: {
  reporterName?: string;
  reporterContact?: string;
  rawText: string;
  latitude: number;
  longitude: number;
  reportedAddress?: string;
  mediaUrls?: string[];
  submissionChannel?: string;
  zoneId?: string;
}): Promise<{ report: Report; incident: Incident; isDuplicate: boolean; trackingId: string }> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
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
    actorId: string;
    actorName: string;
    type?: string;
    severityScore?: number;
    severityLabel?: string;
    status?: string;
    needsSummary?: any;
    overrideReason: string;
  }
): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to override incident');
  }
  return res.json();
}

export async function fetchResources(params: { zone?: string; type?: string; status?: string } = {}): Promise<Resource[]> {
  const query = new URLSearchParams();
  if (params.zone) query.set('zone', params.zone);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/resources?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch resources');
  return res.json();
}

export async function fetchSuggestedResources(incidentId: string): Promise<Resource[]> {
  const res = await fetch(`${API_BASE}/resources/suggested/${incidentId}`);
  if (!res.ok) throw new Error('Failed to fetch suggested resources');
  return res.json();
}

export async function dispatchResource(payload: {
  incidentId: string;
  resourceId: string;
  assignedByUserId?: string;
  customTaskBrief?: string;
}): Promise<{ dispatch: Dispatch; resource: Resource }> {
  const res = await fetch(`${API_BASE}/incidents/${payload.incidentId}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to dispatch resource');
  }
  return res.json();
}

export async function updateResourceStatus(
  resourceId: string,
  payload: { status: string; dispatchId?: string; notes?: string; photos?: string[] }
): Promise<Resource> {
  const res = await fetch(`${API_BASE}/resources/${resourceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update resource status');
  return res.json();
}

export async function fetchHospitals(zone?: string): Promise<Hospital[]> {
  const url = zone ? `${API_BASE}/hospitals?zone=${zone}` : `${API_BASE}/hospitals`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch hospitals');
  return res.json();
}

export async function updateHospitalCapacity(
  id: string,
  payload: { availableBeds?: number; availableIcuBeds?: number; massCasualtyMode?: boolean }
): Promise<Hospital> {
  const res = await fetch(`${API_BASE}/hospitals/${id}/capacity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update hospital capacity');
  return res.json();
}

export async function fetchPredictions(zone?: string): Promise<PredictionAlert[]> {
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
}): Promise<PredictionAlert> {
  const res = await fetch(`${API_BASE}/predictions/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to simulate prediction');
  return res.json();
}

export async function fetchStateRollup(stateId: string = 'zone-state-1') {
  const res = await fetch(`${API_BASE}/aggregation/state/${stateId}`);
  if (!res.ok) throw new Error('Failed to fetch state aggregation');
  return res.json();
}

export async function fetchNationalRollup() {
  const res = await fetch(`${API_BASE}/aggregation/national`);
  if (!res.ok) throw new Error('Failed to fetch national aggregation');
  return res.json();
}

export async function broadcastPublicAlert(payload: {
  zoneId: string;
  headline: string;
  description: string;
  severity?: string;
  instruction?: string;
}) {
  const res = await fetch(`${API_BASE}/alerts/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to broadcast alert');
  return res.json();
}

export async function approveCrossJurisdictionRequest(id: string) {
  const res = await fetch(`${API_BASE}/aggregation/cross-request/${id}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve cross jurisdiction request');
  return res.json();
}

export const updateIncident = operatorOverrideIncident;

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

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
  const res = await fetch(`${API_BASE}/external/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync external feeds');
  return res.json();
}

export async function fetchExternalFeedsStatus() {
  const res = await fetch(`${API_BASE}/external/feeds`);
  if (!res.ok) throw new Error('Failed to fetch external feeds status');
  return res.json();
}
