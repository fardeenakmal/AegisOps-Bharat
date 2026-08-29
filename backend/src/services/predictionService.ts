import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { PredictionAlert, RiskType, SeverityLabel } from '../types';
import { realtimeHub } from '../websocket/hub';

import { externalApiService } from './externalApiService';

export interface SimulatePredictionInput {
  zoneId: string;
  riskType: RiskType;
  windSpeedKmh?: number;
  precipitationMmHr?: number;
  riverGaugeSurgePercent?: number;
  stormSurgeMeters?: number;
  latitude?: number;
  longitude?: number;
}

export class PredictionService {
  getActiveAlerts(zoneId?: string): PredictionAlert[] {
    let list = Array.from(db.predictionAlerts.values()).filter((a) => a.isActive);
    if (zoneId && zoneId !== 'zone-ndma-in' && zoneId !== 'ALL') {
      list = list.filter((a) => a.zoneId === zoneId);
    }
    return list.sort((a, b) => b.riskScore - a.riskScore);
  }

  async simulateHazardSpread(input: SimulatePredictionInput): Promise<PredictionAlert> {
    const alertId = `pred-ind-${uuidv4().slice(0, 8)}`;
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 6 * 3600 * 1000);

    const zone = db.zones.get(input.zoneId) || db.zones.get('zone-mh-mum');
    const latitude = input.latitude ?? zone?.latitude ?? 19.0760;
    const longitude = input.longitude ?? zone?.longitude ?? 72.8777;

    // Fetch real live meteorological baseline from Open-Meteo for this zone
    const liveWeather = await externalApiService.getLiveWeather(latitude, longitude);

    let riskScore = 80.0;
    let severityLabel: SeverityLabel = 'HIGH';
    let title = '';
    let summary = '';
    const recommendedActions: string[] = [];
    const recommendedPrepositioning: any[] = [];

    const effectivePrecipitation = input.precipitationMmHr ?? (liveWeather.precipitationMmHr > 0 ? liveWeather.precipitationMmHr : 65);
    const effectiveWind = input.windSpeedKmh ?? (liveWeather.windSpeedKmh > 0 ? liveWeather.windSpeedKmh : 75);

    if (input.riskType === 'FLOOD_SPREAD' || input.riskType === 'URBAN_INUNDATION') {
      const surge = input.riverGaugeSurgePercent || 65;
      riskScore = Math.min(98, 55 + surge * 0.40 + effectivePrecipitation * 0.25);
      severityLabel = riskScore > 85 ? 'CRITICAL' : 'HIGH';
      title = `IMD / Open-Meteo Hydro Alert: Inundation & Cloudburst (${surge}% River Gauge Surge, ${effectivePrecipitation.toFixed(1)}mm/hr)`;
      summary = `Doppler radar and Open-Meteo live telemetry at ${zone?.name || 'Urban Basin'} (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E) indicates intense precipitation with surface pressure at ${liveWeather.surfacePressureHpa} hPa. Central Water Commission sensors project river levels crossing Danger Mark in 90 minutes.`;
      recommendedActions.push(
        'Evacuate low-lying riverbank settlements and transit underpasses',
        'Mobilize NDRF and SDRF inflatable flood rescue craft units',
        'Pre-stage high-volume dewatering pumps at low-elevation transit hubs',
        'Issue NDMA Sachet cell broadcast emergency evacuation alert'
      );
      recommendedPrepositioning.push(
        { resourceType: 'NDRF_BATTALION', targetStation: `${zone?.name || 'Metro'} Basin Outpost`, quantity: 2 },
        { resourceType: 'AMBULANCE', targetStation: 'District Trauma Center', quantity: 4 }
      );
    } else if (input.riskType === 'CYCLONE_LANDFALL') {
      const wind = effectiveWind;
      riskScore = Math.min(99, 65 + wind * 0.22);
      severityLabel = 'CRITICAL';
      title = `IMD / Open-Meteo Super-Cyclone Warning: Coastal Surge & Gales (${wind.toFixed(0)} km/h)`;
      summary = `Satellite infrared telemetry and Open-Meteo atmospheric model indicate Category-4 Cyclone approach near ${zone?.name || 'Coastal Command'}. Peak wind gusts measured at ${liveWeather.windGustsKmh} km/h with projected storm surge of +3.5m above astronomical tide.`;
      recommendedActions.push(
        'Execute mandatory evacuation of 250,000 residents within 5km coastal belt to Multipurpose Cyclone Shelters',
        'Pre-position Indian Coast Guard and NDRF deep water rescue battalions',
        'Impose complete suspension of fishing and port cargo operations',
        'Trigger emergency satellite phone communication relays'
      );
      recommendedPrepositioning.push(
        { resourceType: 'NDRF_BATTALION', targetStation: `${zone?.name || 'Coastal'} Command Center`, quantity: 4 }
      );
    } else {
      title = `Geological Landslide & Debris Flow Risk Advisory for ${zone?.name || input.zoneId}`;
      summary = `Continuous precipitation exceeding saturation threshold (${effectivePrecipitation.toFixed(1)} mm/hr). High probability of slope failure and highway blockage along transit corridors.`;
      recommendedActions.push(
        'Halt vehicular traffic on vulnerable mountain pass sectors',
        'Pre-stage heavy hydraulic excavators and NDRF search canine squads'
      );
      recommendedPrepositioning.push(
        { resourceType: 'SAR_TEAM', targetStation: 'District Emergency Operations Center', quantity: 2 }
      );
    }

    const alert: PredictionAlert = {
      id: alertId,
      zoneId: input.zoneId,
      latitude,
      longitude,
      riskType: input.riskType,
      riskScore: parseFloat(riskScore.toFixed(1)),
      severityLabel,
      title,
      summary,
      predictedWindowStart: now.toISOString(),
      predictedWindowEnd: windowEnd.toISOString(),
      recommendedActions,
      recommendedPrepositioning,
      confidence: 0.95,
      weatherFactors: {
        windSpeedKmh: effectiveWind,
        precipitationMmHr: effectivePrecipitation,
        riverGaugeSurgePercent: input.riverGaugeSurgePercent || 60,
        surfacePressureHpa: liveWeather.surfacePressureHpa,
        temperatureCelsius: liveWeather.temperatureCelsius
      },
      isActive: true,
      generatedAt: now.toISOString()
    };

    db.predictionAlerts.set(alert.id, alert);
    realtimeHub.broadcast('PREDICTION_ALERT_ISSUED', { alert });

    return alert;
  }
}

export const predictionService = new PredictionService();
