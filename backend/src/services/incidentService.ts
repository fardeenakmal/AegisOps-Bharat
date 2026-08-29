import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { Incident, IncidentStatus, IncidentType, SeverityLabel, AuditLog } from '../types';
import { realtimeHub } from '../websocket/hub';

export interface IncidentFilters {
  zoneId?: string;
  severity?: SeverityLabel;
  type?: IncidentType;
  status?: IncidentStatus;
  search?: string;
}

export interface OperatorOverridePayload {
  actorId: string;
  actorName: string;
  type?: IncidentType;
  severityScore?: number;
  severityLabel?: SeverityLabel;
  status?: IncidentStatus;
  needsSummary?: any;
  overrideReason: string;
}

const ZONE_CENTERS: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  'zone-mh-mum': { lat: 19.0760, lng: 72.8777, radiusKm: 750 },
  'zone-dl-ncr': { lat: 28.6139, lng: 77.2090, radiusKm: 750 },
  'zone-ka-blr': { lat: 12.9716, lng: 77.5946, radiusKm: 750 },
  'zone-tn-chn': { lat: 13.0827, lng: 80.2707, radiusKm: 750 },
  'zone-od-bbs': { lat: 20.2961, lng: 85.8245, radiusKm: 750 },
  'zone-wb-kol': { lat: 22.5726, lng: 88.3639, radiusKm: 750 }
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class IncidentService {
  getIncidents(filters: IncidentFilters = {}): Incident[] {
    let list = Array.from(db.incidents.values());

    if (filters.zoneId && filters.zoneId !== 'zone-ndma-in' && filters.zoneId !== 'ALL') {
      const zoneConfig = ZONE_CENTERS[filters.zoneId];
      if (zoneConfig) {
        list = list.filter((i) => {
          if (i.zoneId === filters.zoneId) return true;
          if (i.latitude && i.longitude) {
            const dist = calculateDistanceKm(zoneConfig.lat, zoneConfig.lng, i.latitude, i.longitude);
            return dist <= zoneConfig.radiusKm;
          }
          return false;
        });
      } else {
        list = list.filter((i) => i.zoneId === filters.zoneId);
      }
    }
    if (filters.severity) {
      list = list.filter((i) => i.severityLabel === filters.severity);
    }
    if (filters.type) {
      list = list.filter((i) => i.type === filters.type);
    }
    if (filters.status) {
      list = list.filter((i) => i.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.trackingCode.toLowerCase().includes(q)
      );
    }

    // Default sort: Critical first, then highest severity score, then newest
    return list.sort((a, b) => b.severityScore - a.severityScore);
  }

  getIncidentById(id: string): Incident | null {
    return db.incidents.get(id) || null;
  }

  operatorOverride(id: string, payload: OperatorOverridePayload): Incident {
    const incident = db.incidents.get(id);
    if (!incident) throw new Error(`Incident ${id} not found`);

    const previousValue = {
      type: incident.type,
      severityScore: incident.severityScore,
      severityLabel: incident.severityLabel,
      status: incident.status,
      needsSummary: incident.needsSummary
    };

    if (payload.type) incident.type = payload.type;
    if (payload.severityScore !== undefined) incident.severityScore = payload.severityScore;
    if (payload.severityLabel) incident.severityLabel = payload.severityLabel;
    if (payload.status) {
      incident.status = payload.status;
      if (payload.status === 'RESOLVED' && !incident.resolvedAt) {
        incident.resolvedAt = new Date().toISOString();
      }
    }
    if (payload.needsSummary) incident.needsSummary = payload.needsSummary;

    incident.version += 1;
    incident.updatedAt = new Date().toISOString();

    // Create Audit Log for Operator Override
    const auditLog: AuditLog = {
      id: `aud-${uuidv4().slice(0, 8)}`,
      entityType: 'INCIDENT',
      entityId: incident.id,
      action: 'OPERATOR_MANUAL_OVERRIDE',
      actorType: 'HUMAN_OPERATOR',
      actorId: payload.actorId || 'operator-default',
      actorName: payload.actorName || 'Control Room Operator',
      previousValue,
      newValue: {
        type: incident.type,
        severityScore: incident.severityScore,
        severityLabel: incident.severityLabel,
        status: incident.status,
        needsSummary: incident.needsSummary
      },
      overrideReason: payload.overrideReason,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(auditLog);

    realtimeHub.broadcast('INCIDENT_UPDATED', { incident, override: payload });
    realtimeHub.broadcast('AUDIT_LOG_RECORDED', { auditLog });

    return incident;
  }
}

export const incidentService = new IncidentService();
