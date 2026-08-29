import {
  Zone,
  User,
  Incident,
  Report,
  Resource,
  Dispatch,
  Hospital,
  PredictionAlert,
  AuditLog
} from '../types';

export class MemoryStore {
  public zones: Map<string, Zone> = new Map();
  public users: Map<string, User> = new Map();
  public incidents: Map<string, Incident> = new Map();
  public reports: Map<string, Report> = new Map();
  public resources: Map<string, Resource> = new Map();
  public dispatches: Map<string, Dispatch> = new Map();
  public hospitals: Map<string, Hospital> = new Map();
  public predictionAlerts: Map<string, PredictionAlert> = new Map();
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Official Administrative Command Zones
    const zones: Zone[] = [
      {
        id: 'zone-ndma-in',
        name: 'National Disaster Management Authority (NDMA)',
        level: 'national',
        code: 'NDMA-HQ',
        latitude: 28.6139,
        longitude: 77.2090,
        population: 1428627663
      },
      {
        id: 'zone-mh-mum',
        name: 'BMC Disaster Management Cell (Mumbai Metro)',
        level: 'city',
        parentZoneId: 'zone-ndma-in',
        code: 'BMC-MUM-01',
        latitude: 19.0760,
        longitude: 72.8777,
        population: 21000000
      },
      {
        id: 'zone-dl-ncr',
        name: 'Delhi Disaster Management Authority (DDMA)',
        level: 'city',
        parentZoneId: 'zone-ndma-in',
        code: 'DDMA-DEL-02',
        latitude: 28.6139,
        longitude: 77.2090,
        population: 33000000
      },
      {
        id: 'zone-ka-blr',
        name: 'BBMP Disaster War Room (Bengaluru Urban)',
        level: 'city',
        parentZoneId: 'zone-ndma-in',
        code: 'BBMP-BLR-03',
        latitude: 12.9716,
        longitude: 77.5946,
        population: 13600000
      },
      {
        id: 'zone-tn-chn',
        name: 'Greater Chennai Corporation (GCC) Disaster Cell',
        level: 'city',
        parentZoneId: 'zone-ndma-in',
        code: 'GCC-CHN-04',
        latitude: 13.0827,
        longitude: 80.2707,
        population: 11500000
      },
      {
        id: 'zone-od-bbs',
        name: 'Odisha State Disaster Management Authority (OSDMA Coastal Command)',
        level: 'state',
        parentZoneId: 'zone-ndma-in',
        code: 'OSDMA-OD-05',
        latitude: 20.2961,
        longitude: 85.8245,
        population: 47000000
      },
      {
        id: 'zone-wb-kol',
        name: 'Kolkata Municipal Corporation (KMC) Emergency Cell',
        level: 'city',
        parentZoneId: 'zone-ndma-in',
        code: 'KMC-KOL-06',
        latitude: 22.5726,
        longitude: 88.3639,
        population: 15000000
      }
    ];
    zones.forEach((z) => this.zones.set(z.id, z));

    // 2. Command Personnel & Responders
    // 2. Administrators & Operational Personnel
    const users: User[] = [
      {
        id: 'usr-admin-fardeen',
        username: 'fardeenakmal',
        email: 'fardeenakmal123@gmail.com',
        fullName: 'Fardeen Akmal',
        role: 'NATIONAL_COMMANDER',
        zoneId: 'zone-ndma-in',
        phoneNumber: '+91-98765-43210'
      }
    ];
    users.forEach((u) => this.users.set(u.id, u));

    // 3. Real Hospitals & Level-1 Trauma Centers
    const hospitals: Hospital[] = [
      {
        id: 'hosp-kem-mum',
        name: 'KEM Hospital & Seth GS Medical College, Mumbai',
        zoneId: 'zone-mh-mum',
        latitude: 19.0028,
        longitude: 72.8428,
        address: 'Acharya Donde Marg, Parel, Mumbai - 400012',
        contactPhone: '+91-22-2410-7000',
        totalBeds: 1800,
        availableBeds: 245,
        totalIcuBeds: 180,
        availableIcuBeds: 32,
        traumaCenterLevel: 1,
        burnUnitAvailable: true,
        bloodBankStatus: { O_POS: 'OPTIMAL', O_NEG: 'LOW', A_POS: 'OPTIMAL', B_POS: 'OPTIMAL' },
        massCasualtyMode: false,
        inboundCasualtyForecast: { expectedCount: 0, severityMix: { critical: 0, urgent: 0, minor: 0 }, etaMinutes: 0 },
        lastReportedAt: new Date().toISOString()
      },
      {
        id: 'hosp-aiims-del',
        name: 'JPN Apex Trauma Center, AIIMS New Delhi',
        zoneId: 'zone-dl-ncr',
        latitude: 28.5672,
        longitude: 77.2060,
        address: 'Ring Road, Safdarjung Enclave, New Delhi - 110029',
        contactPhone: '+91-11-2616-9000',
        totalBeds: 650,
        availableBeds: 112,
        totalIcuBeds: 120,
        availableIcuBeds: 24,
        traumaCenterLevel: 1,
        burnUnitAvailable: true,
        bloodBankStatus: { O_POS: 'OPTIMAL', O_NEG: 'OPTIMAL', A_POS: 'OPTIMAL', B_POS: 'OPTIMAL' },
        massCasualtyMode: false,
        inboundCasualtyForecast: { expectedCount: 0, severityMix: { critical: 0, urgent: 0, minor: 0 }, etaMinutes: 0 },
        lastReportedAt: new Date().toISOString()
      },
      {
        id: 'hosp-vic-blr',
        name: 'Victoria Hospital Trauma Center, Bengaluru',
        zoneId: 'zone-ka-blr',
        latitude: 12.9634,
        longitude: 77.5753,
        address: 'Fort Road, Near City Market, Bengaluru - 560002',
        contactPhone: '+91-80-2670-1150',
        totalBeds: 950,
        availableBeds: 140,
        totalIcuBeds: 90,
        availableIcuBeds: 18,
        traumaCenterLevel: 1,
        burnUnitAvailable: true,
        bloodBankStatus: { O_POS: 'OPTIMAL', O_NEG: 'OPTIMAL', A_POS: 'LOW', B_POS: 'OPTIMAL' },
        massCasualtyMode: false,
        inboundCasualtyForecast: { expectedCount: 0, severityMix: { critical: 0, urgent: 0, minor: 0 }, etaMinutes: 0 },
        lastReportedAt: new Date().toISOString()
      },
      {
        id: 'hosp-rgggh-chn',
        name: 'Rajiv Gandhi Govt General Hospital (RGGGH), Chennai',
        zoneId: 'zone-tn-chn',
        latitude: 13.0818,
        longitude: 80.2785,
        address: 'EVR Periyar Salai, Park Town, Chennai - 600003',
        contactPhone: '+91-44-2530-5000',
        totalBeds: 2200,
        availableBeds: 310,
        totalIcuBeds: 210,
        availableIcuBeds: 45,
        traumaCenterLevel: 1,
        burnUnitAvailable: true,
        bloodBankStatus: { O_POS: 'OPTIMAL', O_NEG: 'OPTIMAL', A_POS: 'OPTIMAL', B_POS: 'OPTIMAL' },
        massCasualtyMode: false,
        inboundCasualtyForecast: { expectedCount: 0, severityMix: { critical: 0, urgent: 0, minor: 0 }, etaMinutes: 0 },
        lastReportedAt: new Date().toISOString()
      }
    ];
    hospitals.forEach((h) => this.hospitals.set(h.id, h));

