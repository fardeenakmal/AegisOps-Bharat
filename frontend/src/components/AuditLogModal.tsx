import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Shield,
  Bot,
  User,
  Sparkles,
  CheckCircle,
  Sliders
} from 'lucide-react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../services/api';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await fetchAuditLogs();
      setLogs(list);
    } catch (e) {
      console.error(e);
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
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      className="modal-overlay"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} color="#38bdf8" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  AI Decisions & Operator Override Audit Trail
                </h3>
                <span className="badge badge-info" style={{ fontSize: 9, padding: '1px 6px' }}>COMPLIANCE</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Tamper-evident chronological record of automated actions and manual overrides</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={12} className={loading ? 'spin-anim' : ''} color="#38bdf8" />
              <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '4px 8px', borderRadius: 6 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No audit events recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map((log) => {
                const isAI = log.actorType === 'AI_PIPELINE';
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: 12,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderLeft: isAI ? '3px solid #38bdf8' : '3px solid #d29922',
                      borderRadius: 6
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isAI ? <Bot size={14} color="#38bdf8" /> : <User size={14} color="#d29922" />}
                        <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>
                          {log.action}
                        </span>
                        <span className={`badge ${isAI ? 'badge-info' : 'badge-medium'}`} style={{ fontSize: 9 }}>
                          {log.actorType}
                        </span>
                      </div>
                      <span className="num-tabular" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Actor: <b style={{ color: 'var(--text-primary)' }}>{log.actorName || log.actorId}</b>
                      {log.modelName && (
                        <span> • Model: <code style={{ color: '#38bdf8', fontSize: 11 }}>{log.modelName} (v{log.modelVersion})</code></span>
                      )}
                    </div>

                    {log.overrideReason && (
                      <div style={{ fontSize: 11, color: '#e3b341', background: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.3)', padding: '6px 10px', borderRadius: 4, marginTop: 6 }}>
                        <b>Override Justification:</b> "{log.overrideReason}"
                      </div>
                    )}

                    {log.newValue && (
                      <div className="num-tabular" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'monospace', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: 4, overflowX: 'auto' }}>
                        Payload: {JSON.stringify(log.newValue)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
