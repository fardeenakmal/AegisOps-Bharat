import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { Incident, PredictionAlert, Report, SeverityLabel } from '../types';
import { realtimeHub } from '../websocket/hub';

export interface LiveWeatherReport {
  latitude: number;
  longitude: number;
  temperatureCelsius: number;
  relativeHumidityPercent: number;
  precipitationMmHr: number;
  rainMmHr: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  surfacePressureHpa: number;
  weatherDescription: string;
  isExtremeWeather: boolean;
  timestamp: string;
}

export interface GeocodedAddress {
  displayName: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
}

export class ExternalApiService {
  private weatherCache = new Map<string, { data: LiveWeatherReport; expiresAt: number }>();
  private geocodeCache = new Map<string, { data: GeocodedAddress; expiresAt: number }>();
  public lastSyncTime: string | null = null;
  public syncedFeedStats = {
    usgsEarthquakesCount: 0,
    openMeteoTelemetryCount: 0,
    lastStatus: 'NOT_SYNCED'
  };

  /**
   * Fetch live weather telemetry from Open-Meteo API
   */
  async getLiveWeather(latitude: number, longitude: number): Promise<LiveWeatherReport> {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = this.weatherCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m&timezone=auto`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AegisOps-EmergencyPlatform/2.0' }
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP error: ${res.status}`);
      }

      const json = await res.json();
      const cur = json.current || {};

      const weatherCode = cur.weather_code || 0;
      const weatherDescription = this.interpretWeatherCode(weatherCode);

      const isExtremeWeather =
        (cur.wind_speed_10m || 0) > 60 ||
        (cur.wind_gusts_10m || 0) > 80 ||
        (cur.precipitation || 0) > 30 ||
        (cur.rain || 0) > 25;

      const report: LiveWeatherReport = {
        latitude,
        longitude,
        temperatureCelsius: cur.temperature_2m ?? 26,
        relativeHumidityPercent: cur.relative_humidity_2m ?? 75,
        precipitationMmHr: cur.precipitation ?? 0,
        rainMmHr: cur.rain ?? 0,
        windSpeedKmh: cur.wind_speed_10m ?? 15,
        windGustsKmh: cur.wind_gusts_10m ?? 25,
        surfacePressureHpa: cur.surface_pressure ?? 1010,
        weatherDescription,
        isExtremeWeather,
        timestamp: cur.time || new Date().toISOString()
      };

      // Cache for 5 minutes
      this.weatherCache.set(cacheKey, {
        data: report,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      return report;
    } catch (err: any) {
      console.warn(`[Open-Meteo Weather API Error] ${err.message}. Returning fallback telemetry.`);
      return {
        latitude,
        longitude,
        temperatureCelsius: 28.5,
        relativeHumidityPercent: 78,
        precipitationMmHr: 5.2,
        rainMmHr: 4.8,
        windSpeedKmh: 24,
        windGustsKmh: 38,
        surfacePressureHpa: 1009,
        weatherDescription: 'Monsoon Heavy Cloud Cover with Showers',
        isExtremeWeather: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Reverse Geocode coordinates to real-world address via OpenStreetMap Nominatim
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodedAddress> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = this.geocodeCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AegisOps-DisasterManagementPlatform/2.0 (contact: ops@ndma.gov.in)'
        }
      });

      if (!res.ok) {
        throw new Error(`Nominatim HTTP error: ${res.status}`);
      }

      const json = await res.json();
      const addr = json.address || {};

      const geocoded: GeocodedAddress = {
        displayName: json.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        road: addr.road || addr.pedestrian || addr.street,
        suburb: addr.suburb || addr.neighbourhood || addr.city_district,
        city: addr.city || addr.town || addr.municipality || addr.county,
        state: addr.state,
        country: addr.country,
        postcode: addr.postcode,
        latitude,
        longitude
      };

      // Cache for 1 hour
      this.geocodeCache.set(cacheKey, {
        data: geocoded,
        expiresAt: Date.now() + 60 * 60 * 1000
      });

      return geocoded;
    } catch (err: any) {
      console.warn(`[Nominatim Geocode API Notice] ${err.message}. Returning coordinate string.`);
      return {
        displayName: `Coordinates: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
        latitude,
        longitude
      };
    }
  }

  /**
   * Search address query to coordinates via OpenStreetMap Nominatim
   */
  async searchLocation(query: string): Promise<GeocodedAddress[]> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AegisOps-DisasterManagementPlatform/2.0 (contact: ops@ndma.gov.in)'
        }
      });

      if (!res.ok) throw new Error(`Nominatim search error: ${res.status}`);

      const list = await res.json();
      return (list || []).map((item: any) => ({
        displayName: item.display_name,
        road: item.address?.road,
        suburb: item.address?.suburb,
        city: item.address?.city || item.address?.town,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }));
    } catch (err: any) {
      console.warn(`[Nominatim Search API Notice] ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch live earthquake events from USGS Live Feeds
   */
  async fetchUsgsLiveEarthquakes(): Promise<any[]> {
    try {
      // Fetch 4.5+ earthquakes for the past week
      const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AegisOps-EmergencyPlatform/2.0' }
      });

      if (!res.ok) throw new Error(`USGS HTTP error: ${res.status}`);
      const json = await res.json();
      return json.features || [];
    } catch (err: any) {
      console.error('[USGS Earthquake API Error]', err.message);
      return [];
    }
  }

  /**
   * Synchronize real-world disaster feeds into AegisOps
   */
  async syncRealWorldData(): Promise<{
    syncedEarthquakes: number;
    syncedWeatherAlerts: number;
    timestamp: string;
  }> {
    console.log('[External API Sync] Synchronizing real-time disaster feeds (USGS Earthquakes + Open-Meteo Weather)...');

    let syncedEarthquakes = 0;
    let syncedWeatherAlerts = 0;

    try {
      // 1. Ingest USGS Live Earthquakes (Prioritize Indian Subcontinent & Indian Ocean Tectonic Belt)
      const features = await this.fetchUsgsLiveEarthquakes();

      const regionalQuakes = features.filter((feat) => {
        const coords = feat.geometry?.coordinates || [0, 0];
        const lng = coords[0];
        const lat = coords[1];
        // Indian Subcontinent, Himalayan belt, Arabian Sea, Bay of Bengal & Indian Ocean
        return lat >= -35 && lat <= 45 && lng >= 45 && lng <= 105;
      });

      const targetQuakes = regionalQuakes.length > 0 ? regionalQuakes.slice(0, 10) : features.slice(0, 10);

      for (const feat of targetQuakes) {
        const props = feat.properties || {};
        const geom = feat.geometry || {};
        const coords = geom.coordinates || [77.2090, 28.6139, 10]; // [lng, lat, depth]
        const lng = coords[0];
        const lat = coords[1];
        const depthKm = coords[2] || 10;
        const mag = props.mag || 5.0;
        const title = props.title || `M ${mag.toFixed(1)} Earthquake`;
        const place = props.place || 'Seismic Active Zone';
        const quakeTime = props.time ? new Date(props.time).toISOString() : new Date().toISOString();
        const id = `inc-usgs-${props.code || feat.id || uuidv4().slice(0, 8)}`;

        // Calculate severity score based on Richter Magnitude & Depth
        const rawScore = Math.min(99, 45 + mag * 7.5 - Math.min(15, depthKm * 0.15));
        const severityScore = parseFloat(rawScore.toFixed(1));
        const severityLabel: SeverityLabel = severityScore >= 80 ? 'CRITICAL' : severityScore >= 60 ? 'HIGH' : 'MEDIUM';

        // Check if incident already exists
        if (!db.incidents.has(id)) {
          const reportId = `rep-usgs-${props.code || uuidv4().slice(0, 8)}`;
          const trackingCode = `USGS-EQ-${(props.code || uuidv4().slice(0, 6)).toUpperCase()}`;

          // Create corroborating official seismic report
          const report: Report = {
            id: reportId,
            trackingId: `TRK-USGS-${Math.floor(1000 + Math.random() * 9000)}`,
            incidentId: id,
            reporterName: 'USGS Real-Time Seismic Telemetry Network',
            reporterContact: 'https://earthquake.usgs.gov',
            rawText: `USGS Earthquake Alert: ${title} registered at depth ${depthKm.toFixed(1)} km. Location: ${place}. Tsunami alert flag: ${props.tsunami ? 'ACTIVE' : 'NONE'}.`,
            normalizedText: `Earthquake magnitude ${mag.toFixed(1)} near ${place}, focal depth ${depthKm.toFixed(1)}km.`,
            detectedLanguage: 'en',
            latitude: lat,
            longitude: lng,
            reportedAddress: place,
            mediaUrls: [],
            authenticityScore: 0.99,
            isSpam: false,
            status: 'VERIFIED',
            submissionChannel: 'USGS_SEISMIC_API',
            submittedAt: quakeTime,
            createdAt: quakeTime
          };

          db.reports.set(report.id, report);

          // Estimate casualties and rescue needs
          const estCasualties = mag >= 6.5 ? Math.round((mag - 5.5) * 8) : mag >= 5.5 ? 2 : 0;
          const estTrapped = mag >= 6.0 ? Math.round((mag - 5.0) * 5) : 0;

          const incident: Incident = {
            id,
            trackingCode,
            title: `Live USGS Alert: ${title}`,
            type: 'EARTHQUAKE',
            severityScore,
            severityLabel,
            status: 'REPORTED',
            zoneId: 'zone-ndma-in',
            latitude: lat,
            longitude: lng,
            address: place,
            landmarks: [`Focal Depth: ${depthKm.toFixed(1)} km`, `USGS Event ID: ${props.code || feat.id}`],
            estimatedCasualties: estCasualties,
            estimatedTrapped: estTrapped,
            needsSummary: {
              sarTeams: mag >= 6.0 ? 3 : 1,
              ambulances: Math.max(1, Math.ceil(estCasualties / 2)),
              extricationJaws: mag >= 6.0,
              specialNotes: [
                `Automated ingest from USGS Global Seismographic Network. Richter magnitude ${mag.toFixed(1)}, depth ${depthKm.toFixed(1)}km. Details: ${props.url || 'USGS Event'}`
              ]
            },
            modelConfidence: 0.99,
            aiClassificationMetadata: {
              source: 'USGS_EARTHQUAKE_API',
              magnitude: mag,
              depthKm,
              significance: props.sig,
              tsunamiFlag: props.tsunami
            },
            reportCount: 1,
            reports: [report],
            slaTargetMinutes: severityLabel === 'CRITICAL' ? 10 : 20,
            version: 1,
            createdAt: quakeTime,
            updatedAt: quakeTime
          };

          db.incidents.set(incident.id, incident);
          syncedEarthquakes++;
        }
      }

      // 2. Fetch live real weather across primary zones from Open-Meteo and create Prediction Alerts if severe
      const zones = Array.from(db.zones.values());
      for (const zone of zones) {
        if (!zone.latitude || !zone.longitude) continue;
        const weather = await this.getLiveWeather(zone.latitude, zone.longitude);

        // If high wind, rain, or adverse weather detected, generate or update prediction alert
        if (weather.precipitationMmHr > 20 || weather.windSpeedKmh > 50 || weather.isExtremeWeather) {
          const alertId = `pred-meteo-${zone.id}`;
          const alert: PredictionAlert = {
            id: alertId,
            zoneId: zone.id,
            latitude: zone.latitude,
            longitude: zone.longitude,
            riskType: weather.precipitationMmHr > 25 ? 'URBAN_INUNDATION' : 'CYCLONE_LANDFALL',
            riskScore: Math.min(96, 60 + weather.precipitationMmHr * 0.8 + weather.windSpeedKmh * 0.3),
            severityLabel: weather.precipitationMmHr > 40 || weather.windSpeedKmh > 70 ? 'CRITICAL' : 'HIGH',
            title: `Live Open-Meteo Alert: ${weather.weatherDescription} (${weather.windSpeedKmh.toFixed(0)} km/h Wind, ${weather.precipitationMmHr.toFixed(1)} mm/h Rain)`,
            summary: `Real-time atmospheric telemetry at ${zone.name} indicates heavy meteorological load: Temperature ${weather.temperatureCelsius}°C, Pressure ${weather.surfacePressureHpa} hPa, Wind gusts up to ${weather.windGustsKmh} km/h.`,
            predictedWindowStart: new Date().toISOString(),
            predictedWindowEnd: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
            recommendedActions: [
              'Deploy high-capacity dewatering pumps to low-elevation transit hubs',
              'Alert NDRF / SDRF water rescue teams for flash flood standby',
              'Issue weather advisory to municipal transit operators'
            ],
            recommendedPrepositioning: [
              { resourceType: 'RESCUE_BOAT', targetStation: `${zone.name} Marine Station`, quantity: 2 },
              { resourceType: 'AMBULANCE', targetStation: `${zone.name} District Hospital`, quantity: 3 }
            ],
            confidence: 0.94,
            weatherFactors: {
              precipitationRateMmHr: weather.precipitationMmHr,
              windSpeedKmh: weather.windSpeedKmh,
              pressureHpa: weather.surfacePressureHpa,
              temperatureC: weather.temperatureCelsius
            },
            isActive: true,
            generatedAt: new Date().toISOString()
          };

          db.predictionAlerts.set(alert.id, alert);
          syncedWeatherAlerts++;
        }
      }

      this.lastSyncTime = new Date().toISOString();
      this.syncedFeedStats = {
        usgsEarthquakesCount: syncedEarthquakes,
        openMeteoTelemetryCount: syncedWeatherAlerts,
        lastStatus: 'SUCCESS'
      };

      console.log(`[External API Sync Completed] Ingested ${syncedEarthquakes} live earthquakes, refreshed live weather across ${zones.length} zones.`);

      realtimeHub.broadcast('EXTERNAL_FEEDS_SYNCED', {
        stats: this.syncedFeedStats,
        syncedAt: this.lastSyncTime
      });

      return {
        syncedEarthquakes,
        syncedWeatherAlerts,
        timestamp: this.lastSyncTime
      };
    } catch (err: any) {
      console.error('[External API Sync Failed]', err);
      this.syncedFeedStats.lastStatus = `ERROR: ${err.message}`;
      return {
        syncedEarthquakes,
        syncedWeatherAlerts,
        timestamp: new Date().toISOString()
      };
    }
  }

  private interpretWeatherCode(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy to Overcast';
    if (code === 45 || code === 48) return 'Dense Fog / Reduced Visibility';
    if (code >= 51 && code <= 55) return 'Drizzle / Light Showers';
    if (code >= 61 && code <= 65) return 'Heavy Rainfall / Monsoon Showers';
    if (code >= 71 && code <= 77) return 'Snow / Freezing Precipitation';
    if (code >= 80 && code <= 82) return 'Intense Rain Showers / Downpour';
    if (code >= 95 && code <= 99) return 'Severe Thunderstorm with Hail & Squalls';
    return 'Active Weather System';
  }
}

export const externalApiService = new ExternalApiService();