    // 4. Emergency Fleet Readiness (NDRF, 108 EMRI, Fire, Water Rescue)
    const resources: Resource[] = [
      {
        id: 'res-ndrf-5bn',
        callSign: '5TH BN NDRF (QRT-ALPHA)',
        type: 'NDRF_BATTALION',
        zoneId: 'zone-mh-mum',
        status: 'AVAILABLE',
        latitude: 19.0720,
        longitude: 72.8680,
        heading: 180,
        speedKmh: 0,
        baseStationName: 'NDRF Base Sudumbare / Mumbai Outpost',
        crewCount: 18,
        equipmentSpecs: { collapseRescueRadar: true, inflatableBoats: 4, cuttingTools: true },
        contactRadio: 'NDRF-TAC-51',
        lastPingAt: new Date().toISOString()
      },
      {
        id: 'res-108-als',
        callSign: 'GVK-108 ADVANCED LIFE SUPPORT (ALS-09)',
        type: 'AMBULANCE',
        zoneId: 'zone-mh-mum',
        status: 'AVAILABLE',
        latitude: 19.0100,
        longitude: 72.8450,
        heading: 90,
        speedKmh: 0,
        baseStationName: 'Parel Trauma Emergency Station',
        crewCount: 3,
        equipmentSpecs: { ventilators: 2, defibrillator: true, suctionApparatus: true },
        contactRadio: '108-EMRI-NET-1',
        lastPingAt: new Date().toISOString()
      },
      {
        id: 'res-boat-sdrf',
        callSign: 'SDRF FLOOD RESCUE CRAFT (MAHA-04)',
        type: 'RESCUE_BOAT',
        zoneId: 'zone-mh-mum',
        status: 'AVAILABLE',
        latitude: 19.0650,
        longitude: 72.8850,
        heading: 320,
        speedKmh: 0,
        baseStationName: 'Mithi River Basin Outpost, Kurla',
        crewCount: 4,
        equipmentSpecs: { geminiInflatableBoats: 2, lifeJackets: 40, underwaterCameras: true },
        contactRadio: 'SDRF-TAC-03',
        lastPingAt: new Date().toISOString()
      },
      {
        id: 'res-ndrf-8bn',
        callSign: '8TH BN NDRF (DELHI NCR COMMAND)',
        type: 'NDRF_BATTALION',
        zoneId: 'zone-dl-ncr',
        status: 'AVAILABLE',
        latitude: 28.6500,
        longitude: 77.3400,
        heading: 0,
        speedKmh: 0,
        baseStationName: 'NDRF Base, Ghaziabad / Delhi Border',
        crewCount: 22,
        equipmentSpecs: { collapseRescueRadar: true, snifferCanines: 4, pneumaticLiftingBags: true },
        contactRadio: 'NDRF-NCR-PRIMARY',
        lastPingAt: new Date().toISOString()
      },
      {
        id: 'res-dfs-foam',
        callSign: 'DELHI FIRE SERVICE (HEAVY FOAM TENDER)',
        type: 'FIRE_TRUCK',
        zoneId: 'zone-dl-ncr',
        status: 'AVAILABLE',
        latitude: 28.6300,
        longitude: 77.2200,
        heading: 45,
        speedKmh: 0,
        baseStationName: 'Connaught Circus Fire Station',
        crewCount: 5,
        equipmentSpecs: { foamCompoundLitres: 5000, waterMonitorGPM: 2500 },
        contactRadio: 'DFS-CONTROL-101',
        lastPingAt: new Date().toISOString()
      }
    ];
    resources.forEach((r) => this.resources.set(r.id, r));

    // NOTE: All incidents and prediction alerts will be populated EXCLUSIVELY
    // from authoritative live external APIs (USGS Earthquakes, Open-Meteo Weather Radar)
    // and genuine verified citizen reports. No fake or mock incidents are seeded.
  }
}

export const db = new MemoryStore();
