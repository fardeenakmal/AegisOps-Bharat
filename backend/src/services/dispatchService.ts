import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { Resource, Dispatch, DispatchStatus, ResourceType, ResourceStatus } from '../types';
import { dedupClusterService } from './ai/dedupClusterService';
import { realtimeHub } from '../websocket/hub';

export interface DispatchRequest {
  incidentId: string;
  resourceId: string;
  assignedByUserId?: string;
  customTaskBrief?: string;
}

export interface ResourceFilter {
  zoneId?: string;
  type?: ResourceType;
  status?: ResourceStatus;
}

export class DispatchService {
  getResources(filters: ResourceFilter = {}): Resource[] {
    let list = Array.from(db.resources.values());
    if (filters.zoneId) list = list.filter((r) => r.zoneId === filters.zoneId);
    if (filters.type) list = list.filter((r) => r.type === filters.type);
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    return list;
  }

  getSuggestedResourcesForIncident(incidentId: string): (Resource & { distanceMeters: number; etaMinutes: number })[] {
    const incident = db.incidents.get(incidentId);
    if (!incident) return [];

    const available = Array.from(db.resources.values()).filter((r) => r.status === 'AVAILABLE');

    return available
      .map((res) => {
        const dist = dedupClusterService.haversineDistanceMeters(
          res.latitude,
          res.longitude,
          incident.latitude,
          incident.longitude
        );
        // Estimate ETA assuming average urban emergency vehicle speed of 40 km/h (667 meters/min)
        const eta = Math.max(2, Math.round(dist / 667) + 2);
        return {
          ...res,
          distanceMeters: Math.round(dist),
          etaMinutes: eta
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  dispatchResource(req: DispatchRequest): { dispatch: Dispatch; resource: Resource } {
    const incident = db.incidents.get(req.incidentId);
    if (!incident) throw new Error(`Incident ${req.incidentId} not found`);

    const resource = db.resources.get(req.resourceId);
    if (!resource) throw new Error(`Resource ${req.resourceId} not found`);

    const distance = dedupClusterService.haversineDistanceMeters(
      resource.latitude,
      resource.longitude,
      incident.latitude,
      incident.longitude
    );
    const etaMinutes = Math.max(2, Math.round(distance / 667) + 2);

    const checklist: string[] = ['Check vehicle fuel & life support power', 'Establish comms on assigned radio channel'];
    if (incident.type === 'FIRE') checklist.push('Deploy thermal imaging drone', 'Connect auxiliary foam lines');
    if (incident.type === 'FLOOD') checklist.push('Inspect inflatable life-rafts', 'Prepare water immersion stretchers');
    if (incident.type === 'STRUCTURAL_COLLAPSE') checklist.push('Calibrate acoustic sensor', 'Ready hydraulic extrication jaws');

    const taskBrief =
      req.customTaskBrief ||
      `PRIORITY DISPATCH to ${incident.address}. Incident Type: ${incident.type}. Est. Casualties: ${incident.estimatedCasualties}, Trapped: ${incident.estimatedTrapped}. Special instructions: ${incident.needsSummary.specialNotes?.join('; ') || 'Standard rapid tactical response'}.`;

    const dispatchId = `dsp-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const dispatch: Dispatch = {
      id: dispatchId,
      incidentId: incident.id,
      resourceId: resource.id,
      assignedByUserId: req.assignedByUserId || 'usr-op-1',
      status: 'ASSIGNED',
      priority: incident.severityLabel === 'CRITICAL' ? 1 : 2,
      taskBrief,
      equipmentChecklist: checklist,
      estimatedArrivalMinutes: etaMinutes,
      assignedAt: now
    };

    db.dispatches.set(dispatch.id, dispatch);

    // Update Resource & Incident statuses
    resource.status = 'DISPATCHED';
    resource.lastPingAt = now;

    if (incident.status === 'REPORTED' || incident.status === 'TRIAGED') {
      incident.status = 'DISPATCHED';
      incident.dispatchedAt = now;
      incident.updatedAt = now;
    }

    realtimeHub.broadcast('DISPATCH_CREATED', { dispatch, resource, incident });
    realtimeHub.broadcast('RESOURCE_STATUS_CHANGED', { resource });
    realtimeHub.broadcast('INCIDENT_UPDATED', { incident });

    return { dispatch, resource };
  }

  updateDispatchStatus(
    dispatchId: string,
    status: DispatchStatus,
    notes?: string,
    photos?: string[]
  ): Dispatch {
    const dispatch = db.dispatches.get(dispatchId);
    if (!dispatch) throw new Error(`Dispatch ${dispatchId} not found`);

    const now = new Date().toISOString();
    dispatch.status = status;
    if (notes) dispatch.responderNotes = notes;

    const resource = db.resources.get(dispatch.resourceId);
    const incident = db.incidents.get(dispatch.incidentId);

    if (status === 'EN_ROUTE') {
      dispatch.enRouteAt = now;
      if (resource) resource.status = 'DISPATCHED';
    } else if (status === 'ON_SCENE') {
      dispatch.onSceneAt = now;
      if (resource) resource.status = 'ON_SCENE';
      if (incident && incident.status === 'DISPATCHED') incident.status = 'ON_SCENE';
    } else if (status === 'COMPLETED') {
      dispatch.completedAt = now;
      if (resource) resource.status = 'AVAILABLE';
      if (incident) {
        incident.status = 'CONTAINED';
        incident.updatedAt = now;
      }
    }

    if (resource) resource.lastPingAt = now;

    realtimeHub.broadcast('DISPATCH_UPDATED', { dispatch });
    if (resource) realtimeHub.broadcast('RESOURCE_STATUS_CHANGED', { resource });
    if (incident) realtimeHub.broadcast('INCIDENT_UPDATED', { incident });

    return dispatch;
  }
}

export const dispatchService = new DispatchService();
