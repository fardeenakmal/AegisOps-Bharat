import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Radio,
  Globe,
  Layers,
  Send,
  RefreshCw,
  Volume2,
  VolumeX,
  FileText,
  UserCheck,
  Sliders,
  Sun,
  Moon,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Wifi,
  WifiOff,
  Rss,
} from 'lucide-react';
import { UserRole } from '../types';
import { OfflineIndicator } from './OfflineIndicator';

interface SidebarProps {
  activeRole: UserRole;
  currentUser: any;
  activeZone: string;
  setActiveZone: (zone: string) => void;
  wsConnected: boolean;
  criticalCount: number;
  totalActiveCount: number;
  unreadAlertCount: number;
  audioMuted: boolean;
  setAudioMuted: (muted: boolean) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  operationalMode: 'LIVE' | 'SIMULATION';
  setOperationalMode: (mode: 'LIVE' | 'SIMULATION') => void;
  activeView: string;
  setActiveView: (view: 'dashboard' | 'responder' | 'hospital' | 'command') => void;
  onOpenAlertCenter: () => void;
  onOpenReportModal: () => void;
  onOpenSimulationModal: () => void;
  onOpenAuditModal: () => void;
  onOpenBroadcastModal: () => void;
  onOpenMetricsModal: () => void;
  onOpenAuthModal: () => void;
  onOpenFeedsModal: () => void;
  isSyncingFeeds: boolean;
  onSyncExternalFeeds: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const ZONES = [
  { value: 'zone-ndma-in', label: 'All India', short: 'IND' },
  { value: 'zone-mh-mum', label: 'Mumbai Metro', short: 'MUM' },
  { value: 'zone-dl-ncr', label: 'Delhi NCR', short: 'DEL' },
  { value: 'zone-ka-blr', label: 'Bengaluru', short: 'BLR' },
  { value: 'zone-tn-chn', label: 'Chennai', short: 'CHN' },
  { value: 'zone-od-bbs', label: 'Odisha Coastal', short: 'ORI' },
  { value: 'zone-wb-kol', label: 'Kolkata', short: 'KOL' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeZone,
  setActiveZone,
  wsConnected,
  criticalCount,
  totalActiveCount,
  unreadAlertCount,
  audioMuted,
  setAudioMuted,
  theme,
  onToggleTheme,
  operationalMode,
  setOperationalMode,
  activeView,
  setActiveView,
  onOpenAlertCenter,
  onOpenReportModal,
  onOpenSimulationModal,
  onOpenAuditModal,
  onOpenBroadcastModal,
  onOpenMetricsModal,
  onOpenAuthModal,
  onOpenFeedsModal,
  isSyncingFeeds,
  onSyncExternalFeeds,
  collapsed,
  onToggleCollapse,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handle = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const handleNav = (view: 'dashboard' | 'responder' | 'hospital' | 'command') => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const handleAction = (fn: () => void) => {
    fn();
    setMobileOpen(false);
  };

  const isLive = operationalMode === 'LIVE';

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'War Room', icon: <Activity size={17} />, badge: criticalCount > 0 ? criticalCount : null },
    { id: 'hospital', label: 'Trauma Beds', icon: <Layers size={17} />, badge: null },
    { id: 'responder', label: 'Fleet Units', icon: <Radio size={17} />, badge: null },
    { id: 'command', label: 'National HQ', icon: <Globe size={17} />, badge: null },
  ] as const;

  const currentZoneLabel = ZONES.find(z => z.value === activeZone)?.label || 'All India';
  const currentZoneShort = ZONES.find(z => z.value === activeZone)?.short || 'IND';

