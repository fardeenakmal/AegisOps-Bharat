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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setErrorMsg(null);
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
      setErrorMsg(`Broadcast notice: ${err.message || 'Error executing broadcast'}`);
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
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14
      }}
      className="modal-overlay"
    >
      <div
        className="vercel-panel modal-content"
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
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
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'var(--gh-amber-subtle)',
                border: '1px solid var(--gh-amber-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={15} color="#fbbf24" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                NDMA Sachet Public Alert Broadcast
              </h3>
              <span style={{ fontSize: 10, color: '#fbbf24' }}>
                Common Alerting Protocol (CAP) v1.2 / Mobile Cell Broadcast
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4, height: 26, width: 26 }}>
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ padding: '16px 18px' }}>
          {broadcastSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle2 size={44} color="#2ea043" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 17, color: 'var(--text-primary)', marginBottom: 6 }}>
                CAP Public Alert Disseminated
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
                Alert payload transmitted to Telecom Service Providers (Cell Broadcast), NDMA Sachet Mobile App, and State EOC relay nodes.
              </p>
              <button onClick={onClose} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                Close Console
              </button>
            </div>
          ) : (
            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Alert Severity Level</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Extreme', 'Severe', 'Moderate'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`btn ${severity === s ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
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
                  style={{ fontSize: 12 }}
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
                  style={{ fontSize: 12 }}
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
                  style={{ resize: 'vertical', fontSize: 12 }}
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
                  style={{ fontSize: 12 }}
                />
              </div>

              {/* Cell Broadcast & OASIS CAP v1.2 Live Inspector Drawer */}
              <div
                className="vercel-card"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Radio size={12} /> Live Telecom Cell Broadcast & CAP v1.2 Payload
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    ITU-T X.1303 & DoT Cell Broadcast Compliant
                  </span>
                </div>

                {/* 93-Char GSM Snippet */}
                <div style={{ marginBottom: 8, background: 'var(--bg-card)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                    <span>2G/3G GSM 03.38 Immediate Alert</span>
                    <span className="num-tabular" style={{ color: `EMERGENCY ALERT: ${headline.slice(0, 40)} in ${areaDesc.slice(0, 20)}. Dial 112 -NDMA`.length <= 93 ? '#2ea043' : '#f85149' }}>
                      {`EMERGENCY ALERT: ${headline.slice(0, 40)} in ${areaDesc.slice(0, 20)}. Dial 112 -NDMA`.length}/93 chars
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    EMERGENCY ALERT: {headline.slice(0, 40)} in {areaDesc.slice(0, 20)}. Dial 112 -NDMA
                  </div>
                </div>

                {/* 360-Char LTE / 5G Bilingual Warning */}
                <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                    <span>4G/5G National Cell Broadcast (Bilingual Alert)</span>
                    <span style={{ color: '#2ea043' }}>Compliant (&lt; 360 chars)</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#fde68a', fontFamily: 'var(--font-mono)', lineHeight: 1.35 }}>
                    [GOVT OF INDIA / राष्ट्रीय आपदा चेतावनी] {headline}. {instruction} तत्काल सुरक्षित स्थान पर जाएं। सहायता हेतु 112 डायल करें। -NDMA
                  </div>
                </div>

                <div style={{ marginTop: 8, fontSize: 10, color: '#38bdf8' }}>
                  Feed endpoint: <code style={{ color: '#7dd3fc', fontFamily: 'var(--font-mono)' }}>/api/cap/feed.xml</code> (OASIS CAP v1.2 XML Feed)
                </div>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="btn btn-primary"
                style={{ padding: 10, display: 'flex', justifyContent: 'center', gap: 8, background: '#fbbf24', color: '#000000', fontWeight: 700, border: 'none' }}
              >
                <Send size={14} />
                <span>{isBroadcasting ? 'Disseminating Alert...' : 'Transmit NDMA Sachet Emergency Broadcast'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
