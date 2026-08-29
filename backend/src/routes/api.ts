import { Router, Request, Response } from 'express';
import { reportIngestionService } from '../services/reportIngestionService';
import { incidentService } from '../services/incidentService';
import { dispatchService } from '../services/dispatchService';
import { hospitalService } from '../services/hospitalService';
import { predictionService } from '../services/predictionService';
import { aggregationService } from '../services/aggregationService';
import { externalApiService } from '../services/externalApiService';
import { notificationService } from '../services/notificationService';
import { db } from '../db/memoryStore';
import { realtimeHub } from '../websocket/hub';

export const apiRouter = Router();

// ============================================================================
// 1. CITIZEN REPORTING ENDPOINTS
// ============================================================================

// POST /api/reports -> submit a citizen report
apiRouter.post('/reports', async (req: Request, res: Response) => {
  try {
    const {
      reporterName,
      reporterContact,
      rawText,
      latitude,
      longitude,
      reportedAddress,
      mediaUrls,
      submissionChannel,
      zoneId
    } = req.body;

    if (!rawText || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'rawText, latitude, and longitude are required fields' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    let address = reportedAddress;
    if (!address || address.trim() === '' || address.includes('Coordinates:')) {
      const geo = await externalApiService.reverseGeocode(lat, lon);
      address = geo.displayName;
    }

    const result = await reportIngestionService.submitReport({
      reporterName,
      reporterContact,
      rawText,
      latitude: lat,
      longitude: lon,
      reportedAddress: address,
      mediaUrls,
      submissionChannel,
      zoneId
    });

    return res.status(201).json({
      success: true,
      trackingId: result.report.trackingId,
      report: result.report,
      incident: result.incident,
      isDuplicate: result.isDuplicate,
      message: result.isDuplicate
        ? 'Report verified and linked to ongoing critical cluster.'
        : 'Report verified and new emergency incident created.'
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to submit report' });
  }
});

// GET /api/reports/:trackingId/status -> track status
apiRouter.get('/reports/:trackingId/status', (req: Request, res: Response) => {
  const trackingId = String(req.params.trackingId);
  const report = reportIngestionService.getReportStatus(trackingId);
  if (!report) {
    return res.status(404).json({ error: 'Report tracking ID not found' });
  }

  let incident = null;
  if (report.incidentId) {
    incident = incidentService.getIncidentById(report.incidentId);
  }

  return res.json({
    report,
    incidentStatus: incident ? incident.status : 'PENDING_TRIAGE',
    incidentTitle: incident ? incident.title : undefined,
    severityLabel: incident ? incident.severityLabel : undefined,
    etaMinutes: incident?.dispatchedAt ? 8 : undefined
  });
});

// ============================================================================
// 2. INCIDENT OPERATIONS ENDPOINTS
// ============================================================================

// GET /api/incidents -> dashboard incident feed
apiRouter.get('/incidents', (req: Request, res: Response) => {
  const { zone, severity, type, status, search } = req.query;
  const incidents = incidentService.getIncidents({
    zoneId: zone as string,
    severity: severity as any,
    type: type as any,
    status: status as any,
    search: search as string
  });
  return res.json(incidents);
});

// GET /api/incidents/:id -> full incident detail
apiRouter.get('/incidents/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const incident = incidentService.getIncidentById(id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  return res.json(incident);
});

// PATCH /api/incidents/:id -> operator override
apiRouter.patch('/incidents/:id', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { actorId, actorName, type, severityScore, severityLabel, status, needsSummary, overrideReason } = req.body;
    if (!overrideReason) {
      return res.status(400).json({ error: 'An overrideReason is required for model feedback & audit integrity' });
    }

    const updated = incidentService.operatorOverride(id, {
      actorId,
      actorName,
      type,
      severityScore: severityScore !== undefined ? parseFloat(severityScore) : undefined,
      severityLabel,
      status,
      needsSummary,
      overrideReason
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// 3. DISPATCH & RESOURCE ENDPOINTS
// ============================================================================

// GET /api/resources -> list emergency fleet units
apiRouter.get('/resources', (req: Request, res: Response) => {
  const { zone, type, status } = req.query;
  let list = Array.from(db.resources.values());
  if (zone && zone !== 'zone-ndma-in' && zone !== 'ALL') list = list.filter((r) => r.zoneId === zone);
  if (type) list = list.filter((r) => r.type === type);
  if (status) list = list.filter((r) => r.status === status);
  return res.json(list);
});

// GET /api/resources/suggested/:incidentId -> rank nearest units
apiRouter.get('/resources/suggested/:incidentId', (req: Request, res: Response) => {
  const incidentId = String(req.params.incidentId);
  const suggested = dispatchService.getSuggestedResourcesForIncident(incidentId);
  return res.json(suggested);
});

// POST /api/incidents/:id/dispatch -> dispatch resource to incident
apiRouter.post('/incidents/:id/dispatch', async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
    const { resourceId, assignedByUserId, customTaskBrief } = req.body;
    if (!resourceId) {
      return res.status(400).json({ error: 'resourceId is required' });
    }

    const result = dispatchService.dispatchResource({
      incidentId,
      resourceId,
      assignedByUserId,
      customTaskBrief
    });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Dispatch failed' });
  }
});

// PATCH /api/resources/:id/status -> responder updates status
apiRouter.patch('/resources/:id/status', (req: Request, res: Response) => {
  try {
    const resourceId = String(req.params.id);
    const { status, dispatchId, notes, photos } = req.body;
    const resource = db.resources.get(resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    if (dispatchId) {
      dispatchService.updateDispatchStatus(dispatchId, status, notes, photos);
    } else {
      resource.status = status;
      resource.lastPingAt = new Date().toISOString();
      realtimeHub.broadcast('RESOURCE_STATUS_CHANGED', { resource });
    }
    return res.json(resource);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Status update failed' });
  }
});

// ============================================================================
// 4. HOSPITAL & MEDICAL SURGE ENDPOINTS
// ============================================================================

// GET /api/hospitals -> all hospitals
apiRouter.get('/hospitals', (req: Request, res: Response) => {
  const { zone } = req.query;
  const list = hospitalService.getAllHospitals(zone && zone !== 'zone-ndma-in' ? (zone as string) : undefined);
  return res.json(list);
});

// GET /api/hospitals/:id/capacity -> capacity + inbound forecast
apiRouter.get('/hospitals/:id/capacity', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const hospital = hospitalService.getHospitalById(id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  hospitalService.calculateInboundForecast(hospital.id);
  return res.json(hospital);
});

// POST /api/hospitals/:id/capacity -> hospital self-reports capacity
apiRouter.post('/hospitals/:id/capacity', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = hospitalService.updateCapacity(id, req.body);
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// 5. PREDICTION & AGGREGATION ENDPOINTS
// ============================================================================

// GET /api/predictions -> at-risk zone forecast
apiRouter.get('/predictions', (req: Request, res: Response) => {
  const { zone } = req.query;
  const alerts = predictionService.getActiveAlerts(zone as string);
  return res.json(alerts);
});

// POST /api/predictions/simulate -> trigger spatiotemporal simulation
apiRouter.post('/predictions/simulate', async (req: Request, res: Response) => {
  try {
    const alert = await predictionService.simulateHazardSpread(req.body);
    return res.status(201).json(alert);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// GET /api/aggregation/state/:id -> state-level rollup
apiRouter.get('/aggregation/state/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const rollup = aggregationService.getStateRollup(id);
  return res.json(rollup);
});

// GET /api/aggregation/national -> national-level rollup
apiRouter.get('/aggregation/national', (req: Request, res: Response) => {
  const rollup = aggregationService.getNationalRollup();
  return res.json(rollup);
});

// POST /api/aggregation/cross-request -> request resource sharing between cities
apiRouter.post('/aggregation/cross-request', (req: Request, res: Response) => {
  try {
    const { fromZoneId, toZoneId, resourceType, quantityRequested, urgencyReason } = req.body;
    const reqObj = aggregationService.createCrossJurisdictionRequest(
      fromZoneId,
      toZoneId,
      resourceType,
      parseInt(quantityRequested, 10),
      urgencyReason
    );
    return res.status(201).json(reqObj);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/aggregation/cross-request/:id/approve -> approve request
apiRouter.patch('/aggregation/cross-request/:id/approve', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const approved = aggregationService.approveCrossJurisdictionRequest(id);
    return res.json(approved);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// POST /api/alerts/broadcast -> public CAP alert broadcast
apiRouter.post('/alerts/broadcast', (req: Request, res: Response) => {
  const { zoneId, headline, description, severity, instruction } = req.body;
  const broadcastPayload = {
    capIdentifier: `CAP-2026-${Date.now()}`,
    sender: 'STATE_EMERGENCY_MGMT_AUTHORITY',
    sent: new Date().toISOString(),
    status: 'Actual',
    msgType: 'Alert',
    scope: 'Public',
    info: {
      category: 'Safety',
      event: headline || 'Emergency Evacuation Warning',
      urgency: 'Immediate',
      severity: severity || 'Extreme',
      headline,
      description,
      instruction: instruction || 'Seek higher ground immediately. Do not attempt to cross flooded roadways.',
      area: { zoneId: zoneId || 'zone-city-1' }
    }
  };

  realtimeHub.broadcast('PUBLIC_BROADCAST', broadcastPayload);
  return res.status(200).json({ success: true, broadcast: broadcastPayload });
});

// POST /api/alerts/sms -> send live SMS alert via Twilio
apiRouter.post('/alerts/sms', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'to and message are required' });
    }
    const result = await notificationService.sendEmergencySms(to, message);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/twilio-status -> check Twilio configuration status
apiRouter.get('/alerts/twilio-status', (req: Request, res: Response) => {
  return res.json({
    configured: notificationService.isTwilioConfigured(),
    accountSid: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 6)}...` : null,
    fromNumber: process.env.TWILIO_PHONE_NUMBER || null
  });
});

// GET /api/audit-logs -> full audit trail
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  return res.json(db.auditLogs);
});

// ============================================================================
// 6. REAL-TIME EXTERNAL TELEMETRY & FEEDS ENDPOINTS
// ============================================================================

// GET /api/external/weather -> live Open-Meteo weather telemetry
apiRouter.get('/external/weather', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 19.0760;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 72.8777;
    const weather = await externalApiService.getLiveWeather(lat, lon);
    return res.json(weather);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch weather' });
  }
});

// GET /api/external/geocode -> reverse geocode coordinates to real address
apiRouter.get('/external/geocode', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon query params required' });
    }
    const geocoded = await externalApiService.reverseGeocode(lat, lon);
    return res.json(geocoded);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to geocode coordinates' });
  }
});

// GET /api/external/search -> forward search location query
apiRouter.get('/external/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'q query parameter required' });
    }
    const results = await externalApiService.searchLocation(query);
    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to search location' });
  }
});

// POST /api/external/sync -> trigger on-demand sync of USGS & Open-Meteo feeds
apiRouter.post('/external/sync', async (req: Request, res: Response) => {
  try {
    const result = await externalApiService.syncRealWorldData();
    return res.json({
      success: true,
      message: `Synchronized ${result.syncedEarthquakes} USGS live seismic events and refreshed meteorological feeds.`,
      result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to sync feeds' });
  }
});

// GET /api/external/feeds -> status of external telemetry feeds
apiRouter.get('/external/feeds', (req: Request, res: Response) => {
  return res.json({
    lastSyncTime: externalApiService.lastSyncTime,
    stats: externalApiService.syncedFeedStats,
    supportedSources: [
      { name: 'USGS Real-Time Earthquake Hazards Program', status: 'ACTIVE', type: 'SEISMIC_API' },
      { name: 'Open-Meteo Live Atmospheric Forecast & Radar', status: 'ACTIVE', type: 'METEOROLOGICAL_API' },
      { name: 'Open-Meteo Global Flood & Hydrology Radar', status: 'ACTIVE', type: 'HYDROLOGICAL_API' },
      { name: 'OpenStreetMap Nominatim Geocoding Services', status: 'ACTIVE', type: 'GEOCODING_API' }
    ]
  });
});
