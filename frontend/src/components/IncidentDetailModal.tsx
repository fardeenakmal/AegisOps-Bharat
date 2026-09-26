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
  ChevronRight,
  Navigation,
  Route,
  Waves
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
  const [suggestedUnits, setSuggestedUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [showRoutePreview, setShowRoutePreview] = useState<boolean>(true);

  // Dispatch Form State
  const [ambulancesCount, setAmbulancesCount] = useState(incident.needsSummary?.ambulances || 1);
  const [fireTrucksCount, setFireTrucksCount] = useState(incident.needsSummary?.fireTrucks || 1);
  const [boatsCount, setBoatsCount] = useState(incident.needsSummary?.boats || 0);
  const [sarTeamsCount, setSarTeamsCount] = useState(incident.needsSummary?.sarTeams || 1);
  const [priority, setPriority] = useState(incident.severityLabel === 'CRITICAL' ? 1 : 2);
  const [taskBrief, setTaskBrief] = useState(`Immediate emergency rescue and triage deployment at ${incident.address}`);
  const [dispatching, setDispatching] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

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
        const [weather, hospList, units] = await Promise.all([
          fetchLiveWeather(incident.latitude, incident.longitude),
          fetchHospitals(incident.zoneId),
          fetchSuggestedResources(incident.id)
        ]);
        setSiteWeather(weather);
        setHospitals(hospList);
        setSuggestedUnits(units || []);
        if (units && units.length > 0) {
          setSelectedUnitId(units[0].id);
        }
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
      const targetUnitId = selectedUnitId || suggestedUnits[0]?.id;
      if (targetUnitId) {
        await dispatchResource({
          incidentId: incident.id,
          resourceId: targetUnitId,
          assignedByUserId: 'operator_mumbai',
          customTaskBrief: taskBrief
        });
      }
      showToast('Tactical dispatch completed. Response teams en route.', 'success');
      setTimeout(() => {
        onIncidentUpdated({
          ...incident,
          status: 'DISPATCHED',
          dispatchedAt: new Date().toISOString()
        });
        onClose();
      }, 1000);
    } catch (err: any) {
      showToast(`Dispatch notice: ${err.message}`, 'error');
    } finally {
      setDispatching(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showToast('Override reason is required for legal and audit compliance.', 'warning');
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
      showToast('Operator override recorded and logged into immutable audit trail.', 'success');
      setTimeout(() => {
        onIncidentUpdated(updated);
        onClose();
      }, 1000);
    } catch (err: any) {
      showToast(`Override failed: ${err.message}`, 'error');
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
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {toastMsg && (
          <div
            style={{
              padding: '8px 16px',
              background: toastMsg.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : (toastMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(16, 185, 129, 0.95)'),
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 50,
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <span>{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <span className="num-tabular font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              #{incident.trackingCode}
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
              {incident.severityLabel} (<span className="num-tabular">{incident.severityScore.toFixed(0)}/100</span>)
            </span>
            <span className="badge badge-cyan" style={{ fontSize: 10 }}>{incident.status}</span>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4, flexShrink: 0, height: 26, width: 26 }}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation (Vercel Underline Tabs) */}
        <div
          className="touch-scroll-x tab-underline-group"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            padding: '0 12px',
            gap: 4
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
              className={`tab-underline-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ padding: '9px 12px', fontSize: 12 }}
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
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                  {incident.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <MapPin size={12} color="#38bdf8" />
                  <span>{incident.address}</span>
                  <span className="num-tabular" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
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
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CORROBORATION</div>
                  <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Live Ground Weather: {siteWeather.weatherDescription}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      Open-Meteo Telemetry
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>🌡️ {siteWeather.temperatureCelsius}°C</span>
                    <span>💨 {siteWeather.windSpeedKmh} km/h (Gusts: {siteWeather.windGustsKmh})</span>
                    <span>🌧️ {siteWeather.precipitationMmHr} mm/h</span>
                    <span>📊 {siteWeather.surfacePressureHpa} hPa</span>
                  </div>
                </div>
              )}

              {/* Required Fleet Resources */}
              <div className="vercel-panel" style={{ padding: 12 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="num-tabular" style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>{rep.trackingId}</span>
                        {rep.detectedLanguage && rep.detectedLanguage !== 'en' && (
                          <span className="badge" style={{ background: '#312e81', color: '#c7d2fe', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
                            {rep.detectedLanguage} Vernacular
                          </span>
                        )}
                        {rep.submissionChannel?.includes('VOICE') && (
                          <span className="badge" style={{ background: '#064e3b', color: '#a7f3d0', fontSize: 9, fontWeight: 700 }}>
                            🎙️ Bhashini Voice
                          </span>
                        )}
                      </div>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        Authenticity: {(rep.authenticityScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                      {rep.rawText}
                    </div>

                    {rep.normalizedText && rep.normalizedText !== rep.rawText && (
                      <div style={{ fontSize: 11, color: '#93c5fd', background: 'rgba(30, 58, 138, 0.25)', padding: '5px 8px', borderRadius: 4, lineHeight: 1.4 }}>
                        <b style={{ color: '#60a5fa' }}>EOC Translation:</b> {rep.normalizedText}
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span>Channel: {rep.submissionChannel}</span>
                      <span>{new Date(rep.submittedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  No individual citizen reports linked to this consolidated incident.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TACTICAL FLEET DISPATCH */}
          {activeTab === 'dispatch' && (
            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* OSRM Road-Network Proximity Ranked Units */}
              <div className="vercel-panel" style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Route size={13} /> OSRM Road-Network Ranked Fleet
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    Turn-by-turn road routing & flood clearance verified
                  </span>
                </div>

                {suggestedUnits.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 8 }}>
                    Calculating road routes for available fleet units...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestedUnits.map((u) => {
                      const isSelected = (selectedUnitId || suggestedUnits[0]?.id) === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUnitId(u.id);
                            if (u.routeDetails?.turnByTurnInstructions?.length > 0) {
                              setTaskBrief(
                                `PRIORITY DISPATCH to ${incident.address}. Road Distance: ${(u.distanceMeters / 1000).toFixed(1)} km, Est. Arrival: ${u.etaMinutes} mins.\n• Route: ${u.routeDetails.turnByTurnInstructions.slice(0, 3).join('; ')}`
                              );
                            }
                          }}
                          style={{
                            padding: '8px 10px',
                            background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface)',
                            border: `1px solid ${isSelected ? '#0284c7' : 'var(--border-subtle)'}`,
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="selected_resource"
                              checked={isSelected}
                              onChange={() => setSelectedUnitId(u.id)}
                              style={{ accentColor: '#0284c7' }}
                            />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {u.callSign}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                Base: {u.baseStationName} &bull; Crew: {u.crewCount}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {u.isReroutedForFlood && (
                              <span
                                style={{
                                  fontSize: 9,
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  fontWeight: 600
                                }}
                              >
                                ⚠️ Flood Detour
                              </span>
                            )}
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                                {u.etaMinutes} min ETA
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                {(u.distanceMeters / 1000).toFixed(1)} km road
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Turn-by-Turn Route Preview Drawer */}
              {(() => {
                const curSelected = suggestedUnits.find((u) => u.id === (selectedUnitId || suggestedUnits[0]?.id));
                const instructions: string[] = curSelected?.routeDetails?.turnByTurnInstructions || [];
                if (instructions.length === 0) return null;

                return (
                  <div
                    className="vercel-panel"
                    style={{
                      padding: 10,
                      background: 'var(--bg-surface)',
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Navigation size={11} /> Turn-by-Turn Driving Directions (OSRM)
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        Emergency Siren Transit
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 110, overflowY: 'auto' }}>
                      {instructions.map((step, idx) => (
                        <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                          <span style={{ color: '#38bdf8', fontWeight: 700, minWidth: 16 }}>{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    {curSelected?.routeDetails?.hazardWarnings?.map((w: string, i: number) => (
                      <div key={i} style={{ marginTop: 6, fontSize: 10, color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '3px 6px', borderRadius: 4 }}>
                        {w}
                      </div>
                    ))}
                  </div>
                );
              })()}

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
