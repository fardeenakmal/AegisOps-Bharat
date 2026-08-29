import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Resource, Hospital, PredictionAlert } from '../types';
import { fetchLiveWeather, reverseGeocode } from '../services/api';
import { CloudRain, Wind, Gauge, Compass, Activity, MapPin, RefreshCw } from 'lucide-react';

interface LiveMapProps {
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  predictions: PredictionAlert[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  activeZone?: string;
}

const SECTOR_COORDINATES: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  'zone-ndma-in': { lat: 21.5, lng: 79.0, zoom: 5, name: 'All Regions (Indian Subcontinent & Global)' },
  'ALL': { lat: 21.5, lng: 79.0, zoom: 5, name: 'All Regions (Indian Subcontinent & Global)' },
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
  selectedIncident,
  onSelectIncident,
  activeZone = 'zone-ndma-in'
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Initialize Leaflet Map in pure Light Mode
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialSector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-ndma-in'];
      const map = L.map(mapContainerRef.current, {
        center: [initialSector.lat, initialSector.lng],
        zoom: initialSector.zoom,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Light Mode OpenStreetMap Tile Layer (Always Light Mode)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc'
      }).addTo(map);

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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: #0f172a;">
              <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">
                📍 Verified Location
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #0f172a; line-height: 1.3;">${geo.displayName}</div>
              <div style="font-size: 10px; margin-top: 4px; color: #64748b; font-family: monospace;">
                ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
              </div>
              <div style="margin-top: 8px; padding: 6px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 11px; color: #166534;">
                🌤️ <b>${weather.temperatureCelsius}°C</b> (${weather.weatherDescription}) &nbsp;|&nbsp; 💨 <b>${weather.windSpeedKmh} km/h</b> &nbsp;|&nbsp; 🌧️ <b>${weather.precipitationMmHr} mm/h</b>
              </div>
            </div>
          `);
        } catch (err: any) {
          popup.setContent(`
            <div style="font-size:11px; color:#0f172a;">
              <b>GPS Coordinates</b>: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
            </div>
          `);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Sector Navigation: Pan / Zoom when sector changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const sector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-ndma-in'];
    map.flyTo([sector.lat, sector.lng], sector.zoom, { duration: 1.0 });

    // Fetch live weather for the sector center
    fetchSectorWeather(sector.lat, sector.lng);
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

  // Periodic weather refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const sector = SECTOR_COORDINATES[activeZone] || SECTOR_COORDINATES['zone-ndma-in'];
      fetchSectorWeather(sector.lat, sector.lng);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeZone]);

  // Update Markers & Threat Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 220px; color: #0f172a;">
          <div style="font-size: 10px; font-weight: 700; color: #dc2626; text-transform: uppercase;">⚠️ ${pred.riskType}</div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin: 3px 0;">${pred.title}</div>
          <p style="font-size: 11px; color: #475569; margin: 4px 0;">${pred.summary}</p>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Risk Score: <b style="color:#dc2626;">${pred.riskScore}/100</b> (${pred.severityLabel})</div>
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 230px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: #64748b; font-family: monospace;">${inc.trackingCode}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${markerColor}; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
              ${inc.severityLabel} (${inc.severityScore.toFixed(0)})
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px;">${inc.title}</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">📍 ${inc.address}</div>
          ${
            isUsgs
              ? `<div style="font-size: 10px; padding: 4px 6px; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; color: #0369a1;">
                  📡 <b>Source: USGS Global Seismic Network</b> &bull; Real Event
                </div>`
              : `<div style="font-size: 10px; padding: 4px 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; color: #475569;">
                  👥 Trapped: <b>${inc.estimatedTrapped}</b> &bull; Casualties: <b>${inc.estimatedCasualties}</b> &bull; Reports: <b>${inc.reportCount}</b>
                </div>`
          }
        </div>
      `);

      layerGroup.addLayer(marker);
    });

    // 3. Plot Real Hospitals
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 210px; color: #0f172a;">
          <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">🏥 Level-${hosp.traumaCenterLevel} Trauma Center</div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin: 2px 0;">${hosp.name}</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">📍 ${hosp.address}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
            <div style="background: #e0f2fe; padding: 4px 6px; border-radius: 4px; border: 1px solid #bae6fd;">
              Beds: <b>${hosp.availableBeds}/${hosp.totalBeds}</b>
            </div>
            <div style="background: #e0f2fe; padding: 4px 6px; border-radius: 4px; border: 1px solid #bae6fd;">
              ICU: <b>${hosp.availableIcuBeds}/${hosp.totalIcuBeds}</b>
            </div>
          </div>
        </div>
      `);

      layerGroup.addLayer(hospMarker);
    });

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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; min-width: 200px; color: #0f172a;">
          <div style="font-size: 10px; font-weight: 700; color: ${isAvailable ? '#059669' : '#d97706'}; text-transform: uppercase;">
            ${res.status}
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${res.callSign}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">Base: ${res.baseStationName}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Crew: ${res.crewCount} &bull; Radio: ${res.contactRadio || 'VHF TAC'}</div>
        </div>
      `);

      layerGroup.addLayer(resMarker);
    });

    // Auto Fly to selected incident
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 10, { duration: 1.2 });
    }
  }, [incidents, resources, hospitals, predictions, selectedIncident]);

  return (
    <div className="vercel-panel" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#f8fafc' }} />

      {/* Light-Themed Clean Weather Radar HUD */}
      {liveWeather && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 400,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CloudRain size={16} color="#0284c7" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                {liveWeather.temperatureCelsius}°C &bull; {liveWeather.weatherDescription}
              </div>
              <div style={{ fontSize: 9, color: '#64748b' }}>
                Open-Meteo Live Atmospheric Feed
              </div>
            </div>
          </div>

          <div style={{ height: 18, width: 1, background: 'rgba(0, 0, 0, 0.1)' }} />

          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#334155' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Wind size={12} color="#0284c7" /> {liveWeather.windSpeedKmh} km/h
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <CloudRain size={12} color="#2563eb" /> {liveWeather.precipitationMmHr} mm/h
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Gauge size={12} color="#d97706" /> {liveWeather.surfacePressureHpa} hPa
            </span>
          </div>

          {/* Manual Weather Refresh Button */}
          <button
            onClick={() => fetchSectorWeather()}
            disabled={weatherLoading}
            className="btn btn-ghost"
            title="Refresh Live Weather"
            style={{ padding: 4, marginLeft: 2 }}
          >
            <RefreshCw size={12} className={weatherLoading ? 'spin-anim' : ''} color="#0284c7" />
          </button>
        </div>
      )}

      {/* Light-Themed Minimalist Map Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          gap: 12,
          fontSize: 11,
          fontWeight: 600,
          color: '#334155',
          zIndex: 400,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} /> Critical
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} /> High
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} /> NDRF / Active Fleet
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#0284c7' }} /> AIIMS / Trauma Center
        </span>
      </div>
    </div>
  );
};
