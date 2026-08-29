import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Waves,
  Flame,
  Wind,
  CheckCircle,
  Play,
  Layers,
  Truck,
  CloudRain,
  MapPin
} from 'lucide-react';
import { simulatePrediction, fetchLiveWeather } from '../services/api';

interface PredictionSimulationModalProps {
  onClose: () => void;
  onSimulationCompleted: () => void;
}

const ZONE_COORDINATES: Record<string, { name: string; lat: number; lon: number }> = {
  'zone-mh-mum': { name: 'Mumbai Metro (BMC Cell)', lat: 19.0760, lon: 72.8777 },
  'zone-dl-ncr': { name: 'Delhi NCR (DDMA)', lat: 28.6139, lon: 77.2090 },
  'zone-ka-blr': { name: 'Bengaluru Urban (BBMP)', lat: 12.9716, lon: 77.5946 },
  'zone-tn-chn': { name: 'Chennai Metro (GCC Cell)', lat: 13.0827, lon: 80.2707 },
  'zone-od-bbs': { name: 'Odisha Coastal Command (OSDMA)', lat: 20.2961, lon: 85.8245 },
  'zone-wb-kol': { name: 'Kolkata Emergency (KMC Cell)', lat: 22.5726, lon: 88.3639 }
};

export const PredictionSimulationModal: React.FC<PredictionSimulationModalProps> = ({
  onClose,
  onSimulationCompleted
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('zone-mh-mum');
  const [riskType, setRiskType] = useState<'FLOOD_SPREAD' | 'CYCLONE_LANDFALL'>('FLOOD_SPREAD');
  const [gaugeSurge, setGaugeSurge] = useState(65);
  const [windSpeed, setWindSpeed] = useState(70);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Load live weather baseline when zone changes
  useEffect(() => {
    const coords = ZONE_COORDINATES[selectedZone] || ZONE_COORDINATES['zone-mh-mum'];
    fetchLiveWeather(coords.lat, coords.lon)
      .then((data) => {
        setLiveWeather(data);
        if (data.windSpeedKmh) setWindSpeed(Math.round(data.windSpeedKmh));
      })
      .catch((err) => console.error(err));
  }, [selectedZone]);

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const coords = ZONE_COORDINATES[selectedZone] || ZONE_COORDINATES['zone-mh-mum'];
      const res = await simulatePrediction({
        zoneId: selectedZone,
        riskType,
        riverGaugeSurgePercent: riskType === 'FLOOD_SPREAD' ? gaugeSurge : undefined,
        windSpeedKmh: riskType === 'CYCLONE_LANDFALL' ? windSpeed : undefined,
        precipitationMmHr: liveWeather?.precipitationMmHr
      });
      setSimulationResult(res);
      onSimulationCompleted();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      className="modal-overlay"
    >
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 650,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#06b6d4" />
            <h3 style={{ fontSize: 16, color: '#f8fafc' }}>Spatiotemporal AI Hazard Simulation</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {simulationResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-panel" style={{ padding: 16, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="badge badge-critical">THREAT RISK: {simulationResult.riskScore}/100</span>
                  <span style={{ fontSize: 11, color: '#fca5a5' }}>AI Confidence {(simulationResult.confidence * 100).toFixed(0)}%</span>
                </div>
                <h4 style={{ fontSize: 15, color: '#f8fafc', marginBottom: 6 }}>{simulationResult.title}</h4>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.4 }}>{simulationResult.summary}</p>
              </div>

              <div>
                <h5 style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
                  Recommended Tactical Pre-Positioning
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {simulationResult.recommendedPrepositioning?.map((pos: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30, 41, 59, 0.6)', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
                      <span style={{ color: '#67e8f9', fontWeight: 600 }}>🚚 Pre-stage {pos.quantity}x {pos.resourceType}</span>
                      <span style={{ color: '#cbd5e1' }}>At Station: <b>{pos.targetStation}</b></span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
                  Actionable Emergency Directives
                </h5>
                <ul style={{ paddingLeft: 20, fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                  {simulationResult.recommendedActions?.map((act: string, idx: number) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              <button onClick={() => setSimulationResult(null)} className="btn btn-secondary">
                Configure New Simulation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Select Target Zone */}
              <div>
                <label className="form-label">Target Disaster Management Command Sector</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="form-select"
                >
                  {Object.entries(ZONE_COORDINATES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.name} ({val.lat.toFixed(2)}°N, {val.lon.toFixed(2)}°E)
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Atmospheric Baseline Widget */}
              {liveWeather && (
                <div
                  className="glass-panel"
                  style={{
                    padding: 12,
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 8
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CloudRain size={13} /> Live Open-Meteo Telemetry Baseline:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11, color: '#cbd5e1' }}>
                    <div>🌡️ Temp: <b>{liveWeather.temperatureCelsius}°C</b></div>
                    <div>💨 Wind: <b>{liveWeather.windSpeedKmh} km/h</b></div>
                    <div>🌧️ Rain: <b>{liveWeather.precipitationMmHr} mm/h</b></div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Select Hazard Propagation Model</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setRiskType('FLOOD_SPREAD')}
                    className={`btn ${riskType === 'FLOOD_SPREAD' ? 'btn-cyan' : 'btn-secondary'}`}
                    style={{ padding: 12 }}
                  >
                    <Waves size={16} /> Flash Flood Inundation
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskType('CYCLONE_LANDFALL')}
                    className={`btn ${riskType === 'CYCLONE_LANDFALL' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: 12 }}
                  >
                    <Wind size={16} /> Cyclone Storm Surge
                  </button>
                </div>
              </div>

              {riskType === 'FLOOD_SPREAD' ? (
                <div>
                  <label className="form-label">Hydrological River Gauge Surge Telemetry: {gaugeSurge}%</label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={gaugeSurge}
                    onChange={(e) => setGaugeSurge(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Simulates cloudburst discharge into river basin and low-lying transit corridors.
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label">Atmospheric Gale & Cyclone Speed: {windSpeed} km/h</label>
                  <input
                    type="range"
                    min="30"
                    max="220"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Simulates coastal storm surge impact and structural gale loading.
                  </div>
                </div>
              )}

              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="btn btn-cyan"
                style={{ padding: 12, fontSize: 14 }}
              >
                <Play size={16} /> {simulating ? 'Computing Spatiotemporal Vectors...' : 'Execute Predictive Forecast'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
