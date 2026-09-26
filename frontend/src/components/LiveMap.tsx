import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Resource, Hospital, PredictionAlert, NaturalEvent, GdacsAlert, SeismicEvent } from '../types';
import {
  fetchLiveWeather,
  reverseGeocode,
  fetchRiverFloodTelemetry,
  harvestDistrictInfrastructure,
  fetchTacticalRoute,
  fetchEarthquakes,
  fetchNasaEonetEvents,
  fetchGdacsAlerts
} from '../services/api';
import {
  CloudRain,
  Wind,
  Gauge,
  Compass,
  Activity,
  MapPin,
  RefreshCw,
  Waves,
  Radio,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Navigation,
  Flame,
  Zap,
  Globe,
  X
} from 'lucide-react';

interface LiveMapProps {
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  predictions: PredictionAlert[];
  zones?: any[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  activeZone?: string;
  theme?: 'dark' | 'light';
}

// Default Pan-India Focal Coordinates (Extensible to Global/Regional Commands)
const DEFAULT_CENTER: [number, number] = [22.0, 78.9629];

const SECTOR_COORDINATES: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  'zone-ndma-in': { lat: 22.0, lng: 78.9629, zoom: 5, name: 'All India (National Grid)' },
  'ALL': { lat: 22.0, lng: 78.9629, zoom: 5, name: 'All India (National Grid)' },
  'zone-mh-mum': { lat: 19.0760, lng: 72.8777, zoom: 11, name: 'Mumbai Metro (BMC Sector)' },
  'zone-dl-ncr': { lat: 28.6139, lng: 77.2090, zoom: 11, name: 'Delhi NCR (DDMA Sector)' },
  'zone-ka-blr': { lat: 12.9716, lng: 77.5946, zoom: 11, name: 'Bengaluru Urban (BBMP Sector)' },
  'zone-tn-chn': { lat: 13.0827, lng: 80.2707, zoom: 11, name: 'Chennai Metro (GCC Sector)' },
  'zone-od-bbs': { lat: 20.2961, lng: 85.8245, zoom: 9, name: 'Odisha Coastal (OSDMA Sector)' },
  'zone-wb-kol': { lat: 22.5726, lng: 88.3639, zoom: 11, name: 'Kolkata Emergency (KMC Sector)' }
};

