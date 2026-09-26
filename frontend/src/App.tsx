import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { LiveMap } from './components/LiveMap';
import { IncidentQueue } from './components/IncidentQueue';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { CitizenReportingModal } from './components/CitizenReportingModal';
import { ResponderView } from './components/ResponderView';
import { HospitalTriagePanel } from './components/HospitalTriagePanel';
import { StateNationalRollup } from './components/StateNationalRollup';
import { PredictionSimulationModal } from './components/PredictionSimulationModal';
import { BroadcastModal } from './components/BroadcastModal';
import { AuditLogModal } from './components/AuditLogModal';
import { MetricsHealthModal } from './components/MetricsHealthModal';
import { AuthModal } from './components/AuthModal';
import { LiveDisasterFeedsModal } from './components/LiveDisasterFeedsModal';
import {
  fetchIncidents,
  fetchResources,
  fetchHospitals,
  fetchPredictions,
  fetchZones,
  fetchAlerts,
  syncExternalFeeds,
  clearSimulationDrill
} from './services/api';
import { Incident, Resource, Hospital, PredictionAlert, UserRole } from './types';
import { AlertCenterDrawer, AlertItem } from './components/AlertCenterDrawer';
import { soundAlertService } from './services/soundAlertService';
import { emergencyStompClient } from './services/stompClient';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('aegisops_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      username: 'guest_citizen',
      fullName: 'Public Citizen (Guest)',
      role: 'CITIZEN',
      zoneId: 'zone-ndma-in'
    };
  });
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('aegisops_user');
      if (saved) return JSON.parse(saved).role || 'CITIZEN';
    } catch {}
    return 'CITIZEN';
  });
  const [activeZone, setActiveZone] = useState<string>('zone-ndma-in');
  const [activeView, setActiveView] = useState<'dashboard' | 'responder' | 'hospital' | 'command'>(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'responder', 'hospital', 'command'].includes(hash)) return hash as any;
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      window.location.hash = activeView;
    } catch {}
  }, [activeView]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'responder', 'hospital', 'command'].includes(hash)) {
        setActiveView(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [operationalMode, setOperationalMode] = useState<'LIVE' | 'SIMULATION'>('LIVE');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aegisops_sidebar_collapsed') === 'true';
    } catch { return false; }
  });

  const handleToggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('aegisops_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('aegisops_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('aegisops_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [predictions, setPredictions] = useState<PredictionAlert[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertCenter, setShowAlertCenter] = useState<boolean>(false);
  const [isSyncingFeeds, setIsSyncingFeeds] = useState<boolean>(false);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(() => soundAlertService.getPreferences().isMuted);

  const handleToggleMute = (muted: boolean) => {
    setAudioMuted(muted);
    soundAlertService.setMuted(muted);
  };

  // Modals
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showMetricsModal, setShowMetricsModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showFeedsModal, setShowFeedsModal] = useState<boolean>(false);

  // Service Worker Registration for Offline PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('[PWA Service Worker] Registration notice:', err);
      });
    }
  }, []);

  // Initial Load & Zone-driven Refetch
  useEffect(() => {
    loadAllData();
  }, [activeZone]);

  const loadAllData = async () => {
    try {
      const [incList, resList, hospList, predList, zoneList, alertList] = await Promise.all([
        fetchIncidents({ zone: activeZone }).catch(() => []),
        fetchResources({ zone: activeZone }).catch(() => []),
        fetchHospitals(activeZone).catch(() => []),
        fetchPredictions(activeZone).catch(() => []),
        fetchZones().catch(() => []),
        fetchAlerts().catch(() => [])
      ]);
      setIncidents(incList || []);
      setResources(resList || []);
      setHospitals(hospList || []);
      setPredictions(predList || []);
      setZones(zoneList || []);
      setAlerts(alertList || []);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  // Real-Time STOMP over SockJS Live Telemetry & Alerts
  useEffect(() => {
    const unsubStatus = emergencyStompClient.onStatusChange((status) => {
      setWsConnected(status === 'CONNECTED');
    });

    const unsubEvents = emergencyStompClient.on('*', (eventType, data) => {
      console.log('[STOMP Live Event]', eventType, data);

      if (eventType === 'ALERT_ISSUED' || eventType === 'ALERT_BROADCAST') {
        const severity = data?.alert?.severity || data?.severity || 'HIGH';
        soundAlertService.playAlertChime(severity);
        loadAllData();
      } else if (
        eventType === 'REQUEST_CREATED' ||
        eventType === 'INCIDENT_CREATED' ||
        eventType === 'REQUEST_OVERRIDDEN' ||
        eventType === 'REQUEST_PRIORITY_OVERRIDDEN' ||
        eventType === 'REQUEST_ASSIGNED' ||
        eventType === 'ASSIGNMENT_CREATED' ||
        eventType === 'TEAM_STATUS_UPDATED' ||
        eventType === 'RESOURCE_STATUS_CHANGED'
      ) {
        if (data?.priorityLevel === 'CRITICAL' || data?.isLifeThreatening || data?.severityLabel === 'CRITICAL') {
          soundAlertService.playAlertChime('CRITICAL');
        } else {
          soundAlertService.playAlertChime('MEDIUM');
        }
        loadAllData();
      } else {
        loadAllData();
      }
    });

    const token = localStorage.getItem('aegisops_token') || undefined;
    emergencyStompClient.connect(token);
    if (activeZone) {
      emergencyStompClient.subscribeZone(activeZone);
    }

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [activeZone]);

  const unreadAlertCount = alerts.filter((a) => {
    try {
      const readSet = new Set(JSON.parse(localStorage.getItem('aegisops_read_alerts') || '[]'));
      return !readSet.has(a.id);
    } catch {
      return true;
    }
  }).length;

  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showGlobalToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  const handleSyncExternalFeeds = async () => {
    setIsSyncingFeeds(true);
    try {
      await syncExternalFeeds();
      await loadAllData();
      showGlobalToast('Real external disaster feeds synchronized (USGS, NASA EONET, GDACS, IMD).');
    } catch (err: any) {
      showGlobalToast(`External sync notice: ${err.message}`);
    } finally {
      setIsSyncingFeeds(false);
    }
  };

  const criticalCount = incidents.filter(
    (i) => i.severityLabel === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  ).length;

  const totalActiveCount = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  ).length;

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const [mobileDashboardTab, setMobileDashboardTab] = useState<'map' | 'queue' | 'split'>(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768 ? 'map' : 'split';
  });

  const handleSelectIncidentMobile = (inc: Incident) => {
    setSelectedIncident(inc);
    // If on narrow screen and on queue tab, switch to map to show location
    if (window.innerWidth <= 768 && mobileDashboardTab === 'queue') {
      setMobileDashboardTab('map');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const sidebarWidth = sidebarCollapsed ? 60 : 240;

  return (
    <div className="sidebar-layout">
      {/* ─── Left Sidebar ─────────────────────────────── */}
      <Sidebar
        activeRole={activeRole}
        currentUser={currentUser}
        activeZone={activeZone}
        setActiveZone={setActiveZone}
        wsConnected={wsConnected}
        criticalCount={criticalCount}
        totalActiveCount={totalActiveCount}
        unreadAlertCount={unreadAlertCount}
        audioMuted={audioMuted}
        setAudioMuted={handleToggleMute}
        theme={theme}
        onToggleTheme={toggleTheme}
        operationalMode={operationalMode}
        setOperationalMode={setOperationalMode}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAlertCenter={() => setShowAlertCenter(true)}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenSimulationModal={() => setShowSimulationModal(true)}
        onOpenAuditModal={() => setShowAuditModal(true)}
        onOpenBroadcastModal={() => setShowBroadcastModal(true)}
        onOpenMetricsModal={() => setShowMetricsModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenFeedsModal={() => setShowFeedsModal(true)}
        isSyncingFeeds={isSyncingFeeds}
        onSyncExternalFeeds={handleSyncExternalFeeds}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* ─── Main Content ─────────────────────────────── */}
      <div
        className="sidebar-main-content"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        {/* Global Toast */}
        {globalToast && (
          <div
            className="toast-notification"
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 9999,
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'fadeIn 0.2s ease-out',
              maxWidth: 360,
            }}
          >
            <span style={{ color: '#38bdf8' }}>●</span>
            <span style={{ flex: 1 }}>{globalToast}</span>
            <button
              onClick={() => setGlobalToast(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, marginLeft: 8 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Simulation Drill Active Banner */}
        {operationalMode === 'SIMULATION' && (
          <div className="drill-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'var(--tiranga-saffron)', color: '#ffffff', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                SIMULATION DRILL ACTIVE
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Civil Defense Multi-District Disaster Exercise Sandbox
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setShowSimulationModal(true)} className="btn btn-saffron" style={{ fontSize: 11, padding: '4px 10px', height: 28 }}>
                ⚡ Inject Scenario
              </button>
              <button
                onClick={async () => {
                  try {
                    await clearSimulationDrill();
                    await loadAllData();
                    showGlobalToast('Simulation drill data cleared. Live baseline restored.');
                  } catch (e: any) {
                    showGlobalToast(`Clear notice: ${e.message}`);
                  }
                }}
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '4px 10px', height: 28, color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                title="Purge all simulated drill alerts and distress requests"
              >
                🗑️ Clear Drill
              </button>
              <button onClick={() => setOperationalMode('LIVE')} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px', height: 28 }}>
                ↩️ Live Ops
              </button>
            </div>
          </div>
        )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: isMobile ? '4px' : '8px', display: 'flex', flexDirection: 'column' }}>
        {activeView === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            {/* Mobile View Switcher (Visible only on <= 768px) */}
            <div
              className="mobile-only-block"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}
            >
              <div className="segmented-control" style={{ width: '100%' }}>
                <button
                  onClick={() => setMobileDashboardTab('map')}
                  className={`segmented-btn ${mobileDashboardTab === 'map' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                >
                  🗺️ Map View
                </button>
                <button
                  onClick={() => setMobileDashboardTab('queue')}
                  className={`segmented-btn ${mobileDashboardTab === 'queue' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                >
                  🚨 Incident Feed ({incidents.length})
                </button>
                <button
                  onClick={() => setMobileDashboardTab('split')}
                  className={`segmented-btn ${mobileDashboardTab === 'split' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                >
                  ☷ Split View
                </button>
              </div>
            </div>

            <div
              className={`dashboard-grid mobile-tab-${mobileDashboardTab}`}
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: 10,
                minHeight: 'calc(100vh - 16px)'
              }}
            >
              {/* Left: GIS Live Map */}
              <div
                className="mobile-map-container"
                style={{
                  height: '100%',
                  minHeight: 350
                }}
              >
                <LiveMap
                  incidents={incidents}
                  resources={resources}
                  hospitals={hospitals}
                  predictions={predictions}
                  zones={zones}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncidentMobile}
                  activeZone={activeZone}
                  theme={theme}
                />
              </div>

              {/* Right: Real-time Incident Triage Queue */}
              <div
                className="mobile-queue-container"
                style={{
                  height: '100%',
                  minHeight: 380
                }}
              >
                <IncidentQueue
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncidentMobile}
                  onOpenDispatch={(inc) => setSelectedIncident(inc)}
                  onRefresh={handleManualRefresh}
                  isRefreshing={isRefreshing}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'responder' && (
          <ResponderView
            resources={resources}
            incidents={incidents}
            onStatusUpdated={loadAllData}
          />
        )}

        {activeView === 'hospital' && (
          <HospitalTriagePanel
            hospitals={hospitals}
            onCapacityUpdated={loadAllData}
          />
        )}

        {activeView === 'command' && <StateNationalRollup />}
      </main>

      {/* Modals & Inspection Drawers */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={(updated) => {
            setSelectedIncident(updated);
            loadAllData();
          }}
        />
      )}

      {showReportModal && (
        <CitizenReportingModal
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={() => {
            loadAllData();
          }}
        />
      )}

      {showSimulationModal && (
        <PredictionSimulationModal
          onClose={() => setShowSimulationModal(false)}
          onSimulationCompleted={loadAllData}
        />
      )}

      {showBroadcastModal && (
        <BroadcastModal onClose={() => setShowBroadcastModal(false)} />
      )}

      {showAuditModal && (
        <AuditLogModal onClose={() => setShowAuditModal(false)} />
      )}

      {showMetricsModal && (
        <MetricsHealthModal onClose={() => setShowMetricsModal(false)} />
      )}

      {showFeedsModal && (
        <LiveDisasterFeedsModal
          onClose={() => setShowFeedsModal(false)}
          activeZone={activeZone}
        />
      )}

      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user, token) => {
            setCurrentUser(user);
            setActiveRole(user.role);
            if (user.zoneId) setActiveZone(user.zoneId);
            if (token) {
              localStorage.setItem('aegisops_user', JSON.stringify(user));
            } else {
              localStorage.removeItem('aegisops_user');
            }
            loadAllData();
          }}
        />
      )}

      {/* Persistent Real-Time Alert Center Drawer */}
      <AlertCenterDrawer
        isOpen={showAlertCenter}
        onClose={() => setShowAlertCenter(false)}
        alerts={alerts}
        onSelectAlert={(alert) => {
          setShowAlertCenter(false);
          const found = incidents.find((i) => i.id === alert.id || i.zoneId === alert.zoneId);
          if (found) setSelectedIncident(found);
        }}
      />
    </div>
    </div>
  );
};

export default App;
