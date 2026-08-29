import React, { useState } from 'react';
import {
  X,
  Bell,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { broadcastPublicAlert } from '../services/api';

interface BroadcastModalProps {
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ onClose }) => {
  const [headline, setHeadline] = useState('IMD RED ALERT: Severe Flash Flood Evacuation Notice for Kurla & Mithi River Basin');
  const [description, setDescription] = useState('Central Water Commission reports Mithi river water levels crossing danger mark by +1.4m. Mandatory evacuation ordered for all low-lying areas. Move to designated BMC Relief Centres immediately. Call 112 / 1916 for emergency boat rescue.');
  const [instruction, setInstruction] = useState('Do not attempt to drive through waterlogged subways. Turn off main electrical switches before evacuating.');
  const [areaDesc, setAreaDesc] = useState('Ward L (Kurla West), Bandra East transit corridor, and CST Road');
  const [severity, setSeverity] = useState<'Extreme' | 'Severe' | 'Moderate'>('Extreme');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      await broadcastPublicAlert({
        zoneId: 'zone-mh-mum',
        headline,
        description,
        severity,
        instruction
      });
      setBroadcastSuccess(true);
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
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
        zIndex: 2100,
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
          maxWidth: 620,
          borderRadius: 16,
          background: '#0f172a',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(245, 158, 11, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={20} color="#f59e0b" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                NDMA Sachet Public Alert Broadcast
              </h3>
              <span style={{ fontSize: 10, color: '#f59e0b' }}>
                Common Alerting Protocol (CAP) v1.2 / Mobile Cell Broadcast
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {broadcastSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 18, color: '#f8fafc', marginBottom: 6 }}>
                CAP Public Alert Disseminated
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                Alert payload transmitted to Telecom Service Providers (Cell Broadcast), NDMA Sachet Mobile App, and State EOC relay nodes.
              </p>
              <button onClick={onClose} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Close Console
              </button>
            </div>
          ) : (
            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Alert Severity Level</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Extreme', 'Severe', 'Moderate'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`btn ${severity === s ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: 12, padding: 8 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Broadcast Headline</label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Target Geographic Area Description</label>
                <input
                  type="text"
                  required
                  value={areaDesc}
                  onChange={(e) => setAreaDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Public Safety Advisory & Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="form-label">Citizen Action Instruction</label>
                <input
                  type="text"
                  required
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="btn btn-primary"
                style={{ padding: 12, display: 'flex', justifyContent: 'center', gap: 8, background: '#f59e0b', color: '#000000', fontWeight: 800 }}
              >
                <Send size={16} /> {isBroadcasting ? 'Disseminating Alert...' : 'Transmit NDMA Sachet Emergency Broadcast'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
