import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Waves,
  Flame,
  Wind,
  Activity,
  Building,
  AlertTriangle,
  Play,
  Truck,
  CloudRain,
  Trash2,
  CheckCircle,
  Biohazard,
  Train,
  Mountain,
  Zap,
  Sliders,
  Bookmark
} from 'lucide-react';
import { simulatePrediction, clearSimulationDrill, fetchLiveWeather } from '../services/api';

interface PredictionSimulationModalProps {
  onClose: () => void;
  onSimulationCompleted: () => void;
}

const ZONE_COORDINATES: Record<string, { name: string; lat: number; lon: number }> = {
  'zone-ndma-in': { name: 'All India (National Grid)', lat: 22.0000, lon: 78.9629 },
  'zone-mh-mum': { name: 'Mumbai Metro (BMC Sector)', lat: 19.0760, lon: 72.8777 },
  'zone-dl-ncr': { name: 'Delhi NCR (DDMA Sector)', lat: 28.6139, lon: 77.2090 },
  'zone-ka-blr': { name: 'Bengaluru Urban (BBMP Sector)', lat: 12.9716, lon: 77.5946 },
  'zone-tn-chn': { name: 'Chennai Metro (GCC Sector)', lat: 13.0827, lon: 80.2707 },
  'zone-od-bbs': { name: 'Odisha Coastal (OSDMA Sector)', lat: 20.2961, lon: 85.8245 },
  'zone-wb-kol': { name: 'Kolkata Emergency (KMC Sector)', lat: 22.5726, lon: 88.3639 }
};

interface DisasterPreset {
  id: string;
  name: string;
  riskType: string;
  zoneId: string;
  badge: string;
  description: string;
  windSpeedKmh?: number;
  precipitationMmHr?: number;
  riverGaugeSurgePercent?: number;
  earthquakeMagnitude?: number;
  hypocenterDepthKm?: number;
  estimatedCasualties: number;
  estimatedTrapped: number;
}

const PRESETS: DisasterPreset[] = [
  {
    id: 'mumbai-flood',
    name: 'Mithi River Cloudburst & Flash Inundation',
    riskType: 'FLOOD',
    zoneId: 'zone-mh-mum',
    badge: 'Hydro / Monsoonal',
    description: 'Catastrophic 140 mm/hr cloudburst causing Mithi River to breach embankments. Lowlands in Kurla, Sion, and Milan subway submerged under 2.2m floodwaters.',
    riverGaugeSurgePercent: 95,
    precipitationMmHr: 140,
    estimatedCasualties: 6,
    estimatedTrapped: 18
  },
  {
    id: 'tauktae-cyclone',
    name: 'Cyclone Tauktae Category-4 Coastal Landfall',
    riskType: 'CYCLONE',
    zoneId: 'zone-mh-mum',
    badge: 'Atmospheric / Gale',
    description: 'Very Severe Cyclonic Storm packing 185 km/h sustained gales and 4m tidal storm surge. Widespread uprooted power pylons and harbour shipping disruptions.',
    windSpeedKmh: 185,
    precipitationMmHr: 90,
    estimatedCasualties: 8,
    estimatedTrapped: 12
  },
  {
    id: 'delhi-earthquake',
    name: 'M6.8 Delhi Ridge Intraplate Earthquake',
    riskType: 'EARTHQUAKE',
    zoneId: 'zone-dl-ncr',
    badge: 'Tectonic / Seismic',
    description: 'Shallow 10 km hypocenter earthquake along the Delhi-Haridwar ridge. Severe shaking across Old Delhi with multi-story unreinforced masonry collapses.',
    earthquakeMagnitude: 6.8,
    hypocenterDepthKm: 10,
    estimatedCasualties: 24,
    estimatedTrapped: 45
  },
  {
    id: 'chembur-gas',
    name: 'Chembur Petrochemical Ammonia Toxic Plume',
    riskType: 'GAS_LEAK',
    zoneId: 'zone-mh-mum',
    badge: 'Industrial / Hazmat',
    description: 'Pressurized storage tank rupture releasing dense anhydrous ammonia vapor cloud. Downwind plume trajectory intersecting dense residential colonies.',
    windSpeedKmh: 28,
    estimatedCasualties: 15,
    estimatedTrapped: 30
  },
  {
    id: 'blr-collapse',
    name: 'Bengaluru Silk Board Metro Girder Collapse',
    riskType: 'STRUCTURAL_COLLAPSE',
    zoneId: 'zone-ka-blr',
    badge: 'Infrastructure / USAR',
    description: 'Heavy pre-cast concrete metro segment failure during rush hour. Multiple vehicles crushed beneath collapsed span with acute entrapment.',
    estimatedCasualties: 12,
    estimatedTrapped: 20
  },
  {
    id: 'odisha-super-cyclone',
    name: 'Odisha Super Cyclone Rapid Coast Ingress',
    riskType: 'CYCLONE',
    zoneId: 'zone-od-bbs',
    badge: 'Coastal / Storm Surge',
    description: 'Catastrophic Super Cyclone with 220 km/h wind gusts and 5.5m seawater inundation across Jagatsinghpur and Kendrapara coastal belts.',
    windSpeedKmh: 220,
    precipitationMmHr: 160,
    estimatedCasualties: 14,
    estimatedTrapped: 35
  }
];

