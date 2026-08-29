import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { ResourceType } from '../types';
import { realtimeHub } from '../websocket/hub';

export interface CrossJurisdictionRequest {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  resourceType: ResourceType;
  quantityRequested: number;
  urgencyReason: string;
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED';
  requestedAt: string;
  approvedAt?: string;
}

export class AggregationService {
  private crossRequests: Map<string, CrossJurisdictionRequest> = new Map();

  constructor() {
    // Seed authentic NDRF inter-state deployment request
    const initReq: CrossJurisdictionRequest = {
      id: 'cr-ind-101',
      fromZoneId: 'zone-mh-mum',
      toZoneId: 'zone-ka-blr',
      resourceType: 'NDRF_BATTALION',
      quantityRequested: 2,
      urgencyReason: 'Mithi River Basin cloudburst exceeds Mumbai regional NDRF reserve capacity. Inter-state reinforcement requested.',
      status: 'APPROVED',
      requestedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      approvedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    };
    this.crossRequests.set(initReq.id, initReq);
  }

  getStateRollup(stateZoneId: string = 'zone-mh-mum') {
    const targetZone = db.zones.get(stateZoneId);
    const childCities = Array.from(db.zones.values()).filter(
      (z) => z.parentZoneId === stateZoneId || z.id === stateZoneId || z.level === 'city'
    );
    const cityIds = new Set(childCities.map((c) => c.id));

    const incidents = Array.from(db.incidents.values()).filter((i) => cityIds.has(i.zoneId));
    const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
    const criticalIncidents = activeIncidents.filter((i) => i.severityLabel === 'CRITICAL');

    const resources = Array.from(db.resources.values()).filter((r) => cityIds.has(r.zoneId));
    const availableResources = resources.filter((r) => r.status === 'AVAILABLE');

    const hospitals = Array.from(db.hospitals.values()).filter((h) => cityIds.has(h.zoneId));
    const totalBeds = hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
    const availableBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);
    const totalIcu = hospitals.reduce((acc, h) => acc + h.totalIcuBeds, 0);
    const availableIcu = hospitals.reduce((acc, h) => acc + h.availableIcuBeds, 0);

    const activePredictions = Array.from(db.predictionAlerts.values()).filter((p) => p.isActive);

    return {
      stateZoneId,
      stateName: targetZone?.name || 'State Disaster Management Authority (SDMA)',
      childCities: childCities.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        population: c.population,
        activeIncidentCount: activeIncidents.filter((i) => i.zoneId === c.id).length
      })),
      metrics: {
        totalIncidents: incidents.length,
        activeIncidents: activeIncidents.length,
        criticalIncidents: criticalIncidents.length,
        totalCasualtiesReported: activeIncidents.reduce((acc, i) => acc + i.estimatedCasualties, 0),
        totalTrappedReported: activeIncidents.reduce((acc, i) => acc + i.estimatedTrapped, 0),
        resourceReadiness: {
          total: resources.length,
          available: availableResources.length,
          dispatched: resources.filter((r) => r.status === 'DISPATCHED' || r.status === 'ON_SCENE').length
        },
        hospitalCapacity: {
          totalBeds,
          availableBeds,
          bedOccupancyRate: totalBeds > 0 ? parseFloat((((totalBeds - availableBeds) / totalBeds) * 100).toFixed(1)) : 0,
          totalIcu,
          availableIcu,
          icuOccupancyRate: totalIcu > 0 ? parseFloat((((totalIcu - availableIcu) / totalIcu) * 100).toFixed(1)) : 0
        },
        activeThreatAlerts: activePredictions.length
      },
      crossJurisdictionRequests: Array.from(this.crossRequests.values())
    };
  }

  getNationalRollup() {
    const states = Array.from(db.zones.values()).filter((z) => z.level === 'city' || z.level === 'state');
    const allIncidents = Array.from(db.incidents.values());
    const active = allIncidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED');

    return {
      nationalCenter: 'National Disaster Management Authority (NDMA HQ, New Delhi)',
      totalPopulationCovered: 1428627663,
      totalStatesCovered: 28,
      totalUnionTerritories: 8,
      nationalActiveIncidents: active.length,
      nationalCriticalIncidents: active.filter((i) => i.severityLabel === 'CRITICAL').length,
      ndrfBattalionsTotal: 16,
      stateRollups: states.map((s) => this.getStateRollup(s.id))
    };
  }

  createCrossJurisdictionRequest(
    fromZoneId: string,
    toZoneId: string,
    resourceType: ResourceType,
    quantityRequested: number,
    urgencyReason: string
  ): CrossJurisdictionRequest {
    const req: CrossJurisdictionRequest = {
      id: `cr-ind-${uuidv4().slice(0, 8)}`,
      fromZoneId,
      toZoneId,
      resourceType,
      quantityRequested,
      urgencyReason,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };
    this.crossRequests.set(req.id, req);
    realtimeHub.broadcast('PUBLIC_BROADCAST', { type: 'CROSS_JURISDICTION_REQUEST_SUBMITTED', request: req });
    return req;
  }

  approveCrossJurisdictionRequest(id: string): CrossJurisdictionRequest {
    const req = this.crossRequests.get(id);
    if (!req) throw new Error(`Request ${id} not found`);
    req.status = 'APPROVED';
    req.approvedAt = new Date().toISOString();
    realtimeHub.broadcast('PUBLIC_BROADCAST', { type: 'CROSS_JURISDICTION_REQUEST_APPROVED', request: req });
    return req;
  }
}

export const aggregationService = new AggregationService();
