import { db } from '../db/memoryStore';
import { Hospital } from '../types';
import { realtimeHub } from '../websocket/hub';

export interface UpdateHospitalCapacityPayload {
  availableBeds?: number;
  availableIcuBeds?: number;
  massCasualtyMode?: boolean;
  bloodBankStatus?: Record<string, string>;
}

export class HospitalService {
  getAllHospitals(zoneId?: string): Hospital[] {
    let list = Array.from(db.hospitals.values());
    if (zoneId) list = list.filter((h) => h.zoneId === zoneId);
    return list;
  }

  getHospitalById(id: string): Hospital | null {
    return db.hospitals.get(id) || null;
  }

  updateCapacity(id: string, payload: UpdateHospitalCapacityPayload): Hospital {
    const hospital = db.hospitals.get(id);
    if (!hospital) throw new Error(`Hospital ${id} not found`);

    if (payload.availableBeds !== undefined) hospital.availableBeds = payload.availableBeds;
    if (payload.availableIcuBeds !== undefined) hospital.availableIcuBeds = payload.availableIcuBeds;
    if (payload.massCasualtyMode !== undefined) hospital.massCasualtyMode = payload.massCasualtyMode;
    if (payload.bloodBankStatus) hospital.bloodBankStatus = payload.bloodBankStatus;

    hospital.lastReportedAt = new Date().toISOString();
    db.hospitals.set(hospital.id, hospital);

    realtimeHub.broadcast('HOSPITAL_CAPACITY_UPDATED', { hospital });
    return hospital;
  }

  calculateInboundForecast(hospitalId: string) {
    const hospital = db.hospitals.get(hospitalId);
    if (!hospital) return null;

    // Calculate sum of casualties from all active incidents in hospital zone
    const activeIncidents = Array.from(db.incidents.values()).filter(
      (i) => i.zoneId === hospital.zoneId && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    );

    let totalCasualties = 0;
    activeIncidents.forEach((inc) => {
      totalCasualties += inc.estimatedCasualties;
    });

    const critical = Math.round(totalCasualties * 0.3);
    const urgent = Math.round(totalCasualties * 0.5);
    const minor = Math.max(0, totalCasualties - critical - urgent);

    hospital.inboundCasualtyForecast = {
      expectedCount: totalCasualties,
      severityMix: { critical, urgent, minor },
      etaMinutes: totalCasualties > 0 ? 15 : 0
    };

    return hospital.inboundCasualtyForecast;
  }
}

export const hospitalService = new HospitalService();
