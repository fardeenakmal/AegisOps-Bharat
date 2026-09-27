import React, { useState } from 'react';
import {
  Hospital as HospIcon,
  Activity,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
  Users,
  Clock,
  ShieldAlert,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { updateHospitalCapacity } from '../services/api';

interface HospitalTriagePanelProps {
  hospitals: any[];
  onCapacityUpdated: () => void;
}

export const HospitalTriagePanel: React.FC<HospitalTriagePanelProps> = ({
  hospitals,
  onCapacityUpdated
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    hospitals[0]?.id || ''
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // If selectedHospitalId is empty or not found, default to first hospital
  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAdjustBed = async (type: 'availableBeds' | 'availableIcuBeds', delta: number) => {
    if (!selectedHospital) return;
    setIsUpdating(true);
    try {
      const currentVal = selectedHospital[type] ?? 50;
      const newVal = Math.max(0, currentVal + delta);
      await updateHospitalCapacity(selectedHospital.id, {
        [type]: newVal
      });
      showToast(`${selectedHospital.name}: ${type === 'availableBeds' ? 'General Beds' : 'ICU Beds'} adjusted to ${newVal}`);
      onCapacityUpdated();
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleMCI = async () => {
    if (!selectedHospital) return;
    setIsUpdating(true);
    try {
      const newMci = !selectedHospital.massCasualtyMode;
      await updateHospitalCapacity(selectedHospital.id, {
        massCasualtyMode: newMci
      });
      showToast(newMci ? `🚨 MASS CASUALTY PROTOCOL ACTIVATED for ${selectedHospital.name}` : `MCI Protocol Deactivated for ${selectedHospital.name}`);
      onCapacityUpdated();
    } catch (err: any) {
      showToast(`MCI toggle failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!selectedHospital) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          margin: '20px 0'
        }}
      >
        <HospIcon size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Connecting to OpenStreetMap Overpass Emergency Registry...
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          Harvesting real trauma centers and hospital infrastructure for the active Indian sector.
        </div>
      </div>
    );
  }

  const totalBeds = selectedHospital.totalBeds || 500;
  const availBeds = selectedHospital.availableBeds ?? 120;
  const totalIcu = selectedHospital.totalIcuBeds || 80;
  const availIcu = selectedHospital.availableIcuBeds ?? 15;

  const bedOccupancy = Math.min(100, Math.max(0, Math.round(((totalBeds - availBeds) / totalBeds) * 100)));
  const icuOccupancy = Math.min(100, Math.max(0, Math.round(((totalIcu - availIcu) / totalIcu) * 100)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0 30px' }}>
      {/* Toast Notification */}
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
          <CheckCircle2 size={15} color="#38bdf8" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Hospital Selector */}
      <div
        className="vercel-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="glass-icon-box md" style={{ color: '#38bdf8' }}>
              <HospIcon size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  Hospital Surge Capacity & Emergency Trauma Radar
                </h2>
                <span className="badge badge-info" style={{ fontSize: 9, padding: '1px 5px' }}>
                  REAL OSM GIS FACILITIES ({hospitals.length})
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Real-time bed availability & casualty triage load balancing across district healthcare grids
              </p>
            </div>
          </div>

          <button
            onClick={onCapacityUpdated}
            disabled={isUpdating}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh Hospital Capacities"
          >
            <Activity size={12} className={isUpdating ? 'spin-anim' : ''} color="#38bdf8" />
            <span>{isUpdating ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Facility Selector */}
        <select
          value={selectedHospital.id}
          onChange={(e) => setSelectedHospitalId(e.target.value)}
          className="form-select"
          style={{
            width: '100%',
            fontSize: 12,
            height: 36,
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)'
          }}
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} &bull; {h.availableBeds ?? 100} Beds Available ({h.address || 'Emergency Unit'})
            </option>
          ))}
        </select>
      </div>

      {/* Hospital Overview Grid */}
      <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
        {/* Left: Capacity Gauges & MCI Mode */}
        <div
          className="vercel-card"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedHospital.name}
                </h3>
                <span className="badge badge-info" style={{ fontSize: 10 }}>
                  Level 1 Trauma Apex
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} color="var(--text-muted)" />
                <span>{selectedHospital.address || 'Emergency Medical Corridor'}</span>
                {selectedHospital.latitude && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    ({selectedHospital.latitude.toFixed(4)}°N, {selectedHospital.longitude.toFixed(4)}°E)
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleToggleMCI}
              className={`btn ${selectedHospital.massCasualtyMode ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ShieldAlert size={13} />
              {selectedHospital.massCasualtyMode ? 'MCI PROTOCOL ACTIVE' : 'ACTIVATE MCI SURGE'}
            </button>
          </div>

          {/* General Beds Occupancy */}
          <div
            style={{
              padding: 12,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 6
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                <span>General Emergency Beds</span>
                <span className="num-tabular" style={{ color: bedOccupancy > 85 ? '#f85149' : '#10b981', fontWeight: 700 }}>
                  {availBeds} Available ({100 - bedOccupancy}%)
                </span>
              </div>
              <div className="num-tabular" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Occupancy: {totalBeds - availBeds} in-use / {totalBeds} total
              </div>
            </div>

            <div style={{ width: '100%', height: 6, background: 'var(--bg-active)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${bedOccupancy}%`,
                  height: '100%',
                  background: bedOccupancy > 85 ? '#ef4444' : bedOccupancy > 70 ? '#f59e0b' : '#10b981',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableBeds', -1)}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: 11, flex: 1, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                title="Register 1 incoming patient intake"
              >
                <Minus size={12} /> Patient Intake (-1)
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableBeds', 1)}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: 11, flex: 1, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                title="Register 1 patient discharge or transfer"
              >
                <Plus size={12} /> Discharge (+1)
              </button>
            </div>
          </div>

          {/* ICU Beds Occupancy */}
          <div
            style={{
              padding: 12,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 6
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                <span>Intensive Care Unit (ICU) Beds</span>
                <span className="num-tabular" style={{ color: icuOccupancy > 85 ? '#f85149' : '#38bdf8', fontWeight: 700 }}>
                  {availIcu} Available ({100 - icuOccupancy}%)
                </span>
              </div>
              <div className="num-tabular" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Critical Care: {totalIcu - availIcu} in-use / {totalIcu} total
              </div>
            </div>

            <div style={{ width: '100%', height: 6, background: 'var(--bg-active)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${icuOccupancy}%`,
                  height: '100%',
                  background: icuOccupancy > 85 ? '#ef4444' : icuOccupancy > 70 ? '#f59e0b' : '#38bdf8',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableIcuBeds', -1)}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: 11, flex: 1, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                title="Register 1 emergency ICU admission"
              >
                <Minus size={12} /> ICU Intake (-1)
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableIcuBeds', 1)}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: 11, flex: 1, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                title="Register 1 ICU discharge or step-down"
              >
                <Plus size={12} /> ICU Discharge (+1)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Hospital Contact & Sector Facility Registry */}
        <div
          className="vercel-card"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {/* Quick Contact & Dispatch Hub */}
          <div
            style={{
              padding: 12,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Emergency Ambulance Dispatch Link
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={13} color="#10b981" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedHospital.contactPhone || '+91-108'}
                </span>
              </div>
              <a
                href={`tel:${selectedHospital.contactPhone || '108'}`}
                className="btn btn-primary"
                style={{ fontSize: 10, padding: '3px 8px', height: 24, textDecoration: 'none' }}
              >
                Dial Hotline
              </a>
            </div>
          </div>

          {/* Regional Hospital Grid Overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto', maxHeight: 280 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Jurisdiction Facilities ({hospitals.length})
            </div>

            {hospitals.map((h) => {
              const isSelected = h.id === selectedHospital.id;
              const hBeds = h.totalBeds || 400;
              const hAvail = h.availableBeds ?? 100;
              const pct = Math.round(((hBeds - hAvail) / hBeds) * 100);

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-default)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</span>
                    <span className="num-tabular" style={{ fontSize: 10, fontWeight: 700, color: pct > 85 ? '#ef4444' : '#10b981' }}>
                      {hAvail} Beds
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
                    <span>{h.address || 'Metropolitan Sector'}</span>
                    <span className="num-tabular">{pct}% Occupied</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