export const LiveMap: React.FC<LiveMapProps> = ({
  incidents,
  resources,
  hospitals,
  predictions,
  zones = [],
  selectedIncident,
  onSelectIncident,
  activeZone = 'zone-ndma-in',
  theme = 'dark'
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [riverTelemetry, setRiverTelemetry] = useState<any>(null);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [harvestNotice, setHarvestNotice] = useState<string | null>(null);
  const [activeTacticalRoute, setActiveTacticalRoute] = useState<any | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [dismissedNdmaAlertId, setDismissedNdmaAlertId] = useState<string | null>(null);

  // Live Multi-Agency Feeds
  const [earthquakes, setEarthquakes] = useState<SeismicEvent[]>([]);
  const [nasaEvents, setNasaEvents] = useState<NaturalEvent[]>([]);
  const [gdacsAlerts, setGdacsAlerts] = useState<GdacsAlert[]>([]);

  // Layer Visibility Filters
  const [showEarthquakes, setShowEarthquakes] = useState<boolean>(true);
  const [showNasaEvents, setShowNasaEvents] = useState<boolean>(true);
  const [showGdacsAlerts, setShowGdacsAlerts] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);

  useEffect(() => {
    fetchEarthquakes().then((res) => setEarthquakes(res.events || [])).catch(() => {});
    fetchNasaEonetEvents().then((res) => setNasaEvents(res.events || [])).catch(() => {});
    fetchGdacsAlerts().then((res) => setGdacsAlerts(res.alerts || [])).catch(() => {});
  }, []);

  // Initialize Leaflet Map (defaults to Indian subcontinental command, unconstrained for multi-region)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialSector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-ndma-in'];
      const map = L.map(mapContainerRef.current, {
        center: [initialSector.lat, initialSector.lng],
        zoom: initialSector.zoom,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 100% Free OpenStreetMap Tile Layer (no watermark, zero API keys required)
      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        minZoom: 3,
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Click map to reverse geocode location via OSM Nominatim
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const popup = L.popup()
          .setLatLng([lat, lng])
          .setContent('<div style="font-size:11px; padding:4px; color:#475569;">Querying live GIS telemetry...</div>')
          .openOn(map);

        try {
          const [geo, weather] = await Promise.all([
            reverseGeocode(lat, lng),
            fetchLiveWeather(lat, lng)
          ]);

          popup.setContent(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: var(--text-primary);">
              <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">
                📍 Verified Location
              </div>
              <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); line-height: 1.3;">${geo.displayName}</div>
              <div style="font-size: 10px; margin-top: 4px; color: var(--text-muted); font-family: monospace;">
                ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
              </div>
              <div style="margin-top: 8px; padding: 6px 8px; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 6px; font-size: 11px; color: #4ade80;">
                🌤️ <b>${weather.temperatureCelsius}°C</b> (${weather.weatherDescription}) &nbsp;|&nbsp; 💨 <b>${weather.windSpeedKmh} km/h</b> &nbsp;|&nbsp; 🌧️ <b>${weather.precipitationMmHr} mm/h</b>
              </div>
            </div>
          `);
        } catch (err: any) {
          popup.setContent(`
            <div style="font-size:11px; color:var(--text-primary);">
              <b>GPS Coordinates</b>: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
            </div>
          `);
        }
      });

      // Responsive size invalidation for mobile devices, flex transitions, and tab switches
      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      const t1 = setTimeout(handleResize, 80);
      const t2 = setTimeout(handleResize, 300);
      const t3 = setTimeout(handleResize, 800);

      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Map tiles use OpenStreetMap; dark mode styling is applied via CSS filter seamlessly
  // without incurring network reloads or requiring third-party API keys.

  // Handle Sector Navigation: Pan / Zoom when sector changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const sector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-ndma-in'];
    map.flyTo([sector.lat, sector.lng], sector.zoom, { duration: 1.0 });
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Fetch live weather & river discharge for the sector center
    fetchSectorWeather(sector.lat, sector.lng);
    fetchSectorRiver(sector.lat, sector.lng);
  }, [activeZone]);

  const fetchSectorWeather = async (lat?: number, lng?: number) => {
    const map = mapInstanceRef.current;
    const targetLat = lat ?? map?.getCenter().lat ?? 21.5;
    const targetLng = lng ?? map?.getCenter().lng ?? 79.0;
    setWeatherLoading(true);
    try {
      const data = await fetchLiveWeather(targetLat, targetLng);
      setLiveWeather(data);
    } catch (err) {
      console.error('[Weather Fetch Error]', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchSectorRiver = async (lat?: number, lng?: number) => {
    const map = mapInstanceRef.current;
    const targetLat = lat ?? map?.getCenter().lat ?? 19.0760;
    const targetLng = lng ?? map?.getCenter().lng ?? 72.8777;
    try {
      const flood = await fetchRiverFloodTelemetry(targetLat, targetLng);
      setRiverTelemetry(flood);
    } catch (err) {
      console.warn('[River Telemetry Error]', err);
    }
  };

  const handleHarvestInfrastructure = async () => {
    const sector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-mh-mum'];
    setIsHarvesting(true);
    setHarvestNotice(null);
    try {
      const res = await harvestDistrictInfrastructure(sector.lat, sector.lng, 10000, activeZone);
      setHarvestNotice(`Harvested ${res.totalCount} OSM emergency units (${res.hydration?.addedHospitals || 0} hospitals, ${res.hydration?.addedResources || 0} rescue stations)`);
      setTimeout(() => setHarvestNotice(null), 7000);
    } catch (err: any) {
      setHarvestNotice(`OSM Harvest notice: ${err.message || 'Complete'}`);
      setTimeout(() => setHarvestNotice(null), 5000);
    } finally {
      setIsHarvesting(false);
    }
  };

  // Periodic weather & river refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const sector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-ndma-in'];
      fetchSectorWeather(sector.lat, sector.lng);
      fetchSectorRiver(sector.lat, sector.lng);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeZone]);

  // Calculate tactical route when an incident is selected
  useEffect(() => {
    if (!selectedIncident) {
      setActiveTacticalRoute(null);
      return;
    }

    let cancelled = false;
    const computeRoute = async () => {
      const candidate = resources.find((r) => r.status === 'AVAILABLE') || resources[0];
      if (!candidate) return;

      try {
        setRouteLoading(true);
        const route = await fetchTacticalRoute(
          candidate.latitude,
          candidate.longitude,
          selectedIncident.latitude,
          selectedIncident.longitude
        );
        if (!cancelled && route) {
          setActiveTacticalRoute({ ...route, unitCallSign: candidate.callSign });
        }
      } catch (err) {
        console.warn('[Tactical Route Calc Error]', err);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    computeRoute();
    return () => {
      cancelled = true;
    };
  }, [selectedIncident, resources]);

  // Update Markers & Threat Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 0. Draw Administrative Risk Zone Choropleths
    zones.forEach((zone: any) => {
      const lat = typeof zone.latitude === 'number' ? zone.latitude : parseFloat(zone.latitude);
      const lng = typeof zone.longitude === 'number' ? zone.longitude : parseFloat(zone.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const score = typeof zone.riskScore === 'number' ? zone.riskScore : parseFloat(zone.riskScore || '0');
      const level = zone.currentRiskLevel || (score >= 80 ? 'CRITICAL' : score >= 65 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW');
      const zoneColor = level === 'CRITICAL' ? '#dc2626' : level === 'HIGH' ? '#ea580c' : level === 'MEDIUM' ? '#d97706' : '#059669';
      const radiusMeters = zone.level === 'NATIONAL' ? 180000 : zone.level === 'STATE' ? 80000 : 28000;

      const zoneCircle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: zoneColor,
        fillColor: zoneColor,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: level === 'CRITICAL' ? '4, 6' : undefined
      }).bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: var(--text-primary);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); font-family: monospace;">${zone.code || zone.id}</span>
            <span style="font-size: 10px; font-weight: 700; color: #ffffff; background: ${zoneColor}; padding: 2px 6px; border-radius: 4px;">
              ${level} (${score.toFixed(0)}/100)
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px;">${zone.name}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
            Sector: <b>${zone.level}</b> &bull; Primary Threat: <b>${zone.primaryHazard || 'MULTI_HAZARD'}</b>
          </div>
          <div style="font-size: 10px; padding: 4px 6px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-secondary);">
            👥 Protected Population: <b>${(Number(zone.population || 0) / 1000000).toFixed(1)}M</b>
          </div>
        </div>
      `);

      layerGroup.addLayer(zoneCircle);
    });

    // 1. Draw Real Prediction Threat Overlays
    predictions.forEach((pred) => {
      if (!pred.isActive) return;
      const centerLat = pred.latitude ?? 19.0760;
      const centerLng = pred.longitude ?? 72.8777;
      const radiusMeters = pred.riskType === 'CYCLONE_LANDFALL' ? 45000 : 8000;

      const threatCircle = L.circle([centerLat, centerLng], {
        radius: radiusMeters,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '5, 8'
      }).bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: var(--text-primary);">
          <div style="font-size: 10px; font-weight: 700; color: #dc2626; text-transform: uppercase;">⚠️ ${pred.riskType}</div>
          <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin: 3px 0;">${pred.title}</div>
          <p style="font-size: 11px; color: var(--text-secondary); margin: 4px 0;">${pred.summary}</p>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Risk Score: <b style="color:#dc2626;">${pred.riskScore}/100</b> (${pred.severityLabel})</div>
        </div>
      `);
      layerGroup.addLayer(threatCircle);
    });

    // 2. Plot Real Incidents (USGS Earthquakes, Weather Threats, Citizen Reports)
    incidents.forEach((inc) => {
      const isCritical = inc.severityLabel === 'CRITICAL';
      const isSelected = selectedIncident?.id === inc.id;
      const markerColor = isCritical ? '#dc2626' : inc.severityLabel === 'HIGH' ? '#d97706' : '#2563eb';
      const isUsgs = inc.id.startsWith('inc-usgs');

      const customIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isCritical
                ? `<div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: ${markerColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: ${isSelected ? '24px' : '20px'};
              height: ${isSelected ? '24px' : '20px'};
              border-radius: 50%;
              background: ${markerColor};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: ${isSelected ? '11px' : '10px'};
              font-weight: 700;
              transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            ">
              ${isUsgs ? '⚡' : inc.type === 'FLOOD' ? '🌊' : inc.type === 'FIRE' ? '🔥' : '🚨'}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectIncident(inc);
      });

      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 230px; color: var(--text-primary);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); font-family: monospace;">${inc.trackingCode}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${markerColor}; background: var(--bg-card); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">
              ${inc.severityLabel} (${inc.severityScore.toFixed(0)})
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${inc.title}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">📍 ${inc.address}</div>
          ${
            isUsgs
              ? `<div style="font-size: 10px; padding: 4px 6px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; color: #38bdf8;">
                  📡 <b>Source: USGS Seismic Telemetry (India Region)</b> &bull; Real Event
                </div>`
              : `<div style="font-size: 10px; padding: 4px 6px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-secondary);">
                  👥 Trapped: <b>${inc.estimatedTrapped}</b> &bull; Casualties: <b>${inc.estimatedCasualties}</b> &bull; Reports: <b>${inc.reportCount}</b>
                </div>`
          }
        </div>
      `);

      layerGroup.addLayer(marker);
    });

    // 3. Plot Real USGS Earthquakes
    if (showEarthquakes) {
      earthquakes.forEach((eq) => {
        const isHigh = eq.magnitude >= 5.0;
        const color = isHigh ? '#ef4444' : '#f59e0b';
        const quakeCircle = L.circle([eq.latitude, eq.longitude], {
          radius: Math.max(15000, eq.magnitude * 18000),
          color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2
        }).bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 210px; color: var(--text-primary);">
            <div style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
              ⚡ USGS Real-Time Earthquake
            </div>
            <div style="font-size: 13px; font-weight: 700; margin: 3px 0; color: var(--text-primary);">M ${eq.magnitude.toFixed(1)} - ${eq.place}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Depth: <b>${eq.depthKm.toFixed(1)} km</b> &bull; GPS: ${eq.latitude.toFixed(2)}°N, ${eq.longitude.toFixed(2)}°E</div>
            ${eq.tsunamiFlag ? '<div style="margin-top:4px; font-size:10px; color:#dc2626; font-weight:700;">🌊 Tsunami Advisory Active</div>' : ''}
            <div style="margin-top:6px;"><a href="https://earthquake.usgs.gov/earthquakes/eventpage/${eq.id}" target="_blank" rel="noopener noreferrer" style="font-size:11px; color:#38bdf8; text-decoration:none; font-weight:600;">Inspect on USGS &rarr;</a></div>
          </div>
        `);
        layerGroup.addLayer(quakeCircle);
      });
    }

    // 4. Plot Real NASA EONET Natural Events (Wildfires, Storms, Floods)
    if (showNasaEvents) {
      nasaEvents.forEach((ev) => {
        const isFire = ev.category.toLowerCase().includes('fire');
        const isStorm = ev.category.toLowerCase().includes('storm');
        const symbol = isFire ? '🔥' : isStorm ? '🌀' : '⚠️';
        const color = isFire ? '#f97316' : '#8b5cf6';

        const evIcon = L.divIcon({
          className: 'nasa-event-pin',
          html: `
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: ${color};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              ${symbol}
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const evMarker = L.marker([ev.latitude, ev.longitude], { icon: evIcon }).bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: var(--text-primary);">
            <div style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
              🛰️ NASA EONET Satellite Observation
            </div>
            <div style="font-size: 13px; font-weight: 700; margin: 3px 0; color: var(--text-primary);">${ev.title}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Category: <b>${ev.categoryTitle}</b></div>
            ${ev.magnitude ? `<div style="font-size: 11px; color: var(--text-secondary);">Magnitude: <b>${ev.magnitude} ${ev.magnitudeUnit || ''}</b></div>` : ''}
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Detected: ${ev.date ? new Date(ev.date).toLocaleDateString() : 'Active'}</div>
            ${ev.link ? `<div style="margin-top:6px;"><a href="${ev.link}" target="_blank" rel="noopener noreferrer" style="font-size:11px; color:#38bdf8; text-decoration:none; font-weight:600;">NASA Event Telemetry &rarr;</a></div>` : ''}
          </div>
        `);
        layerGroup.addLayer(evMarker);
      });
    }

    // 5. Plot Real GDACS Global Alerts
    if (showGdacsAlerts) {
      gdacsAlerts.forEach((gd) => {
        if (!gd.latitude || !gd.longitude) return;
        const isRed = gd.alertLevel.toLowerCase() === 'red';
        const isOrange = gd.alertLevel.toLowerCase() === 'orange';
        const color = isRed ? '#ef4444' : isOrange ? '#f97316' : '#10b981';

        const gdacsIcon = L.divIcon({
          className: 'gdacs-pin',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 4px;
              background: ${color};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: 800;
              color: #ffffff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              ${gd.eventType}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const gdMarker = L.marker([gd.latitude, gd.longitude], { icon: gdacsIcon }).bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 230px; color: var(--text-primary);">
            <div style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
              🌍 GDACS UN/EC Multi-Hazard Alert (${gd.alertLevel})
            </div>
            <div style="font-size: 12px; font-weight: 700; margin: 3px 0; color: var(--text-primary);">${gd.title}</div>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 4px 0; line-height: 1.3;">${gd.description}</p>
            ${gd.link ? `<div style="margin-top:6px;"><a href="${gd.link}" target="_blank" rel="noopener noreferrer" style="font-size:11px; color:#38bdf8; text-decoration:none; font-weight:600;">GDACS Situation Report &rarr;</a></div>` : ''}
          </div>
        `);
        layerGroup.addLayer(gdMarker);
      });
    }

    // 6. Plot Real Hospitals
    if (showHospitals) {
      hospitals.forEach((hosp) => {
        const hospIcon = L.divIcon({
          className: 'custom-hosp-pin',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 4px;
              background: #0284c7;
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
            ">
              H
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const hospMarker = L.marker([hosp.latitude, hosp.longitude], { icon: hospIcon }).bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 210px; color: var(--text-primary);">
            <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">🏥 Level-1 Emergency Trauma Center</div>
            <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin: 2px 0;">${hosp.name}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">📍 ${hosp.address || 'Emergency Sector'}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
              <div style="background: rgba(2, 132, 199, 0.15); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(2, 132, 199, 0.35); color: var(--text-primary);">
                Beds: <b>${hosp.availableBeds ?? 100}/${hosp.totalBeds ?? 400}</b>
              </div>
              <div style="background: rgba(2, 132, 199, 0.15); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(2, 132, 199, 0.35); color: var(--text-primary);">
                ICU: <b>${hosp.availableIcuBeds ?? 15}/${hosp.totalIcuBeds ?? 60}</b>
              </div>
            </div>
          </div>
        `);

        layerGroup.addLayer(hospMarker);
      });
    }

    // 4. Plot Resources
    resources.forEach((res) => {
      const isAvailable = res.status === 'AVAILABLE';
      const iconSymbol =
        res.type === 'NDRF_BATTALION'
          ? '🛡️'
          : res.type === 'AMBULANCE'
          ? '🚑'
          : res.type === 'FIRE_TRUCK'
          ? '🚒'
          : res.type === 'RESCUE_BOAT'
          ? '🚤'
          : '🚨';

      const resIcon = L.divIcon({
        className: 'custom-resource-pin',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${isAvailable ? '#059669' : '#d97706'};
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          ">
            ${iconSymbol}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const resMarker = L.marker([res.latitude, res.longitude], { icon: resIcon }).bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 200px; color: var(--text-primary);">
          <div style="font-size: 10px; font-weight: 700; color: ${isAvailable ? '#059669' : '#d97706'}; text-transform: uppercase;">
            ${res.status}
          </div>
          <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${res.callSign}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Base: ${res.baseStationName}</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Crew: ${res.crewCount} &bull; Radio: ${res.contactRadio || 'VHF TAC'}</div>
        </div>
      `);

      layerGroup.addLayer(resMarker);
    });

    // 5. Draw Tactical OSRM Road Route if active
    if (activeTacticalRoute?.geometryCoordinates?.length) {
      const latLngs = activeTacticalRoute.geometryCoordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
      );

      const isRerouted = !!activeTacticalRoute.isImpassableDueToFlood;
      const polyline = L.polyline(latLngs, {
        color: isRerouted ? '#dc2626' : '#2563eb',
        weight: 5,
        opacity: 0.85,
        dashArray: isRerouted ? '8, 8' : undefined
      });

      polyline.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: var(--text-primary);">
          <div style="font-size: 10px; font-weight: 800; color: ${isRerouted ? '#dc2626' : '#0284c7'}; text-transform: uppercase;">
            ${isRerouted ? '⚠️ FLOOD REROUTE ACTIVE' : '⚡ OSRM EMERGENCY ROAD ROUTE'}
          </div>
          <div style="font-size: 13px; font-weight: 700; margin-top: 4px; color: var(--text-primary);">
            ${(activeTacticalRoute.distanceMeters / 1000).toFixed(1)} km &bull; ${activeTacticalRoute.durationMinutes} mins ETA
          </div>
          ${activeTacticalRoute.hazardWarnings?.length ? `
            <div style="margin-top: 6px; padding: 4px 6px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 4px; font-size: 10px; color: #f87171;">
              ${activeTacticalRoute.hazardWarnings.join('<br/>')}
            </div>
          ` : ''}
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 6px;">
            Unit: ${activeTacticalRoute.unitCallSign || 'Assigned Unit'} &rarr; Incident Site
          </div>
        </div>
      `);

      layerGroup.addLayer(polyline);
    }

    // Auto Fly to selected incident
  }, [
    incidents,
    resources,
    hospitals,
    predictions,
    zones,
    selectedIncident,
    activeTacticalRoute,
    earthquakes,
    nasaEvents,
    gdacsAlerts,
    showEarthquakes,
    showNasaEvents,
    showGdacsAlerts,
    showHospitals
  ]);

  return (
    <div className="vercel-panel" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-canvas)' }} />

      {/* Official NDMA Sachet Alert Banner (Top Center - Theme-Aware Glassmode) */}
      {(() => {
        const topNdmaAlert = predictions.find(
          (p) => p.isActive && (p.title.includes('NDMA Sachet') || p.title.includes('Red Alert') || p.riskScore >= 80) && p.id !== dismissedNdmaAlertId
        );
        if (!topNdmaAlert) return null;

        const isCritical = topNdmaAlert.severityLabel === 'CRITICAL' || topNdmaAlert.riskScore >= 85;

        return (
          <div
            className={`ndma-alert-banner ${isCritical ? 'critical' : 'warning'}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <ShieldAlert
                size={16}
                color={isCritical ? (theme === 'light' ? '#dc2626' : '#f85149') : (theme === 'light' ? '#d97706' : '#d29922')}
                className="pulse-slow"
                style={{ flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: isCritical ? '#dc2626' : '#d97706',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0
                    }}
                  >
                    NDMA CAP
                  </span>
                  <span className="ndma-alert-title">
                    {topNdmaAlert.title}
                  </span>
                </div>
                <div className="ndma-alert-summary">
                  {topNdmaAlert.summary}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span
                className="num-tabular"
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: isCritical ? (theme === 'light' ? '#dc2626' : '#f85149') : (theme === 'light' ? '#d97706' : '#d29922')
                }}
              >
                Risk {topNdmaAlert.riskScore.toFixed(0)}/100
              </span>
              <button
                onClick={() => setDismissedNdmaAlertId(topNdmaAlert.id)}
                className="btn btn-ghost"
                style={{
                  padding: '2px 4px',
                  height: 22,
                  width: 22,
                  borderRadius: 4,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Dismiss alert banner"
                aria-label="Dismiss alert"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Tactical Route HUD Card */}
      {activeTacticalRoute && (
        <div
          className="hud-card"
          style={{
            position: 'absolute',
            bottom: 54,
            left: 10,
            maxWidth: 380,
            padding: '7px 12px',
            borderColor: activeTacticalRoute.isImpassableDueToFlood ? 'rgba(248, 81, 73, 0.4)' : 'rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 410
          }}
        >
          <Navigation size={15} color={activeTacticalRoute.isImpassableDueToFlood ? '#f85149' : '#38bdf8'} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
              OSRM Route: <span className="num-tabular">{(activeTacticalRoute.distanceMeters / 1000).toFixed(1)} km</span> &bull; <span className="num-tabular">{activeTacticalRoute.durationMinutes} min ETA</span>
            </div>
            <div style={{ fontSize: 10, color: activeTacticalRoute.isImpassableDueToFlood ? '#f85149' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTacticalRoute.isImpassableDueToFlood
                ? '⚠️ Detour active around flood zone'
                : `${activeTacticalRoute.unitCallSign || 'Unit'} Corridor`}
            </div>
          </div>
          <button
            onClick={() => setActiveTacticalRoute(null)}
            className="btn btn-ghost"
            style={{ padding: '2px 6px', fontSize: 12, marginLeft: 'auto', color: 'var(--text-muted)' }}
            title="Dismiss route preview"
          >
            &times;
          </button>
        </div>
      )}

      {/* Unified Bottom Bar: Telemetry + OSM Harvester + Clean Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
          zIndex: 400,
          flexWrap: 'wrap'
        }}
      >
        {/* Left Pill: Live Atmospheric & River Telemetry */}
        {liveWeather && (
          <div
            className="hud-card"
            style={{
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              pointerEvents: 'auto'
            }}
          >
            <CloudRain size={13} color="#38bdf8" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="num-tabular">
              {liveWeather.temperatureCelsius}°C
            </span>
            <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
            <span className="mobile-hide" style={{ color: 'var(--text-secondary)' }}>
              💨 <span className="num-tabular">{liveWeather.windSpeedKmh} km/h</span> &bull; 🌧️ <span className="num-tabular">{liveWeather.precipitationMmHr} mm/h</span>
            </span>

            {riverTelemetry && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                <span style={{ color: riverTelemetry.isFloodingImminent ? '#f85149' : '#38bdf8', fontWeight: 600 }} className="num-tabular">
                  🌊 {riverTelemetry.riverDischargeM3s} m³/s
                </span>
              </>
            )}

            <button
              onClick={() => {
                fetchSectorWeather();
                fetchSectorRiver();
              }}
              disabled={weatherLoading}
              className="btn btn-ghost"
              title="Refresh Live Weather & Basin Telemetry"
              style={{ padding: 2, height: 20, width: 20 }}
            >
              <RefreshCw size={10} className={weatherLoading ? 'spin-anim' : ''} color="#38bdf8" />
            </button>
          </div>
        )}

        {/* Center / Right: Layer Toggles, OSM Harvester & Clean Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto', flexWrap: 'wrap' }}>
          {/* Real Disaster Layer Toggles */}
          <div className="hud-card" style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px' }}>
            <button
              onClick={() => setShowEarthquakes((prev) => !prev)}
              className="btn"
              style={{
                fontSize: 10,
                padding: '2px 6px',
                height: 22,
                borderRadius: 4,
                background: showEarthquakes ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                border: `1px solid ${showEarthquakes ? '#ef4444' : 'transparent'}`,
                color: showEarthquakes ? '#fca5a5' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Toggle USGS Real-Time Earthquakes Layer"
            >
              ⚡ Quakes ({earthquakes.length})
            </button>
            <button
              onClick={() => setShowNasaEvents((prev) => !prev)}
              className="btn"
              style={{
                fontSize: 10,
                padding: '2px 6px',
                height: 22,
                borderRadius: 4,
                background: showNasaEvents ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                border: `1px solid ${showNasaEvents ? '#f97316' : 'transparent'}`,
                color: showNasaEvents ? '#fdba74' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Toggle NASA EONET Natural Events Layer"
            >
              🛰️ NASA ({nasaEvents.length})
            </button>
            <button
              onClick={() => setShowGdacsAlerts((prev) => !prev)}
              className="btn"
              style={{
                fontSize: 10,
                padding: '2px 6px',
                height: 22,
                borderRadius: 4,
                background: showGdacsAlerts ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: `1px solid ${showGdacsAlerts ? '#10b981' : 'transparent'}`,
                color: showGdacsAlerts ? '#6ee7b7' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Toggle GDACS Global Multi-Hazard Layer"
            >
              🌍 GDACS ({gdacsAlerts.length})
            </button>
            <button
              onClick={() => setShowHospitals((prev) => !prev)}
              className="btn"
              style={{
                fontSize: 10,
                padding: '2px 6px',
                height: 22,
                borderRadius: 4,
                background: showHospitals ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
                border: `1px solid ${showHospitals ? '#0284c7' : 'transparent'}`,
                color: showHospitals ? '#7dd3fc' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Toggle OpenStreetMap Hospitals & Trauma Beds Layer"
            >
              🏥 Trauma ({hospitals.length})
            </button>
          </div>

          {/* Quick OSM Facility Harvester */}
          <button
            onClick={handleHarvestInfrastructure}
            disabled={isHarvesting}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: '4px 9px', height: 26 }}
            title="Harvest emergency infrastructure (hospitals, fire, helipads) from OpenStreetMap"
          >
            <Building2 size={12} color="#38bdf8" />
            <span className="mobile-hide">{isHarvesting ? 'Harvesting...' : 'Harvest OSM'}</span>
          </button>

          {harvestNotice && (
            <div
              className="hud-card"
              style={{
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 600,
                color: '#86efac',
                borderColor: 'rgba(46, 160, 67, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <CheckCircle2 size={11} color="#2ea043" />
              <span>{harvestNotice}</span>
            </div>
          )}

          {/* Minimalist Legend */}
          <div
            className="hud-card mobile-hide"
            style={{
              padding: '4px 10px',
              display: 'flex',
              gap: 10,
              fontSize: 10,
              fontWeight: 500,
              color: 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 6, borderRadius: 2, background: 'rgba(239, 68, 68, 0.4)', border: '1px solid #ef4444' }} /> Risk Sector
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} /> Critical
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} /> High
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> Fleet
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: '#0284c7' }} /> Trauma
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