export const PredictionSimulationModal: React.FC<PredictionSimulationModalProps> = ({
  onClose,
  onSimulationCompleted
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'presets'>('presets');
  const [selectedZone, setSelectedZone] = useState<string>('zone-mh-mum');
  const [riskType, setRiskType] = useState<string>('FLOOD');
  const [gaugeSurge, setGaugeSurge] = useState(85);
  const [windSpeed, setWindSpeed] = useState(120);
  const [precipRate, setPrecipRate] = useState(90);
  const [earthquakeMag, setEarthquakeMag] = useState(6.5);
  const [hypoDepth, setHypoDepth] = useState(12);
  const [estimatedCasualties, setEstimatedCasualties] = useState(5);
  const [estimatedTrapped, setEstimatedTrapped] = useState(12);
  const [scenarioName, setScenarioName] = useState('');
  const [injectIncidents, setInjectIncidents] = useState(true);

  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simNotice, setSimNotice] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Fetch live weather baseline for target zone
  useEffect(() => {
    const coords = ZONE_COORDINATES[selectedZone] || ZONE_COORDINATES['zone-mh-mum'];
    fetchLiveWeather(coords.lat, coords.lon)
      .then((data) => {
        setLiveWeather(data);
      })
      .catch(() => {});
  }, [selectedZone]);

  const handleApplyPreset = (preset: DisasterPreset) => {
    setSelectedZone(preset.zoneId);
    setRiskType(preset.riskType);
    setScenarioName(preset.name);
    if (preset.windSpeedKmh) setWindSpeed(preset.windSpeedKmh);
    if (preset.precipitationMmHr) setPrecipRate(preset.precipitationMmHr);
    if (preset.riverGaugeSurgePercent) setGaugeSurge(preset.riverGaugeSurgePercent);
    if (preset.earthquakeMagnitude) setEarthquakeMag(preset.earthquakeMagnitude);
    if (preset.hypocenterDepthKm) setHypoDepth(preset.hypocenterDepthKm);
    setEstimatedCasualties(preset.estimatedCasualties);
    setEstimatedTrapped(preset.estimatedTrapped);
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimError(null);
    setSimNotice(null);
    try {
      const coords = ZONE_COORDINATES[selectedZone] || ZONE_COORDINATES['zone-mh-mum'];
      const res = await simulatePrediction({
        zoneId: selectedZone,
        riskType,
        scenarioName: scenarioName || undefined,
        windSpeedKmh: ['CYCLONE', 'FIRE'].includes(riskType) ? windSpeed : undefined,
        precipitationMmHr: ['FLOOD', 'CYCLONE', 'LANDSLIDE'].includes(riskType) ? precipRate : undefined,
        riverGaugeSurgePercent: riskType === 'FLOOD' ? gaugeSurge : undefined,
        earthquakeMagnitude: riskType === 'EARTHQUAKE' ? earthquakeMag : undefined,
        hypocenterDepthKm: riskType === 'EARTHQUAKE' ? hypoDepth : undefined,
        estimatedCasualties,
        estimatedTrapped,
        injectIncidents,
        latitude: coords.lat,
        longitude: coords.lon
      });
      setSimulationResult(res);
      onSimulationCompleted();
    } catch (e: any) {
      setSimError(e.message || 'Simulation execution notice');
    } finally {
      setSimulating(false);
    }
  };

  const handleClearSimulation = async () => {
    setClearing(true);
    setSimError(null);
    try {
      const res = await clearSimulationDrill();
      setSimNotice(res.message || 'Simulation drill data purged.');
      setSimulationResult(null);
      onSimulationCompleted();
    } catch (e: any) {
      setSimError(e.message || 'Failed to clear simulation drill');
    } finally {
      setClearing(false);
    }
  };

  const hazardClasses = [
    { type: 'FLOOD', label: 'Flash Flood', icon: <Waves size={15} />, color: '#38bdf8' },
    { type: 'CYCLONE', label: 'Severe Cyclone', icon: <Wind size={15} />, color: '#06b6d4' },
    { type: 'EARTHQUAKE', label: 'Earthquake M6+', icon: <Activity size={15} />, color: '#f59e0b' },
    { type: 'STRUCTURAL_COLLAPSE', label: 'Building Collapse', icon: <Building size={15} />, color: '#ef4444' },
    { type: 'GAS_LEAK', label: 'Toxic Gas Leak', icon: <Biohazard size={15} />, color: '#a855f7' },
    { type: 'FIRE', label: 'High-Rise Fire', icon: <Flame size={15} />, color: '#f97316' },
    { type: 'ROAD_ACCIDENT', label: 'Transit / Rail Crash', icon: <Train size={15} />, color: '#ec4899' },
    { type: 'LANDSLIDE', label: 'Debris Landslide', icon: <Mountain size={15} />, color: '#84cc16' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
      }}
      className="modal-overlay"
    >
      <div
        className="modal-card modal-content"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="glass-icon-box md" style={{ color: 'var(--tiranga-saffron)' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Civil Defense Multi-Hazard Simulation Sandbox
                </h3>
                <span className="badge badge-warning" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                  DRILL ENGINE
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Inject synthetic disaster scenarios, trigger MCI surges & test dispatch readiness
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '4px 8px', borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: Presets vs Custom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            gap: 8,
            flexWrap: 'wrap',
            background: 'var(--bg-canvas)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div className="segmented-control" style={{ flex: '1 1 auto', minWidth: 260, maxWidth: 380 }}>
            <button
              onClick={() => setActiveTab('presets')}
              className={`segmented-btn ${activeTab === 'presets' ? 'active' : ''}`}
              style={{ flex: 1, fontSize: 11.5 }}
            >
              <Bookmark size={13} style={{ marginRight: 5 }} /> Civil Defense Presets ({PRESETS.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`segmented-btn ${activeTab === 'custom' ? 'active' : ''}`}
              style={{ flex: 1, fontSize: 11.5 }}
            >
              <Sliders size={13} style={{ marginRight: 5 }} /> Custom Parametric Drill
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={handleClearSimulation}
              disabled={clearing}
              className="btn btn-secondary"
              style={{ fontSize: 11, padding: '4px 10px', height: 28, color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', flexShrink: 0 }}
              title="Purge all simulated drill alerts and distress requests"
            >
              <Trash2 size={12} />
              <span>{clearing ? 'Purging...' : 'Reset Drill Data'}</span>
            </button>
          </div>
        </div>

        {/* Notice Banners */}
        {simNotice && (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(22, 163, 74, 0.95)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{simNotice}</span>
            <button onClick={() => setSimNotice(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {simError && (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{simError}</span>
            <button onClick={() => setSimError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {simulationResult ? (
            /* Simulation Output Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  padding: 16,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span
                    className="badge num-tabular"
                    style={{
                      background: simulationResult.riskScore >= 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: simulationResult.riskScore >= 80 ? '#fca5a5' : '#fcd34d',
                      border: `1px solid ${simulationResult.riskScore >= 80 ? '#ef4444' : '#f59e0b'}`,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    THREAT RATING: {simulationResult.riskScore} / 100 ({simulationResult.severity})
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Feed: <b style={{ color: 'var(--tiranga-saffron)' }}>CIVIL DEFENSE DRILL</b>
                  </span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {simulationResult.title}
                </h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  {simulationResult.summary}
                </p>
              </div>

              {/* Actionable Directives */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8 }}>
                <h5 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tiranga-saffron)', margin: '0 0 8px 0', fontWeight: 700 }}>
                  ⚡ Civil Defense Directives & Standard Operating Procedures
                </h5>
                <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                  {simulationResult.recommendedActions && typeof simulationResult.recommendedActions === 'string'
                    ? JSON.parse(simulationResult.recommendedActions).map((act: string, idx: number) => (
                        <li key={idx}>{act}</li>
                      ))
                    : Array.isArray(simulationResult.recommendedActions)
                    ? simulationResult.recommendedActions.map((act: string, idx: number) => <li key={idx}>{act}</li>)
                    : <li>Mobilize district emergency operations center.</li>}
                </ul>
              </div>

              {/* Pre-positioning Unit Allocations */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 8 }}>
                <h5 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', margin: '0 0 8px 0', fontWeight: 700 }}>
                  🚚 Recommended Fleet Pre-Positioning
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {simulationResult.recommendedPrepositioning && typeof simulationResult.recommendedPrepositioning === 'string'
                    ? JSON.parse(simulationResult.recommendedPrepositioning).map((pos: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: 'var(--bg-canvas)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 12
                          }}
                        >
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                            ● {pos.quantity}x {pos.resourceType || pos.resource_type}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            Station: <b style={{ color: 'var(--text-primary)' }}>{pos.targetStation || 'Central Relief Hub'}</b>
                          </span>
                        </div>
                      ))
                    : <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>NDRF battalions and quick response teams alerted.</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setSimulationResult(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Configure New Drill
                </button>
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  View on GIS Live Map & Queue
                </button>
              </div>
            </div>
          ) : activeTab === 'presets' ? (
            /* Presets Grid */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Select a calibrated high-consequence civil defense drill to inject multi-tier emergency scenarios across Indian disaster sectors:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
                {PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: scenarioName === preset.name ? '1px solid var(--tiranga-saffron)' : '1px solid var(--border-default)',
                      background: scenarioName === preset.name ? 'rgba(255, 153, 51, 0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-info" style={{ fontSize: 9.5 }}>{preset.badge}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {ZONE_COORDINATES[preset.zoneId]?.name?.split(' ')[0]}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {preset.description}
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--text-muted)', paddingTop: 4 }}>
                      <span>Casualties: <b style={{ color: '#ef4444' }}>{preset.estimatedCasualties}</b></span>
                      <span>Trapped: <b style={{ color: '#f59e0b' }}>{preset.estimatedTrapped}</b></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Execution Bar */}
              <div
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 8,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={injectIncidents}
                      onChange={(e) => setInjectIncidents(e.target.checked)}
                      style={{ accentColor: 'var(--tiranga-saffron)', width: 16, height: 16 }}
                    />
                    <span>Spawn Synthetic Citizen Distress Reports in Incident Queue</span>
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Active Scenario: <b style={{ color: 'var(--text-primary)' }}>{scenarioName || 'Custom'}</b>
                  </span>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="btn btn-primary"
                  style={{
                    padding: '11px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #FF9933 0%, #ea580c 100%)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: simulating ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={16} />
                  <span>{simulating ? 'Synthesizing Multi-Hazard Physics & Spawning Incidents...' : 'Execute Selected Drill'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Custom Parametric Simulation Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Target Zone */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Disaster Sector / Command Center
                </label>
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

              {/* Hazard Type Selector */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hazard Phenomenon Classification
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {hazardClasses.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setRiskType(item.type)}
                      style={{
                        padding: '9px 10px',
                        borderRadius: 6,
                        border: riskType === item.type ? `1.5px solid ${item.color}` : '1px solid var(--border-default)',
                        background: riskType === item.type ? `${item.color}15` : 'var(--bg-surface)',
                        color: riskType === item.type ? item.color : 'var(--text-secondary)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {item.icon}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Meteorological Telemetry */}
              {liveWeather && (
                <div style={{ padding: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CloudRain size={13} /> Live Open-Meteo Weather Baseline:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <div>🌡️ Temp: <b style={{ color: 'var(--text-primary)' }}>{liveWeather.temperatureCelsius}°C</b></div>
                    <div>💨 Wind: <b style={{ color: 'var(--text-primary)' }}>{liveWeather.windSpeedKmh} km/h</b></div>
                    <div>🌧️ Rain: <b style={{ color: 'var(--text-primary)' }}>{liveWeather.precipitationMmHr} mm/h</b></div>
                  </div>
                </div>
              )}

              {/* Dynamic Parameter Sliders */}
              {riskType === 'FLOOD' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>River Basin Gauge Surge Telemetry</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{gaugeSurge}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={gaugeSurge}
                    onChange={(e) => setGaugeSurge(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Precipitation Downpour Rate</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{precipRate} mm/hr</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="220"
                    value={precipRate}
                    onChange={(e) => setPrecipRate(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>
              )}

              {riskType === 'CYCLONE' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Atmospheric Gale Velocity (km/h)</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4' }}>{windSpeed} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="240"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#06b6d4' }}
                  />
                </div>
              )}

              {riskType === 'EARTHQUAKE' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Richter Scale Magnitude</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>M{earthquakeMag}</span>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="8.5"
                    step="0.1"
                    value={earthquakeMag}
                    onChange={(e) => setEarthquakeMag(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Hypocenter Depth (km)</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{hypoDepth} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={hypoDepth}
                    onChange={(e) => setHypoDepth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>
              )}

              {/* Casualty & Entrapment Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Estimated Casualties</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{estimatedCasualties}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={estimatedCasualties}
                    onChange={(e) => setEstimatedCasualties(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#ef4444' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Trapped Victims</label>
                    <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{estimatedTrapped}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={estimatedTrapped}
                    onChange={(e) => setEstimatedTrapped(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>
              </div>

              {/* Incident Injection Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={injectIncidents}
                  onChange={(e) => setInjectIncidents(e.target.checked)}
                  style={{ accentColor: 'var(--tiranga-saffron)', width: 16, height: 16 }}
                />
                <span>Spawn Synthetic Citizen Distress Reports in Incident Queue</span>
              </label>

              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="btn btn-primary"
                style={{
                  padding: '11px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #FF9933 0%, #ea580c 100%)',
                  border: 'none',
                  color: '#ffffff'
                }}
              >
                <Play size={16} />
                <span>{simulating ? 'Computing Spatiotemporal Physics...' : 'Execute Parametric Drill'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
