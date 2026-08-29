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
  Send
} from 'lucide-react';
import { Resource, Incident } from '../types';
import { updateResourceStatus } from '../services/api';

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
  const [updating, setUpdating] = useState(false);

  const currentUnit = resources.find((r) => r.id === selectedUnitId) || resources[0];

  const activeIncident = incidents.find(
    (i) => i.status === 'DISPATCHED' || i.status === 'ON_SCENE'
  );

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
      await updateResourceStatus(currentUnit.id, {
        status,
        notes: responderNotes || undefined
      });
      alert(`Unit ${currentUnit.callSign} updated to ${status}`);
      onStatusUpdated();
    } catch (e: any) {
      alert(`Update failed: ${e.message}`);
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
      {/* Unit Selector Header */}
      <div
        className="vercel-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Truck size={16} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Field Responder Tactical View</h3>
              <span style={{ fontSize: 10, color: '#737373' }}>Assigned Quick Reaction Force (QRF)</span>
            </div>
          </div>

          <button
            onClick={onStatusUpdated}
            disabled={updating}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11 }}
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
        <div className="vercel-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Unit Status Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{currentUnit.callSign}</div>
                <div style={{ fontSize: 11, color: '#a1a1a1', marginTop: 1 }}>
                  Base: {currentUnit.baseStationName}
                </div>
              </div>

              <span
                className={`badge ${
                  currentUnit.status === 'AVAILABLE'
                    ? 'badge-success'
                    : currentUnit.status === 'DISPATCHED'
                    ? 'badge-high'
                    : 'badge-critical'
                }`}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                <span className="badge-dot" />
                STATUS: {currentUnit.status}
              </span>
            </div>

            <div style={{ fontSize: 11, color: '#737373', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio size={12} color="#38bdf8" />
              <span>TAC Radio:</span>
              <span className="num-tabular" style={{ color: '#38bdf8', fontWeight: 600 }}>{currentUnit.contactRadio || 'VHF 156.800 MHz'}</span>
              <span>&bull; Crew: <b style={{ color: '#ededed' }}>{currentUnit.crewCount} Personnel</b></span>
            </div>
          </div>

          {/* Active Mission Task Brief */}
          <div
            style={{
              background: '#141414',
              padding: 12,
              borderRadius: 6,
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Navigation size={12} /> Active Mission Dispatch Brief
            </div>
            {activeIncident ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                  {activeIncident.title}
                </div>
                <div style={{ fontSize: 11, color: '#a1a1a1' }}>
                  📍 Destination: <b>{activeIncident.address}</b>
                </div>
                <div style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '6px 8px', borderRadius: 4, marginTop: 4 }}>
                  ⚠️ Reported Casualties: <b>{activeIncident.estimatedCasualties}</b> &bull; Trapped: <b>{activeIncident.estimatedTrapped}</b>
                </div>
              </div>
            ) : (
              <p style={{ color: '#737373', fontSize: 12 }}>No active dispatch task assigned. Standing by on primary radio channel.</p>
            )}
          </div>

          {/* Equipment & Safety Protocol Checklist */}
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#737373', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
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
                      background: isChecked ? 'rgba(16, 185, 129, 0.1)' : '#111111',
                      border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: isChecked ? '#6ee7b7' : '#a1a1a1',
                      minHeight: 38
                    }}
                  >
                    {isChecked ? <CheckSquare size={15} color="#10b981" /> : <Square size={15} color="#737373" />}
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Status Action Buttons (Responsive 3-Column Grid) */}
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#737373', fontWeight: 700, marginBottom: 8 }}>
              Update Squad Status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => handleStatusChange('DISPATCHED')}
                disabled={updating}
                className="btn btn-secondary"
                style={{
                  padding: '10px 4px',
                  fontSize: 11,
                  background: currentUnit.status === 'DISPATCHED' ? '#f59e0b' : undefined,
                  color: currentUnit.status === 'DISPATCHED' ? '#000000' : undefined
                }}
              >
                🚨 En Route
              </button>
              <button
                onClick={() => handleStatusChange('ON_SCENE')}
                disabled={updating}
                className="btn btn-secondary"
                style={{
                  padding: '10px 4px',
                  fontSize: 11,
                  background: currentUnit.status === 'ON_SCENE' ? '#ef4444' : undefined,
                  color: currentUnit.status === 'ON_SCENE' ? '#ffffff' : undefined
                }}
              >
                📍 On Scene
              </button>
              <button
                onClick={() => handleStatusChange('AVAILABLE')}
                disabled={updating}
                className="btn btn-primary"
                style={{ padding: '10px 4px', fontSize: 11 }}
              >
                ✅ Ready / Clear
              </button>
            </div>

            <div>
              <label className="form-label">On-Scene Tactical Notes</label>
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
