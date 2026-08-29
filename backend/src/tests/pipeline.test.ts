import test from 'node:test';
import assert from 'node:assert';
import { nlpService } from '../services/ai/nlpService';
import { severityFusionService } from '../services/ai/severityFusionService';
import { dedupClusterService } from '../services/ai/dedupClusterService';
import { reportIngestionService } from '../services/reportIngestionService';
import { incidentService } from '../services/incidentService';

test('Indian Multilingual NLP extracts Hinglish flood report, trapped count, and NDRF needs', async () => {
  const result = await nlpService.processReport(
    'Mithi river me paani bohot bhar gaya hai, 8 log bus me trapped hain, jaldi bachao!',
    'Kurla West Station Crossing'
  );
  assert.strictEqual(result.incidentType, 'FLOOD');
  assert.strictEqual(result.detectedLanguage, 'hi');
  assert.strictEqual(result.estimatedTrapped, 8);
  assert.ok(result.needs.boats !== undefined && result.needs.boats >= 2);
  assert.strictEqual(result.severitySignal, 'CRITICAL');
});

test('Severity Fusion calculates critical score for high casualties and multi-report corroboration', () => {
  const scoreResult = severityFusionService.calculateSeverity({
    incidentType: 'FIRE',
    reportCount: 3,
    estimatedCasualties: 6,
    estimatedTrapped: 12,
    casualtyIndicators: ['burns', 'trapped_individuals']
  });
  assert.strictEqual(scoreResult.severityLabel, 'CRITICAL');
  assert.ok(scoreResult.severityScore > 80);
});

test('Dedup Cluster matches report within nearby coordinates', async () => {
  const init = await reportIngestionService.submitReport({
    rawText: 'Mithi River overflowing near Kurla CST road, 6 trapped.',
    latitude: 19.0680,
    longitude: 72.8790,
    reportedAddress: 'Kurla Railway Subway & CST Road, Mumbai',
    submissionChannel: 'MOBILE_PWA',
    zoneId: 'zone-mh-mum'
  });

  const existing = incidentService.getIncidents();
  assert.ok(existing.length > 0);

  const testReport = {
    id: 'rep-test-kurla-2',
    trackingId: 'TRK-TEST-IND-2',
    rawText: 'Water level rising above 5ft at Kurla CST road, urgent rescue boats needed.',
    detectedLanguage: 'en',
    latitude: 19.0682,
    longitude: 72.8792,
    mediaUrls: [],
    authenticityScore: 0.99,
    isSpam: false,
    status: 'PENDING_VERIFICATION' as const,
    submissionChannel: 'WEB',
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  const match = await dedupClusterService.findDuplicateIncident(testReport, existing);
  assert.strictEqual(match.isDuplicate, true);
  assert.strictEqual(match.matchingIncidentId, init.incident.id);
  assert.ok(match.distanceMeters < 100);
});

test('Report Ingestion creates gas leak emergency incident in Delhi NCR', async () => {
  const res = await reportIngestionService.submitReport({
    rawText: 'Toxic chemical fumes leaking from industrial valve near Okhla Phase 2, workers unconscious.',
    latitude: 28.5355,
    longitude: 77.2710,
    reportedAddress: 'Okhla Industrial Area Phase 2, New Delhi',
    submissionChannel: 'WEB',
    zoneId: 'zone-dl-ncr'
  });

  assert.ok(res.report.trackingId.startsWith('TRK-2026-') || res.report.trackingId.startsWith('TRK-IND-'));
  assert.ok(res.incident.id.startsWith('inc-'));
  assert.strictEqual(res.incident.type, 'GAS_LEAK');
});

test('External API Service fetches live Open-Meteo weather and reverse geocodes real location', async () => {
  const { externalApiService } = await import('../services/externalApiService');

  // Test Live Weather
  const weather = await externalApiService.getLiveWeather(19.0760, 72.8777);
  assert.ok(typeof weather.temperatureCelsius === 'number');
  assert.ok(typeof weather.windSpeedKmh === 'number');
  assert.ok(typeof weather.surfacePressureHpa === 'number');
  assert.ok(weather.weatherDescription.length > 0);

  // Test Real Reverse Geocoding
  const geo = await externalApiService.reverseGeocode(19.0760, 72.8777);
  assert.ok(geo.displayName.length > 0);

  // Test Real Sync of USGS Feeds
  const syncResult = await externalApiService.syncRealWorldData();
  assert.ok(typeof syncResult.syncedEarthquakes === 'number');
  assert.ok(syncResult.timestamp.length > 0);
});
