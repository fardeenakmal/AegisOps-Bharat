import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Cpu,
  Database,
  Radio,
  Server,
  Zap,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface MetricsHealthModalProps {
  onClose: () => void;
}

export const MetricsHealthModal: React.FC<MetricsHealthModalProps> = ({ onClose }) => {
  const [health, setHealth] = useState<any>(null);
  const [metricsText, setMetricsText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthAndMetrics();
    const interval = setInterval(loadHealthAndMetrics, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthAndMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL
        ? (import.meta as any).env.VITE_API_URL.replace(/\/$/, '')
        : '';
      const [hRes, mRes] = await Promise.all([
        fetch(`${baseUrl}/api/health`),
        fetch(`${baseUrl}/api/metrics`)
      ]);

      if (!hRes.ok) {
        throw new Error(`Health probe returned status ${hRes.status}`);
      }
      if (!mRes.ok) {
        throw new Error(`Prometheus metrics stream returned status ${mRes.status}`);
      }

      const hData = await hRes.json();
      const mText = await mRes.text();
      setHealth(hData);
      setMetricsText(mText);
    } catch (e: any) {
      console.error('[Metrics Load Error]', e);
      setError(e.message || 'Failed to connect to cluster metrics endpoint');
    } finally {
      setLoading(false);
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
        zIndex: 2300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      className="modal-overlay"
    >
      <div
        className="vercel-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#111111'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>Production Cluster Telemetry & Health</h3>
              <p style={{ fontSize: 11, color: '#737373' }}>Real-time cluster telemetry & raw Prometheus metrics exposition</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadHealthAndMetrics}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              <RefreshCw size={12} className={loading ? 'spin-anim' : ''} color="#38bdf8" />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 12 }}>
              <AlertCircle size={16} color="#ef4444" />
              <span><b>Telemetry Connection Error:</b> {error}</span>
            </div>
          )}

          {health && (
            <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div className="vercel-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: '#737373', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Server size={13} color="#34d399" /> Cluster Status
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399', marginTop: 4 }}>
                  {health.status}
                </div>
                <div style={{ fontSize: 11, color: '#a1a1a1', marginTop: 2 }}>
                  Version: {health.version}
                </div>
              </div>

              <div className="vercel-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: '#737373', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={13} color="#38bdf8" /> PostGIS Persistence
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
                  {health.postgres?.connected ? 'CONNECTED (POOL)' : 'STANDALONE POOL'}
                </div>
                <div style={{ fontSize: 11, color: '#a1a1a1', marginTop: 2 }}>
                  Spatial GIST Indexing Active
                </div>
              </div>

              <div className="vercel-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: '#737373', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} color="#fbbf24" /> Active Incident Load
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#ededed', marginTop: 4 }}>
                  {health.systemStats?.activeIncidents} Incidents
                </div>
                <div style={{ fontSize: 11, color: '#a1a1a1', marginTop: 2 }}>
                  {health.systemStats?.availableResources} Available Fleet Units
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#737373', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={13} color="#38bdf8" /> Raw Prometheus Exposition Stream (`/metrics`)
            </h4>
            <pre
              style={{
                background: '#000000',
                padding: 12,
                borderRadius: 6,
                fontSize: 11,
                color: '#38bdf8',
                fontFamily: 'monospace',
                overflowX: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                lineHeight: 1.5,
                maxHeight: 280
              }}
            >
              {metricsText || (loading ? 'Connecting to Prometheus exposition stream...' : 'No metrics data received.')}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
