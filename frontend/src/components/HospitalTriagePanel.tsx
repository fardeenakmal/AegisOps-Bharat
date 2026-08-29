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
  ShieldAlert
} from 'lucide-react';
import { Hospital } from '../types';
import { updateHospitalCapacity } from '../services/api';

interface HospitalTriagePanelProps {
  hospitals: Hospital[];
  onCapacityUpdated: () => void;
}

export const HospitalTriagePanel: React.FC<HospitalTriagePanelProps> = ({
  hospitals,
  onCapacityUpdated
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    hospitals[0]?.id || 'hosp-kem-mum'
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  const handleAdjustBed = async (type: 'availableBeds' | 'availableIcuBeds', delta: number) => {
    if (!selectedHospital) return;
    setIsUpdating(true);
    try {
      const currentVal = selectedHospital[type];
      const newVal = Math.max(0, currentVal + delta);
      await updateHospitalCapacity(selectedHospital.id, {
        [type]: newVal
      });
      onCapacityUpdated();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleMCI = async () => {
    if (!selectedHospital) return;
    setIsUpdating(true);
    try {
      await updateHospitalCapacity(selectedHospital.id, {
        massCasualtyMode: !selectedHospital.massCasualtyMode
      });
      onCapacityUpdated();
    } catch (err: any) {
      alert(`MCI toggle failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!selectedHospital) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#737373' }}>
        No hospital trauma centres available in this jurisdiction.
      </div>
    );
  }

  const bedOccupancy = Math.round(
    ((selectedHospital.totalBeds - selectedHospital.availableBeds) / selectedHospital.totalBeds) * 100
  );
  const icuOccupancy = Math.round(
    ((selectedHospital.totalIcuBeds - selectedHospital.availableIcuBeds) / selectedHospital.totalIcuBeds) * 100
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0 30px' }}>
      {/* Header & Hospital Selector */}
      <div
        className="vercel-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
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
              <HospIcon size={16} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                Hospital Surge Capacity & Inbound Casualty Radar
              </h2>
              <p style={{ fontSize: 10, color: '#737373' }}>
                Real-time bed availability & casualty triage load balancing
              </p>
            </div>
          </div>

          <button
            onClick={onCapacityUpdated}
            disabled={isUpdating}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11 }}
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
          style={{ width: '100%', fontSize: 12, height: 36 }}
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} (Level {h.traumaCenterLevel} Trauma)
            </option>
          ))}
        </select>
      </div>

      {/* Hospital Overview Grid */}
      <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
        {/* Left: Capacity Gauges & MCI Mode */}
        <div className="vercel-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  {selectedHospital.name}
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: 10 }}>Level {selectedHospital.traumaCenterLevel} Trauma</span>
              </div>
              <p style={{ fontSize: 11, color: '#a1a1a1', marginTop: 2 }}>📍 {selectedHospital.address}</p>
            </div>

            <button
              onClick={handleToggleMCI}
              className={`btn ${selectedHospital.massCasualtyMode ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600 }}
            >
              <ShieldAlert size={13} />
              {selectedHospital.massCasualtyMode ? 'MCI PROTOCOL ACTIVE' : 'ACTIVATE MCI SURGE'}
            </button>
          </div>

          {/* General Beds Occupancy */}
          <div className="vercel-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#ffffff' }}>
                <span>General Emergency Beds</span>
                <span className="num-tabular" style={{ color: bedOccupancy > 85 ? '#f87171' : '#34d399' }}>
                  {selectedHospital.availableBeds} Available ({100 - bedOccupancy}%)
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#737373' }}>
                Capacity: {selectedHospital.totalBeds - selectedHospital.availableBeds} occupied / {selectedHospital.totalBeds} total
              </div>
            </div>

            <div style={{ width: '100%', height: 6, background: '#1c1c1c', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${bedOccupancy}%`,
                  height: '100%',
                  background: bedOccupancy > 85 ? '#ef4444' : bedOccupancy > 70 ? '#f59e0b' : '#10b981',
                  borderRadius: 3
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableBeds', -1)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: 10, flex: 1 }}
              >
                <Minus size={11} /> 1 Intake
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableBeds', 1)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: 10, flex: 1 }}
              >
                <Plus size={11} /> 1 Discharge
              </button>
            </div>
          </div>

          {/* ICU Beds Occupancy */}
          <div className="vercel-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#ffffff' }}>
                <span>Intensive Care Unit (ICU) Beds</span>
                <span className="num-tabular" style={{ color: icuOccupancy > 85 ? '#f87171' : '#38bdf8' }}>
                  {selectedHospital.availableIcuBeds} Available ({100 - icuOccupancy}%)
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#737373' }}>
                Critical Care: {selectedHospital.totalIcuBeds - selectedHospital.availableIcuBeds} in-use / {selectedHospital.totalIcuBeds} total
              </div>
            </div>

            <div style={{ width: '100%', height: 6, background: '#1c1c1c', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${icuOccupancy}%`,
                  height: '100%',
                  background: icuOccupancy > 85 ? '#ef4444' : icuOccupancy > 70 ? '#f59e0b' : '#38bdf8',
                  borderRadius: 3
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableIcuBeds', -1)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: 10, flex: 1 }}
              >
                <Minus size={11} /> 1 ICU Intake
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleAdjustBed('availableIcuBeds', 1)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: 10, flex: 1 }}
              >
                <Plus size={11} /> 1 ICU Discharge
              </button>
            </div>
          </div>
        </div>

        {/* Right: Inbound Casualty Triage Forecast */}
        <div className="vercel-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#ededed', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={13} color="#38bdf8" /> Inbound Casualty Stream & Triage Radar
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedHospital.inboundCasualtyForecast && selectedHospital.inboundCasualtyForecast.expectedCount > 0 ? (
              <div className="vercel-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '3px solid #ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>🚨 Critical Red Triage Surge</span>
                  <span className="badge badge-critical" style={{ fontSize: 9 }}>ETA: ~8-12 mins</span>
                </div>
                <div style={{ fontSize: 11, color: '#fca5a5' }}>
                  Inbound Traumatic Inflow: <b>{selectedHospital.inboundCasualtyForecast.expectedCount} Patients</b> ({selectedHospital.inboundCasualtyForecast.severityMix.critical} Critical, {selectedHospital.inboundCasualtyForecast.severityMix.urgent} Urgent).
                </div>
                <div style={{ fontSize: 10, color: '#737373', marginTop: 2 }}>
                  Trauma Bay 1 & 2 Prepared &bull; Blood Bank Alerted (O-Negative Units Prepped)
                </div>
              </div>
            ) : (
              <div className="vercel-card" style={{ padding: 16, textAlign: 'center', color: '#737373' }}>
                <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: 12, color: '#ededed', fontWeight: 500 }}>Trauma Bays Clear & Ready</div>
                <div style={{ fontSize: 10, color: '#737373', marginTop: 2 }}>No active mass-casualty inbound ambulance squads reported.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