  const renderContent = (isMobileDrawer = false) => {
    const isCollapsed = !isMobileDrawer && collapsed;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
        }}
      >
        {/* Brand Header */}
        {!isMobileDrawer && (
          <div
            style={{
              padding: isCollapsed ? '12px 6px' : '14px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              flexShrink: 0,
              minHeight: 56,
              background: 'linear-gradient(180deg, rgba(255,153,51,0.08) 0%, transparent 100%)',
              position: 'relative',
            }}
          >
            {/* Tiranga tri-color top accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%, #138808 100%)',
              }}
            />

            {!isCollapsed ? (
              <>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
                  onClick={() => handleNav('dashboard')}
                  title="AegisOps Bharat War Room"
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: '#1e3a8a',
                      border: '1px solid #3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(59,130,246,0.35)',
                      flexShrink: 0,
                    }}
                  >
                    <Shield size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      AEGISOPS
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--tiranga-saffron)', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
                      BHARAT
                    </div>
                  </div>
                </div>

                <button
                  onClick={onToggleCollapse}
                  className="sidebar-collapse-btn"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={14} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#1e3a8a',
                    border: '1px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 8px rgba(59,130,246,0.3)',
                  }}
                  onClick={() => handleNav('dashboard')}
                  title="AegisOps Bharat - Return to War Room"
                >
                  <Shield size={16} color="#ffffff" />
                </div>
                <button
                  onClick={onToggleCollapse}
                  className="sidebar-collapse-btn"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode Switcher */}
        <div style={{ padding: isCollapsed ? '10px 6px' : '10px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {isCollapsed ? (
            <button
              onClick={() => setOperationalMode(isLive ? 'SIMULATION' : 'LIVE')}
              title={`Operational Mode: ${operationalMode} (Click to toggle)`}
              style={{
                width: 34,
                height: 28,
                margin: '0 auto',
                background: isLive ? 'rgba(22, 163, 74, 0.12)' : 'rgba(255, 153, 51, 0.12)',
                border: `1px solid ${isLive ? 'rgba(22, 163, 74, 0.35)' : 'rgba(255, 153, 51, 0.35)'}`,
                borderRadius: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className={`pulse-dot ${isLive ? 'green' : 'saffron'}`} style={{ width: 8, height: 8 }} />
            </button>
          ) : (
            <div className="mode-switcher" style={{ width: '100%', display: 'flex' }}>
              <button
                onClick={() => setOperationalMode('LIVE')}
                className={`mode-btn ${isLive ? 'active-live' : ''}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: 10.5 }}
              >
                <span className="pulse-dot green" />
                <span>LIVE</span>
              </button>
              <button
                onClick={() => setOperationalMode('SIMULATION')}
                className={`mode-btn ${!isLive ? 'active-sim' : ''}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: 10.5 }}
              >
                <span className="pulse-dot saffron" />
                <span>SIM</span>
              </button>
            </div>
          )}
        </div>

        {/* Operational Disaster Sector Picker (Pan-India & Metros) */}
        <div style={{ padding: isCollapsed ? '8px 6px' : '8px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {!isCollapsed ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Operational Sector
                </span>
                <span style={{ fontSize: 11 }} title="Republic of India">🇮🇳</span>
              </div>
              <select
                value={activeZone}
                onChange={(e) => setActiveZone(e.target.value)}
                className="form-select"
                style={{
                  width: '100%',
                  fontSize: 11,
                  fontWeight: 600,
                  height: 30,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'var(--glass-bg-card)',
                  borderColor: 'var(--glass-border-light)'
                }}
                title="Switch Operational Disaster Sector in India"
                aria-label="Disaster Sector"
              >
                {ZONES.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={onToggleCollapse}
              title={`Active Sector: ${currentZoneLabel} (Click to change)`}
              style={{
                width: 34,
                height: 28,
                margin: '0 auto',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--glass-bg-card)',
                border: '1px solid var(--glass-border-light)',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              {currentZoneShort}
            </button>
          )}
        </div>

        {/* Scrollable Nav & Actions Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Navigation Section */}
          <div style={{ padding: isCollapsed ? '10px 6px' : '10px 8px' }}>
            {!isCollapsed && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px 6px' }}>
                Navigation
              </div>
            )}
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id as any)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? 0 : 10,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '7px 0' : '8px 10px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(255,153,51,0.12)' : 'transparent',
                    color: isActive ? 'var(--tiranga-saffron)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    marginBottom: 3,
                    transition: 'all 0.14s ease',
                    position: 'relative',
                    borderLeft: isCollapsed ? 'none' : (isActive ? '2px solid var(--tiranga-saffron)' : '2px solid transparent'),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      borderRadius: 6,
                      background: isCollapsed && isActive ? 'rgba(255,153,51,0.18)' : 'transparent',
                      color: isActive ? 'var(--tiranga-saffron)' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isCollapsed && item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 8,
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#ef4444',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: isCollapsed ? '4px 8px' : '0 12px' }} />

          {/* Quick Actions */}
          <div style={{ padding: isCollapsed ? '10px 6px' : '10px 8px' }}>
            {!isCollapsed && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px 6px' }}>
                Actions
              </div>
            )}

            {/* Report Incident */}
            <button
              onClick={() => handleAction(onOpenReportModal)}
              title={isCollapsed ? '+ Report Incident' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? 0 : 10,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '7px 0' : '8px 10px',
                borderRadius: 7,
                cursor: 'pointer',
                marginBottom: 3,
                background: 'rgba(234, 88, 12, 0.12)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#f97316',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.14s ease',
              }}
            >
              <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={15} />
              </span>
              {!isCollapsed && <span>+ Report Incident</span>}
            </button>

            {/* Sync Feeds */}
            <button
              onClick={() => handleAction(onSyncExternalFeeds)}
              disabled={isSyncingFeeds}
              title={isCollapsed ? 'Sync Disaster Feeds' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? 0 : 10,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '7px 0' : '8px 10px',
                borderRadius: 7,
                cursor: isSyncingFeeds ? 'not-allowed' : 'pointer',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                opacity: isSyncingFeeds ? 0.6 : 1,
                transition: 'all 0.14s ease',
                marginBottom: 3,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={15} color="#38bdf8" className={isSyncingFeeds ? 'spin-anim' : ''} />
              </span>
              {!isCollapsed && <span>{isSyncingFeeds ? 'Syncing...' : 'Sync Feeds'}</span>}
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: isCollapsed ? '4px 8px' : '0 12px' }} />

          {/* Tools Section */}
          <div style={{ padding: isCollapsed ? '10px 6px' : '10px 8px' }}>
            {!isCollapsed && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px 6px' }}>
                Tools
              </div>
            )}

            {[
              { icon: <Radio size={15} color="#38bdf8" />, label: 'Live Feeds', action: onOpenFeedsModal, title: 'NASA EONET, USGS, GDACS' },
              { icon: <Activity size={15} color="#16a34a" />, label: 'System Health', action: onOpenMetricsModal, title: 'API Health (9/9)', extra: <span style={{ background: '#16a34a', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 8 }}>9/9</span> },
              { icon: <Sliders size={15} color="#FF9933" />, label: 'AI Simulation', action: onOpenSimulationModal, title: 'Disaster Simulation Drill' },
              { icon: <Rss size={15} color="#f85149" />, label: 'CAP Broadcast', action: onOpenBroadcastModal, title: 'NDMA Emergency Broadcast' },
              { icon: <FileText size={15} color="var(--text-secondary)" />, label: 'Audit Logs', action: onOpenAuditModal, title: 'Operational Audit Trail' },
            ].map((tool) => (
              <button
                key={tool.label}
                onClick={() => handleAction(tool.action)}
                title={isCollapsed ? tool.title || tool.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? 0 : 10,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '7px 0' : '8px 10px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 3,
                  transition: 'all 0.14s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {tool.icon}
                </span>
                {!isCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>{tool.label}</span>}
                {!isCollapsed && tool.extra}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section: Telemetry + User Controls */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {/* WS Connection Status */}
          {!isCollapsed && (
            <div
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 10,
                color: wsConnected ? '#16a34a' : '#f59e0b',
                fontWeight: 600,
              }}
            >
              {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{wsConnected ? 'WebSocket Live' : 'Connecting...'}</span>
              {totalActiveCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {totalActiveCount} active
                </span>
              )}
            </div>
          )}

          {/* Dedicated Theme Switch Card */}
          <div
            onClick={onToggleTheme}
            style={{
              margin: isCollapsed ? '6px 4px' : '6px 10px',
              padding: isCollapsed ? '6px 4px' : '7px 10px',
              borderRadius: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              transition: 'all 0.15s ease',
              userSelect: 'none'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {theme === 'dark' ? <Sun size={15} color="#FF9933" /> : <Moon size={15} color="#2563eb" />}
              {!isCollapsed && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 8,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)'
                }}
              >
                {theme === 'dark' ? '☀️ Day' : '🌙 Night'}
              </span>
            )}
          </div>

          {/* Controls Bar */}
          <div
            style={{
              padding: isCollapsed ? '8px 6px 12px' : '6px 10px 10px',
              display: 'flex',
              flexDirection: isCollapsed ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: isCollapsed ? 4 : 2,
            }}
          >
            {/* Alert Center Button */}
            <button
              onClick={() => handleAction(onOpenAlertCenter)}
              title="Alert Center Notifications"
              aria-label="Alert Center"
              style={{
                width: 32,
                height: 32,
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6,
                color: '#FF9933',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <Bell size={16} />
              {unreadAlertCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#f85149',
                    border: '1.5px solid var(--bg-surface)',
                  }}
                />
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setAudioMuted(!audioMuted)}
              title={audioMuted ? 'Unmute alerts audio' : 'Mute alerts audio'}
              aria-label="Toggle Audio"
              style={{
                width: 32,
                height: 32,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6,
                color: audioMuted ? 'var(--text-muted)' : '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>


            {/* Offline Status */}
            <div
              title="PWA Offline/Online Sync Telemetry"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <OfflineIndicator compact={isCollapsed} />
            </div>

            {/* User / Auth */}
            {!isCollapsed ? (
              <button
                onClick={() => handleAction(onOpenAuthModal)}
                title="Account / Session"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  maxWidth: 100,
                  marginLeft: 'auto',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <UserCheck size={14} color="#38bdf8" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>
                  {currentUser?.username === 'guest_citizen' ? 'Sign In' : currentUser?.fullName?.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleAction(onOpenAuthModal)}
                title="User Account"
                style={{
                  width: 32,
                  height: 32,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-active)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <UserCheck size={16} color="#38bdf8" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ─── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className={`aegis-sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
        aria-label="Main navigation"
      >
        {renderContent(false)}
      </aside>

      {/* ─── Mobile Top Bar ──────────────────────────────── */}
      <div className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Open mobile menu"
          >
            <Menu size={20} />
          </button>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
            onClick={() => handleNav('dashboard')}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: '#1e3a8a',
                border: '1px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              AEGISOPS <span style={{ color: 'var(--tiranga-saffron)', fontSize: 10 }}>BHARAT</span>
            </span>
          </div>

          {/* Quick Sector Indicator */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title={`Active Sector: ${currentZoneLabel}. Tap to change.`}
          >
            {currentZoneShort}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Quick Mode Toggle */}
          <button
            onClick={() => setOperationalMode(isLive ? 'SIMULATION' : 'LIVE')}
            style={{
              padding: '3px 7px',
              borderRadius: 5,
              background: isLive ? 'rgba(22, 163, 74, 0.15)' : 'rgba(255, 153, 51, 0.2)',
              border: `1px solid ${isLive ? 'rgba(22, 163, 74, 0.45)' : 'rgba(255, 153, 51, 0.55)'}`,
              color: isLive ? '#4ade80' : 'var(--tiranga-saffron)',
              fontSize: 9.5,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title={`Operational Mode: ${operationalMode}. Tap to toggle.`}
          >
            {isLive ? 'LIVE' : 'SIM'}
          </button>

          {/* Mobile Theme Switch Button */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary"
            style={{ padding: '4px 7px', height: 28, display: 'flex', alignItems: 'center', gap: 4 }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={13} color="#FF9933" /> : <Moon size={13} color="#1d4ed8" />}
          </button>

          {criticalCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>
              {criticalCount} CRITICAL
            </span>
          )}
          <button
            onClick={onOpenReportModal}
            style={{
              background: '#ea580c',
              border: '1px solid #f97316',
              color: '#fff',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            + Report
          </button>
        </div>
      </div>

      {/* ─── Mobile Drawer Overlay ───────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1500,
            display: 'flex',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Body */}
          <div
            style={{
              position: 'relative',
              width: 270,
              maxWidth: '85vw',
              height: '100%',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
              animation: 'slideInLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative',
              }}
            >
              {/* Tiranga line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%, #138808 100%)',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: '#1e3a8a',
                    border: '1px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={14} color="#ffffff" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  AEGISOPS <span style={{ color: 'var(--tiranga-saffron)', fontSize: 10 }}>BHARAT</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Nav Bar ────────────────────────── */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id as any)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: '6px 4px',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--tiranga-saffron)' : 'var(--text-muted)',
                fontSize: 9.5,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                borderTop: isActive ? '2px solid var(--tiranga-saffron)' : '2px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 'calc(50% - 14px)',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />
              )}
            </button>
          );
        })}
        <button
          onClick={onOpenAlertCenter}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            padding: '6px 4px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 9.5,
            fontWeight: 500,
            cursor: 'pointer',
            position: 'relative',
            borderTop: '2px solid transparent',
          }}
        >
          <Bell size={17} />
          <span>Alerts</span>
          {unreadAlertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 'calc(50% - 14px)',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#f85149',
              }}
            />
          )}
        </button>
      </nav>
    </>
  );
};
