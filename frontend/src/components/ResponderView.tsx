import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  CheckSquare,
  Square,
  Navigation,
  CheckCircle,
  AlertOctagon,
  Clock,
  Radio,
  FileCheck,
  Activity,
  Send,
  Route,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { Resource, Incident } from '../types';
import { updateResourceStatus, fetchTacticalRoute } from '../services/api';
import { offlineStorageService } from '../services/offlineStorageService';

interface ResponderViewProps {
  resources: Resource[];
  incidents: Incident[];
  onStatusUpdated: () => void;
}

export const ResponderView: React.FC<ResponderViewProps> = ({
  resources,
  incidents,
  onStatusUpdated
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(resources[0]?.id || 'res-amb-1');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [responderNotes, setResponderNotes] = useState('');
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const currentUnit = resources.find((r) => r.id === selectedUnitId) || resources[0];

  const activeIncident = incidents.find(
    (i) => i.status === 'DISPATCHED' || i.status === 'ON_SCENE'
  );

  React.useEffect(() => {
    if (!currentUnit || !activeIncident) {
      setActiveRoute(null);
      return;
    }
    const loadRoute = async () => {
      try {
        const r = await fetchTacticalRoute(
          currentUnit.latitude,
          currentUnit.longitude,
          activeIncident.latitude,
          activeIncident.longitude
        );
        setActiveRoute(r);
      } catch (err) {
        console.warn('[Tactical Route Fetch Error]', err);
      }
    };
    loadRoute();
  }, [currentUnit?.latitude, currentUnit?.longitude, activeIncident?.latitude, activeIncident?.longitude]);

  const toggleChecklist = (item: string) => {
    const next = new Set(completedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setCompletedItems(next);
  };

  const handleStatusChange = async (status: string) => {
    if (!currentUnit) return;
    setUpdating(true);
    try {
      const { isOfflineQueued } = await offlineStorageService.queueOrExecute(
        'UPDATE_RESPONDER_STATUS',
        { id: currentUnit.id, status: { status, notes: responderNotes || undefined } },
        () => updateResourceStatus(currentUnit.id, { status, notes: responderNotes || undefined })
      );

      if (isOfflineQueued) {
        showToast(`Offline Mode: Status update for ${currentUnit.callSign} stored locally in IndexedDB.`);
      } else {
        showToast(`Unit ${currentUnit.callSign} updated to ${status}`);
      }
      onStatusUpdated();
    } catch (e: any) {
      showToast(`Update failed: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const defaultChecklist = [
    'Emergency beacon & radio transponder active',
    'Life support monitors / pumps calibrated',
    'Heavy hydraulic cutter / extrication tools ready',
    'Paramedic trauma kits & burn dressings prepped',
    'Personnel PPE & vapor respirator checked'
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '10px 4px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid #38bdf8',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <CheckCircle size={15} color="#38bdf8" />
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Unit Selector Header */}
      <div
        className="vercel-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="glass-icon-box md" style={{ color: '#38bdf8' }}>
              <Truck size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  Field Responder Tactical View
                </h3>
                <span className="badge badge-info" style={{ fontSize: 9, padding: '1px 5px' }}>QRF SQUAD</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assigned Quick Reaction Force (QRF)</span>
            </div>
          </div>

          <button
            onClick={onStatusUpdated}
            disabled={updating}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh Field Units"
          >
            <Activity size={12} className={updating ? 'spin-anim' : ''} color="#38bdf8" />
            <span>{updating ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Full-width Responsive Unit Dropdown */}
        <select
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          className="form-select"
          style={{ width: '100%', fontSize: 12, height: 36 }}
        >
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.callSign} &bull; {r.type} ({r.status})
            </option>
          ))}
        </select>
      </div>

      {currentUnit && (
        <div className="vercel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Unit Status Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUnit.callSign}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Base: {currentUnit.baseStationName}
                </div>
              </div>

              <span
                className={`badge ${
                  currentUnit.status === 'AVAILABLE'
                    ? 'badge-success'
                    : currentUnit.status === 'DISPATCHED'
                    ? 'badge-medium'
                    : 'badge-critical'
                }`}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                <span className="badge-dot" />
                STATUS: {currentUnit.status}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio size={12} color="#38bdf8" />
              <span>TAC Radio:</span>
              <span className="num-tabular" style={{ color: '#38bdf8', fontWeight: 600 }}>{currentUnit.contactRadio || 'VHF 156.800 MHz'}</span>
              <span>&bull; Crew: <b style={{ color: 'var(--text-primary)' }}>{currentUnit.crewCount} Personnel</b></span>
            </div>
          </div>

          {/* Active Mission Task Brief */}
          <div
            style={{
              background: 'var(--bg-surface)',
              padding: 14,
              borderRadius: 6,
              border: '1px solid var(--border-default)'
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d29922', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Navigation size={12} /> Active Mission Dispatch Brief
            </div>
            {activeIncident ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeIncident.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  📍 Destination: <b style={{ color: 'var(--text-secondary)' }}>{activeIncident.address}</b>
                </div>

                {activeRoute && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <span className="num-tabular" style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '3px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Route size={12} /> {activeRoute.durationMinutes} min Road Transit &bull; {(activeRoute.distanceMeters / 1000).toFixed(1)} km
                    </span>
                    {activeRoute.isImpassableDueToFlood && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#f85149', background: 'rgba(248, 81, 73, 0.15)', border: '1px solid rgba(248, 81, 73, 0.3)', padding: '3px 8px', borderRadius: 4 }}>
                        ⚠️ Flood Detour Active
                      </span>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 11, color: '#f85149', background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}>
                  ⚠️ Reported Casualties: <b className="num-tabular">{activeIncident.estimatedCasualties}</b> &bull; Trapped: <b className="num-tabular">{activeIncident.estimatedTrapped}</b>
                </div>

                {/* Tactical Turn-by-Turn Driving Directions */}
                {activeRoute && activeRoute.turnByTurnInstructions?.length > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '10px',
                      background: 'var(--bg-card)',
                      borderRadius: 4,
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Navigation size={11} /> Turn-by-Turn Transit Maneuvers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 110, overflowY: 'auto' }}>
                      {activeRoute.turnByTurnInstructions.map((step: string, idx: number) => (
                        <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span className="num-tabular" style={{ color: '#38bdf8', fontWeight: 600, minWidth: 16 }}>{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    {activeRoute.hazardWarnings?.map((w: string, i: number) => (
                      <div key={i} style={{ fontSize: 10, color: '#f85149', background: 'rgba(248, 81, 73, 0.1)', padding: '3px 6px', borderRadius: 4, marginTop: 2 }}>
                        {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>No active dispatch task assigned. Standing by on primary radio channel.</p>
            )}
          </div>

          {/* Equipment & Safety Protocol Checklist */}
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileCheck size={12} color="#38bdf8" /> Safety Protocol Checklist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {defaultChecklist.map((item, idx) => {
                const isChecked = completedItems.has(item);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleChecklist(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: isChecked ? 'rgba(46, 160, 67, 0.1)' : 'var(--bg-surface)',
                      border: isChecked ? '1px solid rgba(46, 160, 67, 0.4)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: isChecked ? '#3fb950' : 'var(--text-secondary)',
                      minHeight: 38,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isChecked ? <CheckSquare size={15} color="#3fb950" /> : <Square size={15} color="var(--text-muted)" />}
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Status Action Buttons (Responsive Grid) */}
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
              Update Squad Status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => handleStatusChange('DISPATCHED')}
                disabled={updating}
                className="btn btn-secondary"
                style={{
                  padding: '10px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  borderColor: currentUnit.status === 'DISPATCHED' ? '#d29922' : 'var(--border-default)',
                  color: currentUnit.status === 'DISPATCHED' ? '#d29922' : 'var(--text-primary)',
                  background: currentUnit.status === 'DISPATCHED' ? 'rgba(210, 153, 34, 0.15)' : 'var(--bg-surface)'
                }}
              >
                🚨 En Route
              </button>
              <button
                onClick={() => handleStatusChange('ON_SCENE')}
                disabled={updating}
                className="btn btn-secondary"
                style={{
                  padding: '10px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  borderColor: currentUnit.status === 'ON_SCENE' ? '#f85149' : 'var(--border-default)',
                  color: currentUnit.status === 'ON_SCENE' ? '#f85149' : 'var(--text-primary)',
                  background: currentUnit.status === 'ON_SCENE' ? 'rgba(248, 81, 73, 0.15)' : 'var(--bg-surface)'
                }}
              >
                📍 On Scene
              </button>
              <button
                onClick={() => handleStatusChange('AVAILABLE')}
                disabled={updating}
                className="btn btn-primary"
                style={{ padding: '10px 6px', fontSize: 11, borderRadius: 6 }}
              >
                ✅ Ready / Clear
              </button>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11 }}>On-Scene Tactical Notes</label>
              <textarea
                value={responderNotes}
                onChange={(e) => setResponderNotes(e.target.value)}
                placeholder="e.g. 4 citizens safely extracted from basement. Handed over to Medic squad."
                className="form-input"
                rows={2}
                style={{ resize: 'none', fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
