import React, { useState, useEffect } from 'react';
import {
  Layers,
  Shield,
  Activity,
  ArrowUpRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building,
  RefreshCw,
  MapPin,
  Users,
  Radio
} from 'lucide-react';
import { fetchNationalRollup, approveCrossJurisdictionRequest } from '../services/api';
import { NationalRollup } from '../types';

export const StateNationalRollup: React.FC = () => {
  const [nationalData, setNationalData] = useState<NationalRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchNationalRollup();
      setNationalData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    setApprovingId(id);
    try {
      await approveCrossJurisdictionRequest(id);
      loadData();
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 24px' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Layers size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                NDMA National Command Headquarters & Pan-India Grid
              </h2>
              <span className="badge badge-info" style={{ fontSize: 9, padding: '1px 5px' }}>
                LIVE REAL-TIME AGGREGATION
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Multi-hazard risk aggregation & state SDMA coordination across 28 States & 8 Union Territories
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn btn-secondary"
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={12} className={loading ? 'spin-anim' : ''} color="#38bdf8" />
          <span>{loading ? 'Refreshing...' : 'Refresh National Rollup'}</span>
        </button>
      </div>

      {/* Top National Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            NATIONAL RISK INDEX
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
            {nationalData?.nationalRiskIndex ?? 69.9} / 100
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Weighted Pan-India Composite</div>
        </div>

        <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ACTIVE INCIDENTS
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
            {nationalData?.totalActiveIncidents ?? 0} Ongoing
          </div>
          <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
            {nationalData?.criticalZonesCount ?? 0} Critical Priority
          </div>
        </div>

        <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            DEPLOYED FLEET
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
            {nationalData?.deployedFleetCount ?? 0} Active
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>NDRF / SDRF Rapid Units</div>
        </div>

        <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            COVERED POPULATION
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
            1.42 Billion
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Indian National Defense Grid</div>
        </div>
      </div>

      {/* State SDMA Operational Matrices */}
      <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px' }}>
          State SDMA Operational Readiness Matrix ({nationalData?.states?.length ?? 0} Sectors)
        </h3>

        {/* Full Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Jurisdiction / SDMA</th>
                <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Active Incidents</th>
                <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Composite Risk Score</th>
                <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Alert Level</th>
              </tr>
            </thead>
            <tbody>
              {nationalData?.states?.map((s) => {
                const isCritical = s.severity === 'CRITICAL';
                const isHigh = s.severity === 'HIGH';
                return (
                  <tr
                    key={s.stateId}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, #1c1c20)',
                      color: 'var(--text-primary)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover, #222226)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <b style={{ color: 'var(--text-primary)' }}>{s.stateName}</b>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.stateId}</div>
                    </td>
                    <td className="num-tabular" style={{ padding: '10px 12px' }}>
                      <span className={`badge ${s.activeIncidents > 0 ? (isCritical ? 'badge-critical' : 'badge-warning') : 'badge-secondary'}`}>
                        {s.activeIncidents} Active
                      </span>
                    </td>
                    <td className="num-tabular" style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 700, color: isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981' }}>
                        {s.riskIndex.toFixed(1)} / 100
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${isCritical ? 'badge-critical' : isHigh ? 'badge-warning' : 'badge-info'}`}>
                        {s.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
