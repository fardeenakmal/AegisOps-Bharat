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
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#06b6d4" />
            <h3 style={{ fontSize: 16, color: '#f8fafc' }}>AI Decisions & Operator Override Audit Trail</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              <FileText size={12} className={loading ? 'spin-anim' : ''} color="#38bdf8" />
              <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>No audit events recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.map((log) => {
                const isAI = log.actorType === 'AI_PIPELINE';
                return (
                  <div
                    key={log.id}
                    className="glass-panel"
                    style={{
                      padding: 14,
                      background: isAI ? 'rgba(15, 23, 42, 0.7)' : 'rgba(30, 41, 59, 0.7)',
                      borderLeft: isAI ? '3px solid #06b6d4' : '3px solid #f59e0b'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isAI ? <Bot size={15} color="#06b6d4" /> : <User size={15} color="#f59e0b" />}
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc' }}>
                          {log.action}
                        </span>
                        <span className={`badge ${isAI ? 'badge-cyan' : 'badge-medium'}`} style={{ fontSize: 9 }}>
                          {log.actorType}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                      Actor: <b>{log.actorName || log.actorId}</b>
                      {log.modelName && (
                        <span> • Model: <code style={{ color: '#67e8f9' }}>{log.modelName} (v{log.modelVersion})</code></span>
                      )}
                    </div>

                    {log.overrideReason && (
                      <div style={{ fontSize: 12, color: '#fde68a', background: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 6, marginTop: 6 }}>
                        <b>Override Justification:</b> "{log.overrideReason}"
                      </div>
                    )}

                    {log.newValue && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 4 }}>
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
