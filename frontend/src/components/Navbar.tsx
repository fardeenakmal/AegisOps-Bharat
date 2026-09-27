import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Activity,
  Radio,
  RefreshCw,
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
  X,
  ChevronDown,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { UserRole } from '../types';
import { OfflineIndicator } from './OfflineIndicator';

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
  activeView: 'dashboard' | 'responder' | 'hospital' | 'command' | string;
  setActiveView: (view: 'dashboard' | 'responder' | 'hospital' | 'command') => void;
  isSyncingFeeds?: boolean;
  onSyncExternalFeeds?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  operationalMode?: 'LIVE' | 'SIMULATION';
  setOperationalMode?: (mode: 'LIVE' | 'SIMULATION') => void;
  onOpenAlertCenter?: () => void;
  unreadAlertCount?: number;
  onOpenFeedsModal?: () => void;
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
  onOpenFeedsModal,
  activeView,
  setActiveView,
  isSyncingFeeds = false,
  onSyncExternalFeeds,
  theme = 'dark',
  onToggleTheme,
  operationalMode = 'LIVE',
  setOperationalMode,
  onOpenAlertCenter,
  unreadAlertCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
    };
    if (toolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toolsMenuOpen]);

  const handleSelectView = (view: 'dashboard' | 'responder' | 'hospital' | 'command') => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="vercel-nav">
      {/* Sleek Single-Bar Navigation with Tiranga Top Stripe */}
      <div
        style={{
          minHeight: 52,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        {/* Left: Brand & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Brand Logo with Ashoka Navy & Saffron Identity */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => handleSelectView('dashboard')}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: '#1e3a8a',
                border: '1px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
                flexShrink: 0
              }}
            >
              <Shield size={15} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                AEGISOPS
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: 'var(--tiranga-saffron)',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                BHARAT
              </span>
            </div>
          </div>

          {/* Mode Switcher: Live Ops vs Simulation Drill */}
          {setOperationalMode && (
            <div className="mode-switcher mobile-hide">
              <button
                onClick={() => setOperationalMode('LIVE')}
                className={`mode-btn ${operationalMode === 'LIVE' ? 'active-live' : ''}`}
                title="Switch to Real-Time Operational Telemetry Feed"
              >
                <span className="pulse-dot green" />
                <span>LIVE OPS</span>
              </button>
              <button
                onClick={() => setOperationalMode('SIMULATION')}
                className={`mode-btn ${operationalMode === 'SIMULATION' ? 'active-sim' : ''}`}
                title="Switch to Disaster Management Training & Simulation Drill"
              >
                <span className="pulse-dot saffron" />
                <span>SIMULATION DRILL</span>
              </button>
            </div>
          )}

          {/* Offline-First PWA Status Indicator */}
          <OfflineIndicator />

          {criticalCount > 0 && (
            <div className="badge badge-critical" style={{ fontSize: 10, padding: '2px 7px' }}>
              <span className="badge-dot" />
              <span className="num-tabular" style={{ fontWeight: 700 }}>{criticalCount}</span>
              <span className="mobile-hide">CRITICAL</span>
            </div>
          )}
        </div>

        {/* Center: Desktop Navigation Tabs with Tiranga Accents */}
        <div className="mobile-hide tab-underline-group">
          {[
            { id: 'dashboard', label: 'War Room', icon: <Activity size={13} /> },
            { id: 'hospital', label: 'Trauma Beds', icon: <Layers size={13} /> },
            { id: 'responder', label: 'Fleet Units', icon: <Radio size={13} /> },
            { id: 'command', label: 'National HQ', icon: <Globe size={13} /> }
          ].map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectView(tab.id as any)}
                className={`tab-underline-btn ${isActive ? 'active' : ''}`}
                style={{ padding: '15px 12px' }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Live Feeds + System Health + Sector Picker + Theme Toggle + Report + Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {/* Live Feeds Button */}
          {onOpenFeedsModal && (
            <button
              onClick={onOpenFeedsModal}
              className="btn btn-secondary mobile-hide"
              style={{ fontSize: 11, padding: '4px 8px', height: 28, display: 'flex', alignItems: 'center', gap: 5 }}
              title="Inspect real-time telemetry stream from NASA EONET, USGS, GDACS, and IMD"
            >
              <Radio size={12} color="#38bdf8" />
              <span style={{ fontWeight: 600 }}>Live Feeds</span>
            </button>
          )}

          {/* Visible System Health Pill Button */}
          <button
            onClick={onOpenMetricsModal}
            className="btn btn-secondary mobile-hide"
            style={{ fontSize: 11, padding: '4px 8px', height: 28, display: 'flex', alignItems: 'center', gap: 5 }}
            title="Inspect real-time health and latency across all 9 open public integration APIs"
          >
            <span className="pulse-dot green" />
            <span style={{ fontWeight: 600 }}>APIs (9/9)</span>
          </button>

          {/* Sector Selector (Strictly Indian Territories) */}
          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center' }}>
            <select
              value={activeZone}
              onChange={(e) => setActiveZone(e.target.value)}
              className="form-select"
              style={{
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 500,
                width: 'auto',
                maxWidth: 155,
                height: 28,
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
              title="Filter operational sector in India"
            >
              <option value="zone-ndma-in">All India (National Grid)</option>
              <option value="zone-mh-mum">Mumbai Metro (BMC)</option>
              <option value="zone-dl-ncr">Delhi NCR (DDMA)</option>
              <option value="zone-ka-blr">Bengaluru Urban (BBMP)</option>
              <option value="zone-tn-chn">Chennai Metro (GCC)</option>
              <option value="zone-od-bbs">Odisha Coastal (OSDMA)</option>
              <option value="zone-wb-kol">Kolkata Emergency (KMC)</option>
            </select>
          </div>

          {/* Light / Dark Mode Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary"
              style={{ padding: 5, height: 28, width: 28 }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun size={14} color="#FF9933" />
              ) : (
                <Moon size={14} color="#1d4ed8" />
              )}
            </button>
          )}

          {/* Alert Center Trigger */}
          {onOpenAlertCenter && (
            <button
              onClick={onOpenAlertCenter}
              className="btn btn-secondary"
              style={{
                fontSize: 11,
                padding: '4px 8px',
                height: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                position: 'relative'
              }}
              title="Open Real-Time Alert Center"
              aria-label="Open Alert Center"
            >
              <Bell size={12} color="#FF9933" />
              <span className="mobile-hide">Alerts</span>
              {unreadAlertCount > 0 && (
                <span
                  style={{
                    background: '#f85149',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 8
                  }}
                >
                  {unreadAlertCount}
                </span>
              )}
            </button>
          )}

          {/* Unified Primary Action: + Report Incident */}
          <button
            onClick={onOpenReportModal}
            className="btn btn-saffron"
            style={{ fontSize: 11, padding: '4px 10px', fontWeight: 600, height: 28, display: 'flex', alignItems: 'center', gap: 5 }}
            title="Submit emergency incident report with Bhashini Indic voice AI"
          >
            <Send size={11} />
            <span>+ Report</span>
          </button>

          {/* Tools Menu Dropdown */}
          <div style={{ position: 'relative' }} ref={toolsMenuRef}>
            <button
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              className="btn btn-secondary mobile-hide"
              style={{ fontSize: 11, padding: '4px 9px', height: 28, display: 'flex', alignItems: 'center', gap: 5 }}
              title="Operational Tools & Administration"
            >
              <Sliders size={12} color="#38bdf8" />
              <span>Tools</span>
              <ChevronDown size={11} color="var(--text-muted)" />
            </button>

            {toolsMenuOpen && (
              <div
                className="vercel-card"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 230,
                  background: 'var(--glass-bg-card)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  boxShadow: 'var(--glass-shadow-lg)',
                  padding: 4,
                  zIndex: 1100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {/* Live Feeds stream modal */}
                {onOpenFeedsModal && (
                  <button
                    onClick={() => {
                      onOpenFeedsModal();
                      setToolsMenuOpen(false);
                    }}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                  >
                    <Radio size={12} color="#38bdf8" />
                    <span>Live Disaster Feeds (NASA, USGS)</span>
                  </button>
                )}

                {/* System API Health probe */}
                <button
                  onClick={() => {
                    onOpenMetricsModal();
                    setToolsMenuOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                >
                  <Activity size={12} color="#16a34a" />
                  <span>System Health (9 APIs)</span>
                </button>

                {/* Sync Feeds */}
                {onSyncExternalFeeds && (
                  <button
                    onClick={() => {
                      onSyncExternalFeeds();
                      setToolsMenuOpen(false);
                    }}
                    disabled={isSyncingFeeds}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                  >
                    <RefreshCw size={12} className={isSyncingFeeds ? 'spin-anim' : ''} color="#38bdf8" />
                    <span>{isSyncingFeeds ? 'Syncing Feeds...' : 'Sync Disaster Feeds'}</span>
                  </button>
                )}

                {/* Simulation */}
                <button
                  onClick={() => {
                    onOpenSimulationModal();
                    setToolsMenuOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                >
                  <Sliders size={12} color="#FF9933" />
                  <span>AI Disaster Simulation</span>
                </button>

                {/* Broadcast */}
                <button
                  onClick={() => {
                    onOpenBroadcastModal();
                    setToolsMenuOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                >
                  <Radio size={12} color="#f85149" />
                  <span>NDMA CAP Broadcast</span>
                </button>

                {/* Audit */}
                <button
                  onClick={() => {
                    onOpenAuditModal();
                    setToolsMenuOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                >
                  <FileText size={12} color="var(--text-secondary)" />
                  <span>Audit Logs</span>
                </button>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                {/* Audio Toggle */}
                <button
                  onClick={() => {
                    setAudioMuted(!audioMuted);
                  }}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                >
                  {audioMuted ? <VolumeX size={12} color="var(--text-muted)" /> : <Volume2 size={12} color="#38bdf8" />}
                  <span>Audio Alert Chimes: {audioMuted ? 'Muted' : 'Active'}</span>
                </button>

                {/* User Account */}
                <button
                  onClick={() => {
                    onOpenAuthModal();
                    setToolsMenuOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '6px 10px', width: '100%' }}
                >
                  <UserCheck size={12} color="#38bdf8" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.username === 'guest_citizen' ? 'Sign In / Register' : currentUser.fullName}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary"
            style={{ padding: 6, display: 'none', height: 28, width: 28 }}
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--glass-bg-card)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          {/* Mode Switcher Mobile */}
          {setOperationalMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>OPERATIONAL MODE:</label>
              <div className="mode-switcher" style={{ width: '100%' }}>
                <button
                  onClick={() => {
                    setOperationalMode('LIVE');
                    setMobileMenuOpen(false);
                  }}
                  className={`mode-btn ${operationalMode === 'LIVE' ? 'active-live' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span className="pulse-dot green" />
                  <span>LIVE OPS</span>
                </button>
                <button
                  onClick={() => {
                    setOperationalMode('SIMULATION');
                    setMobileMenuOpen(false);
                  }}
                  className={`mode-btn ${operationalMode === 'SIMULATION' ? 'active-sim' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span className="pulse-dot saffron" />
                  <span>SIMULATION</span>
                </button>
              </div>
            </div>
          )}

          {/* Sector Selector Mobile */}
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              OPERATIONAL SECTOR:
            </label>
            <select
              value={activeZone}
              onChange={(e) => setActiveZone(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 12 }}
            >
              <option value="zone-ndma-in">All India (National Grid)</option>
              <option value="zone-mh-mum">Mumbai Metro (BMC)</option>
              <option value="zone-dl-ncr">Delhi NCR (DDMA)</option>
              <option value="zone-ka-blr">Bengaluru Urban (BBMP)</option>
              <option value="zone-tn-chn">Chennai Metro (GCC)</option>
              <option value="zone-od-bbs">Odisha Coastal (OSDMA)</option>
              <option value="zone-wb-kol">Kolkata Emergency (KMC)</option>
            </select>
          </div>

          {/* Primary View Switcher Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => handleSelectView('dashboard')}
              className={`btn ${activeView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', fontSize: 12, padding: '8px 10px' }}
            >
              <Activity size={13} /> War Room
            </button>
            <button
              onClick={() => handleSelectView('hospital')}
              className={`btn ${activeView === 'hospital' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', fontSize: 12, padding: '8px 10px' }}
            >
              <Layers size={13} /> Trauma Beds
            </button>
            <button
              onClick={() => handleSelectView('responder')}
              className={`btn ${activeView === 'responder' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', fontSize: 12, padding: '8px 10px' }}
            >
              <Radio size={13} /> Fleet Units
            </button>
            <button
              onClick={() => handleSelectView('command')}
              className={`btn ${activeView === 'command' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', fontSize: 12, padding: '8px 10px' }}
            >
              <Globe size={13} /> National HQ
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)' }} />

          {/* Mobile Tools & Theme Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => {
                onOpenMetricsModal();
                setMobileMenuOpen(false);
              }}
              className="btn btn-secondary"
              style={{ fontSize: 11, padding: '6px 8px', justifyContent: 'flex-start' }}
            >
              <Activity size={11} color="#16a34a" />
              <span>APIs (9/9)</span>
            </button>

            {onToggleTheme && (
              <button
                onClick={() => {
                  onToggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '6px 8px', justifyContent: 'flex-start' }}
              >
                {theme === 'dark' ? <Sun size={11} color="#FF9933" /> : <Moon size={11} color="#1d4ed8" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}

            {onSyncExternalFeeds && (
              <button
                onClick={() => {
                  onSyncExternalFeeds();
                  setMobileMenuOpen(false);
                }}
                disabled={isSyncingFeeds}
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '6px 8px', justifyContent: 'flex-start' }}
              >
                <RefreshCw size={11} className={isSyncingFeeds ? 'spin-anim' : ''} color="#38bdf8" />
                <span>Sync Feeds</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenSimulationModal();
                setMobileMenuOpen(false);
              }}
              className="btn btn-secondary"
              style={{ fontSize: 11, padding: '6px 8px', justifyContent: 'flex-start' }}
            >
              <Sliders size={11} color="#FF9933" />
              <span>Simulation</span>
            </button>
          </div>

          <button
            onClick={() => {
              onOpenAuthModal();
              setMobileMenuOpen(false);
            }}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: '8px 10px', justifyContent: 'center' }}
          >
            <UserCheck size={12} color="#38bdf8" />
            <span>{currentUser.username === 'guest_citizen' ? 'Sign In / Register' : `Logged In: ${currentUser.fullName}`}</span>
          </button>
        </div>
      )}
    </header>
  );
};
