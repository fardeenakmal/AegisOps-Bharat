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
  Radio,
  Truck,
  ArrowRight
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
        className="vercel-card"
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
          <div className="glass-icon-box md" style={{ color: '#38bdf8' }}>
            <Layers size={17} />
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
        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            NATIONAL RISK INDEX
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
            {nationalData?.nationalRiskIndex ?? 69.9} / 100
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Weighted Pan-India Composite</div>
        </div>

        <div className="vercel-card" style={{ padding: 12 }}>
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

        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            DEPLOYED FLEET
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
            {nationalData?.deployedFleetCount ?? 0} Active
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>NDRF / SDRF Rapid Units</div>
        </div>

        <div className="vercel-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            COVERED POPULATION
          </div>
          <div className="num-tabular" style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
            1.42 Billion
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Indian National Defense Grid</div>
        </div>
      </div>

      {/* Inter-State SDMA Mutual Aid & NDRF Coordination Section */}
      <div className="vercel-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="glass-icon-box sm" style={{ color: '#f59e0b' }}>
              <Truck size={14} />
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Inter-State SDMA Mutual Aid & NDRF Asset Mobilization
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                Cross-jurisdiction emergency asset requests between State EOCs and NDRF Battalions
              </p>
            </div>
          </div>
          <span className="badge badge-warning" style={{ fontSize: 10 }}>
            {nationalData?.crossJurisdictionRequests?.filter((r: any) => r.status === 'PENDING_APPROVAL').length || 0} Awaiting Command Approval
          </span>
        </div>

        {(!nationalData?.crossJurisdictionRequests || nationalData.crossJurisdictionRequests.length === 0) ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No inter-state mutual aid requests currently active.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {nationalData.crossJurisdictionRequests.map((req: any) => {
              const isPending = req.status === 'PENDING_APPROVAL';
              const isApproved = req.status === 'APPROVED' || req.status === 'DISPATCHED';
              const isCrit = req.urgency === 'CRITICAL';

              return (
                <div
                  key={req.id}
                  style={{
                    background: 'var(--bg-card-subtle, rgba(255,255,255,0.02))',
                    border: isPending ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {req.id}
                        </span>
                        <span className={`badge ${isCrit ? 'badge-critical' : 'badge-warning'}`} style={{ fontSize: 9 }}>
                          {req.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>
                        {req.hazardType}
                      </div>
                    </div>

                    <span
                      className={`badge ${isApproved ? 'badge-success' : isPending ? 'badge-warning' : 'badge-secondary'}`}
                      style={{ fontSize: 10 }}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.sourceJurisdiction}</span>
                    <ArrowRight size={12} color="var(--text-muted)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.targetJurisdiction}</span>
                  </div>

                  <div style={{ background: 'var(--bg-body, #0a0a0c)', padding: '8px 10px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Requested Resources:
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>
                      {req.requestedResource}
                    </div>
                    {req.approvalNotes && (
                      <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>
                        ✓ {req.approvalNotes} ({req.approvedBy})
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Requested: {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {isPending ? (
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={approvingId === req.id}
                        className="btn btn-primary"
                        style={{
                          fontSize: 11,
                          padding: '4px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#10b981',
                          borderColor: '#10b981'
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>{approvingId === req.id ? 'Approving...' : 'Approve Deployment'}</span>
                      </button>
                    ) : (
                      <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <CheckCircle2 size={12} />
                        <span>Mobilized & In Transit</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* State SDMA Operational Matrices */}
      <div className="vercel-card" style={{ padding: 16 }}>
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
