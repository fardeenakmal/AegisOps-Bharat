import React, { useState } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Radio,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  BarChart3,
  UserCheck,
  Send,
  Globe,
  Sliders,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: any;
  activeZone: string;
  setActiveZone: (zone: string) => void;
  wsConnected: boolean;
  criticalCount: number;
  totalActiveCount: number;
  audioMuted: boolean;
  setAudioMuted: (muted: boolean) => void;
  onOpenReportModal: () => void;
  onOpenSimulationModal: () => void;
  onOpenAuditModal: () => void;
  onOpenBroadcastModal: () => void;
  onOpenMetricsModal: () => void;
  onOpenAuthModal: () => void;
  activeView: 'dashboard' | 'responder' | 'hospital' | 'command' | 'public-report';
  setActiveView: (view: 'dashboard' | 'responder' | 'hospital' | 'command' | 'public-report') => void;
  isSyncingFeeds?: boolean;
  onSyncExternalFeeds?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  setActiveRole,
  currentUser,
  activeZone,
  setActiveZone,
  wsConnected,
  criticalCount,
  totalActiveCount,
  audioMuted,
  setAudioMuted,
  onOpenReportModal,
  onOpenSimulationModal,
  onOpenAuditModal,
  onOpenBroadcastModal,
  onOpenMetricsModal,
  onOpenAuthModal,
  activeView,
  setActiveView,
  isSyncingFeeds = false,
  onSyncExternalFeeds
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectView = (view: 'dashboard' | 'responder' | 'hospital' | 'command' | 'public-report') => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="vercel-nav">
      {/* Primary Top Bar */}
      <div
        style={{
          minHeight: 48,
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'nowrap'
        }}
      >
        {/* Left: Brand & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
            onClick={() => handleSelectView('dashboard')}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                flexShrink: 0
              }}
            >
              <Shield size={16} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
                AEGISOPS
              </span>
              <span className="mobile-hide" style={{ fontSize: 10, color: '#737373', borderLeft: '1px solid #333', paddingLeft: 5 }}>
                NDMA 112
              </span>
            </div>
          </div>

          {/* Live Status Pill */}
          <div
            className="badge"
            style={{
              background: wsConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: wsConnected ? '#6ee7b7' : '#fde68a',
              borderColor: wsConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              fontSize: 10,
              padding: '1px 6px'
            }}
          >
            <span
              className="badge-dot"
              style={{
                background: wsConnected ? '#10b981' : '#f59e0b',
                boxShadow: wsConnected ? '0 0 6px rgba(16, 185, 129, 0.8)' : undefined
              }}
            />
            <span className="mobile-hide">{wsConnected ? 'LIVE FEED' : 'RECONNECTING'}</span>
          </div>

          {criticalCount > 0 && (
            <div className="badge badge-critical" style={{ fontSize: 10, padding: '1px 6px' }}>
              <span className="badge-dot" />
              <span>{criticalCount}</span>
              <span className="mobile-hide">CRITICAL</span>
            </div>
          )}
        </div>

        {/* Center: Desktop Navigation Links (Hidden on small mobile) */}
        <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { id: 'dashboard', label: 'War Room', icon: <Activity size={13} /> },
            { id: 'public-report', label: 'Public 112 Portal', icon: <AlertTriangle size={13} color="#f87171" /> },
            { id: 'responder', label: 'Fleet Units', icon: <Radio size={13} /> },
            { id: 'hospital', label: 'Trauma Centers', icon: <Layers size={13} /> },
            { id: 'command', label: 'National HQ', icon: <Globe size={13} /> }
          ].map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectView(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#a1a1a1',
                  background: isActive ? '#1a1a1a' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-medium)' : 'transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions, Citizen Report & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Quick 112 Citizen Report Button */}
          <button
            onClick={onOpenReportModal}
            className="btn btn-danger"
            style={{ fontSize: 11, padding: '5px 10px', fontWeight: 600 }}
          >
            <Send size={12} />
            <span>112 Report</span>
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="btn btn-ghost"
            title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
            style={{ padding: 6 }}
          >
            {audioMuted ? <VolumeX size={15} color="#737373" /> : <Volume2 size={15} color="#38bdf8" />}
          </button>

          {/* User Profile Pill (Desktop) */}
          <button
            onClick={onOpenAuthModal}
            className="btn btn-secondary mobile-hide"
            style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
            <span>{currentUser.fullName}</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary"
            style={{ padding: 6, display: 'none' }}
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (When open on mobile) */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '12px 16px',
            background: '#0d1117',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ fontSize: 11, color: '#737373', textTransform: 'uppercase', fontWeight: 600 }}>
            COMMAND SECTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => handleSelectView('dashboard')}
              className={`btn ${activeView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <Activity size={14} /> War Room Map
            </button>
            <button
              onClick={() => handleSelectView('public-report')}
              className={`btn ${activeView === 'public-report' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <AlertTriangle size={14} color="#f87171" /> Public 112 Portal
            </button>
            <button
              onClick={() => handleSelectView('responder')}
              className={`btn ${activeView === 'responder' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <Radio size={14} /> Fleet Units
            </button>
            <button
              onClick={() => handleSelectView('hospital')}
              className={`btn ${activeView === 'hospital' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <Layers size={14} /> Trauma Centers
            </button>
            <button
              onClick={() => handleSelectView('command')}
              className={`btn ${activeView === 'command' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <Globe size={14} /> National HQ
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <button
            onClick={() => {
              onOpenAuthModal();
              setMobileMenuOpen(false);
            }}
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
          >
            <UserCheck size={14} color="#38bdf8" /> Signed in as: {currentUser.fullName} ({activeRole})
          </button>
        </div>
      )}

      {/* Subheader: Sector Filter & Touch-Scrollable Action Toolbar */}
      <div
        style={{
          minHeight: 38,
          padding: '4px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0a0a0a',
          gap: 8,
          overflowX: 'auto'
        }}
        className="touch-scroll-x"
      >
        {/* Sector Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>
            SECTOR:
          </span>
          <select
            value={activeZone}
            onChange={(e) => setActiveZone(e.target.value)}
            className="form-select"
            style={{ padding: '3px 8px', fontSize: 11, width: 'auto', minWidth: 170, height: 26, background: '#141414' }}
          >
            <option value="zone-ndma-in">All Regions (National & Global)</option>
            <option value="zone-mh-mum">Mumbai Metro (BMC Sector)</option>
            <option value="zone-dl-ncr">Delhi NCR (DDMA Sector)</option>
            <option value="zone-ka-blr">Bengaluru Urban (BBMP Sector)</option>
            <option value="zone-tn-chn">Chennai Metro (GCC Sector)</option>
            <option value="zone-od-bbs">Odisha Coastal (OSDMA Sector)</option>
            <option value="zone-wb-kol">Kolkata Emergency (KMC Sector)</option>
          </select>
        </div>

        {/* Horizontally Scrollable Action Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Live Sync External Feeds Button */}
          {onSyncExternalFeeds && (
            <button
              onClick={onSyncExternalFeeds}
              disabled={isSyncingFeeds}
              className="btn btn-secondary"
              style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
              title="Poll USGS and Open-Meteo for live updates"
            >
              <RefreshCw size={11} className={isSyncingFeeds ? 'spin-anim' : ''} color="#38bdf8" />
              <span>{isSyncingFeeds ? 'Syncing...' : 'Sync Feeds'}</span>
            </button>
          )}

          {/* AI Simulation */}
          <button
            onClick={onOpenSimulationModal}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
          >
            <Sliders size={11} color="#fbbf24" />
            <span>Simulation</span>
          </button>

          {/* CAP Broadcast */}
          <button
            onClick={onOpenBroadcastModal}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
          >
            <Radio size={11} color="#f87171" />
            <span>CAP Alert</span>
          </button>

          {/* Metrics */}
          <button
            onClick={onOpenMetricsModal}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
          >
            <BarChart3 size={11} color="#a1a1a1" />
            <span>Metrics</span>
          </button>

          {/* Audit Logs */}
          <button
            onClick={onOpenAuditModal}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
          >
            <FileText size={11} color="#a1a1a1" />
            <span>Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
