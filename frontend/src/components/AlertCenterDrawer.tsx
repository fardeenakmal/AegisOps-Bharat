import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Sliders,
  Filter
} from 'lucide-react';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { soundAlertService, AudioPreferences } from '../services/soundAlertService';

export interface AlertItem {
  id: string;
  zoneId: string;
  riskType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  riskScore: number;
  title: string;
  summary: string;
  sourceFeed: string;
  isLive: boolean;
  dataDisclaimer?: string;
  createdAt: string;
  read?: boolean;
}

interface AlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  onSelectAlert?: (alert: AlertItem) => void;
}

export const AlertCenterDrawer: React.FC<AlertCenterDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectAlert
}) => {
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('aegisops_read_alerts');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const [audioPrefs, setAudioPrefs] = useState<AudioPreferences>(() =>
    soundAlertService.getPreferences()
  );

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  useEffect(() => {
    try {
      localStorage.setItem('aegisops_read_alerts', JSON.stringify(Array.from(readAlertIds)));
    } catch {}
  }, [readAlertIds]);

  if (!isOpen) return null;

  const markAllRead = () => {
    const allIds = new Set(alerts.map((a) => a.id));
    setReadAlertIds(allIds);
  };

  const markRead = (id: string) => {
    setReadAlertIds((prev) => new Set(prev).add(id));
  };

  const handleToggleMute = () => {
    const nextMuted = !audioPrefs.isMuted;
    soundAlertService.setMuted(nextMuted);
    setAudioPrefs(soundAlertService.getPreferences());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundAlertService.setVolume(vol);
    setAudioPrefs(soundAlertService.getPreferences());
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter === 'CRITICAL' && a.severity !== 'CRITICAL') return false;
    if (severityFilter === 'HIGH' && a.severity !== 'HIGH') return false;
    if (severityFilter === 'UNREAD' && readAlertIds.has(a.id)) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !readAlertIds.has(a.id)).length;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1049
        }}
      />
      <div
        role="dialog"
        aria-label="Alert Center"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '100vw',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.6)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#FF9933" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Alert Center
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#f85149',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={markAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              aria-label="Close Alert Center"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Audio Controls Bar */}
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToggleMute}
              aria-label={audioPrefs.isMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
              style={{
                background: audioPrefs.isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                border: `1px solid ${audioPrefs.isMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                color: audioPrefs.isMuted ? '#f87171' : '#4ade80',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              {audioPrefs.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {audioPrefs.isMuted ? 'Muted' : 'Audio Live'}
            </button>
            <button
              onClick={() => soundAlertService.playAlertChime('CRITICAL')}
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: '4px',
                padding: '4px 6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Test Siren
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioPrefs.isMuted ? 0 : audioPrefs.volume}
              onChange={handleVolumeChange}
              disabled={audioPrefs.isMuted}
              style={{ width: '70px', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)'
          }}
        >
          {['ALL', 'UNREAD', 'CRITICAL', 'HIGH'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSeverityFilter(tab)}
              style={{
                background: severityFilter === tab ? 'var(--bg-card)' : 'transparent',
                border: `1px solid ${severityFilter === tab ? 'var(--border-default)' : 'transparent'}`,
                color: severityFilter === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Alert Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>No alerts match filter</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Sector operational telemetry normal</div>
            </div>
          ) : (
            filtered.map((alert) => {
              const isRead = readAlertIds.has(alert.id);
              const isCrit = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    markRead(alert.id);
                    if (onSelectAlert) onSelectAlert(alert);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: isRead ? 'var(--bg-surface)' : 'var(--bg-card)',
                    border: `1px solid ${isCrit ? (isRead ? 'rgba(248, 81, 73, 0.3)' : 'rgba(248, 81, 73, 0.7)') : 'var(--border-default)'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border 0.2s, background 0.2s'
                  }}
                >
                  {!isRead && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isCrit ? '#f85149' : '#38bdf8'
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: isCrit ? 'rgba(248, 81, 73, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isCrit ? '#f87171' : '#fbbf24'
                      }}
                    >
                      {alert.severity}
                    </span>
                    <DataProvenanceBadge
                      source={alert.sourceFeed}
                      isLive={alert.isLive}
                      disclaimer={alert.dataDisclaimer}
                    />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {alert.summary}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

