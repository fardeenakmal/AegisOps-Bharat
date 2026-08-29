import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LiveMap } from './components/LiveMap';
import { IncidentQueue } from './components/IncidentQueue';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { CitizenReportingModal } from './components/CitizenReportingModal';
import { ResponderView } from './components/ResponderView';
import { HospitalTriagePanel } from './components/HospitalTriagePanel';
import { StateNationalRollup } from './components/StateNationalRollup';
import { PublicReportPortal } from './components/PublicReportPortal';
import { PredictionSimulationModal } from './components/PredictionSimulationModal';
import { BroadcastModal } from './components/BroadcastModal';
import { AuditLogModal } from './components/AuditLogModal';
import { MetricsHealthModal } from './components/MetricsHealthModal';
import { AuthModal } from './components/AuthModal';
import {
  fetchIncidents,
  fetchResources,
  fetchHospitals,
  fetchPredictions,
  syncExternalFeeds
} from './services/api';
import { Incident, Resource, Hospital, PredictionAlert, UserRole } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>({
    username: 'operator_mumbai',
    fullName: 'Capt. Rajesh Kadam',
    role: 'CONTROL_ROOM_OPERATOR',
    zoneId: 'zone-mh-mum'
  });
  const [activeRole, setActiveRole] = useState<UserRole>('CONTROL_ROOM_OPERATOR');
  const [activeZone, setActiveZone] = useState<string>('zone-ndma-in');
  const [activeView, setActiveView] = useState<'dashboard' | 'responder' | 'hospital' | 'command' | 'public-report'>('dashboard');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [predictions, setPredictions] = useState<PredictionAlert[]>([]);
  const [isSyncingFeeds, setIsSyncingFeeds] = useState<boolean>(false);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showMetricsModal, setShowMetricsModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Service Worker Registration for Offline PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('[PWA Service Worker] Registration notice:', err);
      });
    }
  }, []);

  // Web Audio Synthesizer for Critical Emergency Chime
  const playEmergencyChime = () => {
    if (audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, [activeZone]);

  const loadAllData = async () => {
    try {
      const [incList, resList, hospList, predList] = await Promise.all([
        fetchIncidents({ zone: activeZone }),
        fetchResources({ zone: activeZone }),
        fetchHospitals(activeZone),
        fetchPredictions(activeZone)
      ]);
      setIncidents(incList);
      setResources(resList);
      setHospitals(hospList);
      setPredictions(predList);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  // WebSocket Live Stream
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = (import.meta as any).env?.VITE_API_URL;
    const wsHost = apiUrl
      ? apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : window.location.host;
    const wsUrl = `${protocol}//${wsHost}/ws/incidents`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log('[WebSocket Live Event]', msg);

          if (
            msg.type === 'INCIDENT_CREATED' ||
            msg.type === 'INCIDENT_UPDATED' ||
            msg.type === 'INCIDENT_MERGED' ||
            msg.type === 'REPORT_SUBMITTED' ||
            msg.type === 'DISPATCH_CREATED' ||
            msg.type === 'RESOURCE_STATUS_CHANGED' ||
            msg.type === 'HOSPITAL_CAPACITY_UPDATED' ||
            msg.type === 'PREDICTION_ALERT_ISSUED'
          ) {
            if (msg.data?.incident?.severityLabel === 'CRITICAL' || msg.data?.slaBreach) {
              playEmergencyChime();
            }
            loadAllData();
          }

          if (msg.type === 'PUBLIC_BROADCAST') {
            playEmergencyChime();
            alert(`🚨 EMERGENCY BROADCAST: ${msg.data.info?.headline || 'High Priority Alert Issued'}`);
          }
        } catch (err) {
          console.error(err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      setWsConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [audioMuted]);

  const handleSyncExternalFeeds = async () => {
    setIsSyncingFeeds(true);
    try {
      await syncExternalFeeds();
      await loadAllData();
    } catch (err: any) {
      alert(`External sync notice: ${err.message}`);
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

  const [mobileDashboardTab, setMobileDashboardTab] = useState<'map' | 'queue' | 'split'>('split');

  const handleSelectIncidentMobile = (inc: Incident) => {
    setSelectedIncident(inc);
    // If on narrow screen and on queue tab, switch to map to show location
    if (window.innerWidth <= 768 && mobileDashboardTab === 'queue') {
      setMobileDashboardTab('map');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000' }}>
      {/* Top Navbar */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        currentUser={currentUser}
        activeZone={activeZone}
        setActiveZone={setActiveZone}
        wsConnected={wsConnected}
        criticalCount={criticalCount}
        totalActiveCount={totalActiveCount}
        audioMuted={audioMuted}
        setAudioMuted={setAudioMuted}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenSimulationModal={() => setShowSimulationModal(true)}
        onOpenAuditModal={() => setShowAuditModal(true)}
        onOpenBroadcastModal={() => setShowBroadcastModal(true)}
        onOpenMetricsModal={() => setShowMetricsModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        isSyncingFeeds={isSyncingFeeds}
        onSyncExternalFeeds={handleSyncExternalFeeds}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column' }}>
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
              className="dashboard-grid"
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: 10,
                minHeight: 'calc(100vh - 110px)'
              }}
            >
              {/* Left: GIS Live Map */}
              <div
                className="mobile-map-container"
                style={{
                  height: '100%',
                  minHeight: 350,
                  display: mobileDashboardTab === 'queue' && window.innerWidth <= 768 ? 'none' : 'block'
                }}
              >
                <LiveMap
                  incidents={incidents}
                  resources={resources}
                  hospitals={hospitals}
                  predictions={predictions}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncidentMobile}
                  activeZone={activeZone}
                />
              </div>

              {/* Right: Real-time Incident Triage Queue */}
              <div
                className="mobile-queue-container"
                style={{
                  height: '100%',
                  minHeight: 380,
                  display: mobileDashboardTab === 'map' && window.innerWidth <= 768 ? 'none' : 'block'
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

        {activeView === 'public-report' && (
          <PublicReportPortal
            onReportSubmitted={loadAllData}
            onNavigateToWarRoom={() => setActiveView('dashboard')}
          />
        )}
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

      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user, token) => {
            setCurrentUser(user);
            setActiveRole(user.role);
            if (user.zoneId) setActiveZone(user.zoneId);
            loadAllData();
          }}
        />
      )}
    </div>
  );
};

export default App;
