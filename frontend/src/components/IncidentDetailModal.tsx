import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Users,
  Shield,
  Truck,
  Flame,
  Droplets,
  Zap,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  CloudRain,
  Wind,
  Gauge,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Incident, IncidentType, SeverityLabel, Dispatch, Hospital } from '../types';
import {
  dispatchResource,
  fetchSuggestedResources,
  operatorOverrideIncident,
  fetchLiveWeather,
  fetchHospitals
} from '../services/api';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
  onIncidentUpdated: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onIncidentUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'dispatch' | 'override'>('overview');
  const [siteWeather, setSiteWeather] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // Dispatch Form State
  const [ambulancesCount, setAmbulancesCount] = useState(incident.needsSummary?.ambulances || 1);
  const [fireTrucksCount, setFireTrucksCount] = useState(incident.needsSummary?.fireTrucks || 1);
  const [boatsCount, setBoatsCount] = useState(incident.needsSummary?.boats || 0);
  const [sarTeamsCount, setSarTeamsCount] = useState(incident.needsSummary?.sarTeams || 1);
  const [priority, setPriority] = useState(incident.severityLabel === 'CRITICAL' ? 1 : 2);
  const [taskBrief, setTaskBrief] = useState(`Immediate emergency rescue and triage deployment at ${incident.address}`);
  const [dispatching, setDispatching] = useState(false);

  // Override Form State
  const [overrideSeverity, setOverrideSeverity] = useState<SeverityLabel>(incident.severityLabel);
  const [overrideScore, setOverrideScore] = useState(incident.severityScore);
  const [overrideStatus, setOverrideStatus] = useState(incident.status);
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    // Fetch live weather at the exact coordinates of this incident
    const loadWeatherAndHospitals = async () => {
      try {
        const [weather, hospList] = await Promise.all([
          fetchLiveWeather(incident.latitude, incident.longitude),
          fetchHospitals(incident.zoneId)
        ]);
        setSiteWeather(weather);
        setHospitals(hospList);
      } catch (e) {
        console.error('Error fetching incident metadata:', e);
      }
    };
    loadWeatherAndHospitals();
  }, [incident.latitude, incident.longitude, incident.zoneId]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    try {
      const suggested = await fetchSuggestedResources(incident.id);
      const targetUnit = suggested[0];
      if (targetUnit) {
        await dispatchResource({
          incidentId: incident.id,
          resourceId: targetUnit.id,
          assignedByUserId: 'operator_mumbai',
          customTaskBrief: taskBrief
        });
      }
      alert(`Tactical dispatch completed. Response teams en route.`);
      onIncidentUpdated({
        ...incident,
        status: 'DISPATCHED',
        dispatchedAt: new Date().toISOString()
      });
      onClose();
    } catch (err: any) {
      alert(`Dispatch notice: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('Override reason is required for legal and audit compliance.');
      return;
    }
    setOverriding(true);
    try {
      const updated = await operatorOverrideIncident(incident.id, {
        actorId: 'operator_mumbai',
        actorName: 'Capt. Rajesh Kadam',
        severityLabel: overrideSeverity,
        severityScore: overrideScore,
        status: overrideStatus,
        overrideReason
      });
      alert('Operator override recorded and logged into immutable audit trail.');
      onIncidentUpdated(updated);
      onClose();
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setOverriding(false);
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
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
      }}
      className="modal-overlay"
    >
      <div
        className="vercel-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#111111',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <span className="num-tabular" style={{ fontSize: 12, fontWeight: 700, color: '#ededed' }}>
              {incident.trackingCode}
            </span>
            <span className="badge badge-low" style={{ fontSize: 10 }}>{incident.type}</span>
            <span
              className={`badge ${
                incident.severityLabel === 'CRITICAL'
                  ? 'badge-critical'
                  : incident.severityLabel === 'HIGH'
                  ? 'badge-high'
                  : 'badge-medium'
              }`}
              style={{ fontSize: 10 }}
            >
              <span className="badge-dot" />
              {incident.severityLabel} ({incident.severityScore.toFixed(0)}/100)
            </span>
            <span className="badge badge-cyan" style={{ fontSize: 10 }}>{incident.status}</span>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation (Touch Scrollable) */}
        <div
          className="touch-scroll-x"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: '#0a0a0a',
            padding: '0 8px',
            gap: 2
          }}
        >
          {[
            { id: 'overview', label: 'Situational Overview' },
            { id: 'reports', label: `Citizen Reports (${incident.reports?.length || incident.reportCount})` },
            { id: 'dispatch', label: 'Tactical Fleet Dispatch' },
            { id: 'override', label: 'Operator Override' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#ffffff' : '#737373',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Title & Address */}
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', lineHeight: 1.3, marginBottom: 4 }}>
                  {incident.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a1a1a1', flexWrap: 'wrap' }}>
                  <MapPin size={12} color="#38bdf8" />
                  <span>{incident.address}</span>
                  <span className="num-tabular" style={{ color: '#737373', fontSize: 10 }}>
                    ({incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E)
                  </span>
                </div>
              </div>

              {/* 4 Metric Stat Cards (Responsive Auto-Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                <div className="vercel-card" style={{ padding: 10 }}>
                  <div style={{ fontSize: 10, color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>EST. TRAPPED</div>
                  <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#fca5a5', marginTop: 2 }}>
                    {incident.estimatedTrapped}
                  </div>
                </div>

                <div className="vercel-card" style={{ padding: 10 }}>
                  <div style={{ fontSize: 10, color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>CASUALTIES</div>
                  <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#fca5a5', marginTop: 2 }}>
                    {incident.estimatedCasualties}
                  </div>
                </div>

                <div className="vercel-card" style={{ padding: 10 }}>
                  <div style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>CORROBORATION</div>
                  <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                    {incident.reportCount} Reports
                  </div>
                </div>

                <div className="vercel-card" style={{ padding: 10 }}>
                  <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>SLA COUNTDOWN</div>
                  <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
                    {incident.slaTargetMinutes}m Target
                  </div>
                </div>
              </div>

              {/* Live Site Weather Radar */}
              {siteWeather && (
                <div
                  className="vercel-card"
                  style={{
                    padding: 10,
                    background: 'rgba(56, 189, 248, 0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CloudRain size={14} color="#38bdf8" />
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff' }}>
                      Live Ground Weather: {siteWeather.weatherDescription}
                    </div>
                    <div style={{ fontSize: 9, color: '#737373', marginLeft: 'auto' }}>
                      Open-Meteo Telemetry
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: '#ededed' }}>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>🌡️ {siteWeather.temperatureCelsius}°C</span>
                    <span>💨 {siteWeather.windSpeedKmh} km/h (Gusts: {siteWeather.windGustsKmh})</span>
                    <span>🌧️ {siteWeather.precipitationMmHr} mm/h</span>
                    <span>📊 {siteWeather.surfacePressureHpa} hPa</span>
                  </div>
                </div>
              )}

              {/* Required Fleet Resources */}
              <div className="vercel-panel" style={{ padding: 12 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#737373', fontWeight: 700, marginBottom: 8 }}>
                  Required Emergency Fleets & Squads
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {incident.needsSummary?.ambulances ? (
                    <span className="badge badge-critical" style={{ fontSize: 11, padding: '3px 8px' }}>
                      🚑 {incident.needsSummary.ambulances} ALS Ambulances
                    </span>
                  ) : null}
                  {incident.needsSummary?.fireTrucks ? (
                    <span className="badge badge-high" style={{ fontSize: 11, padding: '3px 8px' }}>
                      🚒 {incident.needsSummary.fireTrucks} Fire Foam Tenders
                    </span>
                  ) : null}
                  {incident.needsSummary?.boats ? (
                    <span className="badge badge-cyan" style={{ fontSize: 11, padding: '3px 8px' }}>
                      🚤 {incident.needsSummary.boats} Inflatable Rescue Boats
                    </span>
                  ) : null}
                  {incident.needsSummary?.extricationJaws ? (
                    <span className="badge badge-low" style={{ fontSize: 11, padding: '3px 8px' }}>
                      ⚙️ Hydraulic Cutters & Jaws of Life
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CITIZEN REPORTS */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incident.reports && incident.reports.length > 0 ? (
                incident.reports.map((rep) => (
                  <div key={rep.id} className="vercel-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="num-tabular" style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>{rep.trackingId}</span>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        Authenticity: {(rep.authenticityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#ededed', lineHeight: 1.4 }}>{rep.rawText}</p>
                    <div style={{ fontSize: 10, color: '#737373', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span>Channel: {rep.submissionChannel}</span>
                      <span>{new Date(rep.submittedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#737373' }}>
                  No individual citizen reports linked to this consolidated incident.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TACTICAL FLEET DISPATCH */}
          {activeTab === 'dispatch' && (
            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                <div>
                  <label className="form-label">ALS Ambulances</label>
                  <input
                    type="number"
                    min={0}
                    value={ambulancesCount}
                    onChange={(e) => setAmbulancesCount(parseInt(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Fire Foam Trucks</label>
                  <input
                    type="number"
                    min={0}
                    value={fireTrucksCount}
                    onChange={(e) => setFireTrucksCount(parseInt(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Rescue Boats</label>
                  <input
                    type="number"
                    min={0}
                    value={boatsCount}
                    onChange={(e) => setBoatsCount(parseInt(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">NDRF/SAR Squads</label>
                  <input
                    type="number"
                    min={0}
                    value={sarTeamsCount}
                    onChange={(e) => setSarTeamsCount(parseInt(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Tactical Mission Brief for Responders</label>
                <textarea
                  rows={2}
                  value={taskBrief}
                  onChange={(e) => setTaskBrief(e.target.value)}
                  className="form-input"
                  style={{ resize: 'none', fontSize: 12 }}
                />
              </div>

              <button
                type="submit"
                disabled={dispatching}
                className="btn btn-danger"
                style={{ padding: '10px', fontSize: 13, fontWeight: 700, marginTop: 4 }}
              >
                {dispatching ? 'Deploying Squads...' : '🚀 Transmit Tactical Fleet Dispatch'}
              </button>
            </form>
          )}

          {/* TAB 4: OPERATOR OVERRIDE */}
          {activeTab === 'override' && (
            <form onSubmit={handleOverride} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                <div>
                  <label className="form-label">Override Severity</label>
                  <select
                    value={overrideSeverity}
                    onChange={(e) => setOverrideSeverity(e.target.value as SeverityLabel)}
                    className="form-select"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Severity Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(parseFloat(e.target.value) || 0)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Mandatory Legal Audit Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why AI triage output is being manually modified..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="form-input"
                  style={{ resize: 'none', fontSize: 12 }}
                />
              </div>

              <button
                type="submit"
                disabled={overriding}
                className="btn btn-secondary"
                style={{ padding: '10px', fontSize: 12, fontWeight: 600, color: '#fbbf24', borderColor: '#fbbf24' }}
              >
                {overriding ? 'Logging Override...' : '✍️ Apply & Log Operator Override to Audit Trail'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
