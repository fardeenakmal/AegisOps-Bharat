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

export const StateNationalRollup: React.FC = () => {
  const [nationalData, setNationalData] = useState<any>(null);
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
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 24px' }}>
      {/* Header */}
      <div
        className="vercel-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Layers size={18} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
              NDMA National Command Headquarters
            </h2>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>
              Pan-India disaster aggregation across 28 States & 8 Union Territories
            </p>
          </div>
        </div>

        <button onClick={loadData} disabled={loading} className="btn btn-secondary" style={{ fontSize: 11 }}>
          <RefreshCw size={12} className={loading ? 'spin-anim' : ''} color="#38bdf8" />
          <span>{loading ? 'Refreshing...' : 'Refresh National Rollup'}</span>
        </button>
      </div>

      {/* Top National Stat Cards (Responsive 2x2 on Mobile, 4-col on Desktop) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>POPULATION</div>
          <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            1.42 Billion
          </div>
          <div style={{ fontSize: 10, color: '#a1a1a1', marginTop: 2 }}>28 States & 8 UTs</div>
        </div>

        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>ACTIVE INCIDENTS</div>
          <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#fca5a5', marginTop: 2 }}>
            {nationalData?.nationalActiveIncidents || 3} Active
          </div>
          <div style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>
            {nationalData?.nationalCriticalIncidents || 2} Critical Priority
          </div>
        </div>

        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>NDRF BATTALIONS</div>
          <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
            16 Active
          </div>
          <div style={{ fontSize: 10, color: '#a1a1a1', marginTop: 2 }}>Quick Reaction Force</div>
        </div>

        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>INTER-STATE RELIEF</div>
          <div className="num-tabular" style={{ fontSize: 18, fontWeight: 800, color: '#fcd34d', marginTop: 2 }}>
            1 Approved
          </div>
          <div style={{ fontSize: 10, color: '#a1a1a1', marginTop: 2 }}>Fleet Transfers Ready</div>
        </div>
      </div>

      {/* State SDMA Operational Matrices */}
      <div className="vercel-panel" style={{ padding: '14px 16px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ededed', textTransform: 'uppercase', marginBottom: 12 }}>
          State SDMA Operational Readiness Matrix
        </h3>

        {/* Mobile View: High-Density Responsive State Cards */}
        <div className="mobile-only-block" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
          {nationalData?.stateRollups?.map((s: any, idx: number) => (
            <div
              key={idx}
              className="vercel-card"
              style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '3px solid #ef4444' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{s.stateName}</span>
                <span className="badge badge-critical" style={{ fontSize: 10 }}>RED ALERT</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                <div style={{ background: '#161616', padding: '6px 8px', borderRadius: 4 }}>
                  <div style={{ color: '#737373', fontSize: 10 }}>INCIDENTS</div>
                  <div style={{ fontWeight: 600, color: '#ededed' }}>
                    {s.metrics?.criticalIncidents} Critical / {s.metrics?.activeIncidents} Total
                  </div>
                </div>

                <div style={{ background: '#161616', padding: '6px 8px', borderRadius: 4 }}>
                  <div style={{ color: '#737373', fontSize: 10 }}>CASUALTIES / TRAPPED</div>
                  <div style={{ fontWeight: 600, color: '#fca5a5' }}>
                    {s.metrics?.totalCasualtiesReported} Cas / {s.metrics?.totalTrappedReported} Trap
                  </div>
                </div>

                <div style={{ background: '#161616', padding: '6px 8px', borderRadius: 4 }}>
                  <div style={{ color: '#737373', fontSize: 10 }}>FLEET READINESS</div>
                  <div style={{ fontWeight: 600, color: '#34d399' }}>
                    {s.metrics?.resourceReadiness?.available} Available
                  </div>
                </div>

                <div style={{ background: '#161616', padding: '6px 8px', borderRadius: 4 }}>
                  <div style={{ color: '#737373', fontSize: 10 }}>HOSPITAL CAPACITY</div>
                  <div style={{ fontWeight: 600, color: '#38bdf8' }}>
                    {s.metrics?.hospitalCapacity?.availableBeds} Beds ({s.metrics?.hospitalCapacity?.bedOccupancyRate}%)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="desktop-only-block" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: '#737373' }}>
                <th style={{ padding: '8px 10px' }}>State / Jurisdiction</th>
                <th style={{ padding: '8px 10px' }}>Active Incidents</th>
                <th style={{ padding: '8px 10px' }}>Casualties</th>
                <th style={{ padding: '8px 10px' }}>Trapped</th>
                <th style={{ padding: '8px 10px' }}>Fleet Readiness</th>
                <th style={{ padding: '8px 10px' }}>Hospital Beds</th>
                <th style={{ padding: '8px 10px' }}>Threat Level</th>
              </tr>
            </thead>
            <tbody>
              {nationalData?.stateRollups?.map((s: any, idx: number) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    color: '#ededed'
                  }}
                >
                  <td style={{ padding: '10px' }}>
                    <b>{s.stateName}</b>
                  </td>
                  <td className="num-tabular" style={{ padding: '10px' }}>
                    <span className="badge badge-critical">{s.metrics?.criticalIncidents} Critical</span> / {s.metrics?.activeIncidents} Total
                  </td>
                  <td className="num-tabular" style={{ padding: '10px', color: '#fca5a5' }}>
                    {s.metrics?.totalCasualtiesReported}
                  </td>
                  <td className="num-tabular" style={{ padding: '10px', color: '#fca5a5' }}>
                    {s.metrics?.totalTrappedReported}
                  </td>
                  <td className="num-tabular" style={{ padding: '10px' }}>
                    <span className="badge badge-success">{s.metrics?.resourceReadiness?.available} Available</span>
                  </td>
                  <td className="num-tabular" style={{ padding: '10px' }}>
                    {s.metrics?.hospitalCapacity?.availableBeds} / {s.metrics?.hospitalCapacity?.totalBeds} ({s.metrics?.hospitalCapacity?.bedOccupancyRate}% Occ)
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className="badge badge-critical">RED ALERT</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
