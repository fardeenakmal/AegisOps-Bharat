export type ZoneLevel = 'city' | 'state' | 'national';
export type UserRole =
  | 'CITIZEN'
  | 'CONTROL_ROOM_OPERATOR'
  | 'RESCUE_RESPONDER'
  | 'HOSPITAL_ADMIN'
  | 'STATE_COMMANDER'
  | 'NATIONAL_COMMANDER'
  | 'SYSTEM_ADMIN';

export type IncidentType =
  | 'FLOOD'
  | 'FIRE'
  | 'EARTHQUAKE'
  | 'STRUCTURAL_COLLAPSE'
  | 'ROAD_ACCIDENT'
  | 'MEDICAL_EMERGENCY'
  | 'GAS_LEAK'
  | 'STORM_CYCLONE'
  | 'LANDSLIDE'
  | 'HAZMAT_SPILL'
  | 'OTHER';

export type SeverityLabel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'VERIFIED'
  | 'TRIAGED'
  | 'DISPATCHED'
  | 'ON_SCENE'
  | 'CONTAINED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED_SPAM';

export type ReportStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'MERGED_DUPLICATE'
  | 'SPAM_REJECTED'
  | 'ARCHIVED';

export type ResourceType =
  | 'AMBULANCE'
  | 'FIRE_TRUCK'
  | 'RESCUE_BOAT'
  | 'SAR_TEAM'
  | 'NDRF_BATTALION'
  | 'SDRF_QRT'
  | 'HAZMAT_CREW'
  | 'POLICE_UNIT'
  | 'RELIEF_SUPPLY_TRUCK'
  | 'AIR_AMBULANCE_HELICOPTER';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'ON_SCENE'
  | 'BUSY'
  | 'MAINTENANCE'
  | 'OFFLINE';

export type DispatchStatus =
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'RETURNING'
  | 'COMPLETED'
  | 'CANCELLED';

export type RiskType =
  | 'FLOOD_SPREAD'
  | 'WILDFIRE_PROPAGATION'
  | 'CYCLONE_LANDFALL'
  | 'LANDSLIDE_DEBRIS_FLOW'
  | 'AFTERSHOCK_RISK'
  | 'URBAN_INUNDATION'
  | 'HAZMAT_PLUME'
  | 'INFRASTRUCTURE_FAILURE';

export interface NeedsSummary {
  ambulances?: number;
  fireTrucks?: number;
  boats?: number;
  sarTeams?: number;
  policeUnits?: number;
  extricationJaws?: boolean;
  medicalKits?: number;
  foodWaterPacks?: number;
  temporaryShelters?: number;
  specialNotes?: string[];
}

export interface Report {
  id: string;
  trackingId: string;
  incidentId?: string | null;
  reporterName?: string;
  reporterContact?: string;
  rawText: string;
  normalizedText?: string;
  detectedLanguage: string;
  latitude: number;
  longitude: number;
  reportedAddress?: string;
  mediaUrls: string[];
  authenticityScore: number;
  isSpam: boolean;
  spamReason?: string;
  status: ReportStatus;
  aiFeatures?: {
    nlpExtraction?: any;
    visionAssessment?: any;
    perceptualHash?: string;
  };
  submissionChannel: string;
  submittedAt: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  trackingCode: string;
  title: string;
  type: IncidentType;
  severityScore: number;
  severityLabel: SeverityLabel;
  status: IncidentStatus;
  zoneId: string;
  latitude: number;
  longitude: number;
  address: string;
  landmarks: string[];
  estimatedCasualties: number;
  estimatedTrapped: number;
  needsSummary: NeedsSummary;
  modelConfidence: number;
  aiClassificationMetadata: Record<string, any>;
  reportCount: number;
  reports: Report[];
  slaTargetMinutes: number;
  dispatchedAt?: string;
  resolvedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  callSign: string;
  type: ResourceType;
  zoneId: string;
  status: ResourceStatus;
  latitude: number;
  longitude: number;
  heading: number;
  speedKmh: number;
  baseStationName: string;
  crewCount: number;
  equipmentSpecs: Record<string, any>;
  contactRadio: string;
  lastPingAt: string;
  distanceMeters?: number;
  etaMinutes?: number;
}

export interface Dispatch {
  id: string;
  incidentId: string;
  resourceId: string;
  assignedByUserId?: string;
  status: DispatchStatus;
  priority: number;
  taskBrief: string;
  equipmentChecklist: string[];
  estimatedArrivalMinutes?: number;
  assignedAt: string;
  enRouteAt?: string;
  onSceneAt?: string;
  completedAt?: string;
  responderNotes?: string;
  routeGeometry?: string;
  turnByTurnInstructions?: string[];
  roadDistanceMeters?: number;
  isReroutedForFlood?: boolean;
  hazardWarnings?: string[];
}

export interface Hospital {
  id: string;
  name: string;
  zoneId: string;
  latitude: number;
  longitude: number;
  address: string;
  contactPhone: string;
  totalBeds: number;
  availableBeds: number;
  totalIcuBeds: number;
  availableIcuBeds: number;
  traumaCenterLevel: number;
  burnUnitAvailable: boolean;
  bloodBankStatus: Record<string, string>;
  massCasualtyMode: boolean;
  inboundCasualtyForecast?: {
    expectedCount: number;
    severityMix: { critical: number; urgent: number; minor: number };
    etaMinutes: number;
  };
  lastReportedAt: string;
}

export interface PredictionAlert {
  id: string;
  zoneId: string;
  latitude?: number;
  longitude?: number;
  riskType: RiskType;
  riskScore: number;
  severityLabel: SeverityLabel;
  title: string;
  summary: string;
  predictedWindowStart: string;
  predictedWindowEnd: string;
  recommendedActions: string[];
  recommendedPrepositioning: {
    resourceType: ResourceType;
    targetStation: string;
    quantity: number;
  }[];
  confidence: number;
  weatherFactors?: Record<string, any>;
  isActive: boolean;
  generatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: 'AI_PIPELINE' | 'HUMAN_OPERATOR';
  actorId: string;
  actorName?: string;
  previousValue?: any;
  newValue?: any;
  overrideReason?: string;
  modelName?: string;
  modelVersion?: string;
  confidence?: number;
  timestamp: string;
}

export interface NaturalEvent {
  id: string;
  title: string;
  category: string;
  categoryTitle: string;
  latitude: number;
  longitude: number;
  date: string;
  link: string;
  magnitude?: number | null;
  magnitudeUnit?: string | null;
}

export interface GdacsAlert {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  eventType: string;
  alertLevel: 'Red' | 'Orange' | 'Green' | string;
  latitude: number;
  longitude: number;
  capUrl?: string;
}

export interface SeismicEvent {
  id: string;
  title: string;
  place: string;
  magnitude: number;
  depthKm: number;
  latitude: number;
  longitude: number;
  eventTime: string;
  tsunamiFlag: boolean;
}

export interface NationalRollup {
  nationalRiskIndex: number;
  totalActiveIncidents: number;
  criticalZonesCount: number;
  deployedFleetCount: number;
  states: {
    stateId: string;
    stateName: string;
    activeIncidents: number;
    severity: string;
    riskIndex: number;
  }[];
  crossJurisdictionRequests: any[];
}
