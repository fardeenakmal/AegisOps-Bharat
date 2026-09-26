import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Search,
  ArrowRight,
  Flame,
  Droplets,
  Building,
  Activity,
  Zap,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertOctagon,
  Timer
} from 'lucide-react';
import { DataProvenanceBadge } from './DataProvenanceBadge';

interface IncidentQueueProps {
  incidents: any[];
  selectedIncident: any | null;
  onSelectIncident: (incident: any) => void;
  onOpenDispatch: (incident: any) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenDispatch,
  onRefresh,
  isRefreshing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'LIFE_THREATENING' | 'FLOOD' | 'FIRE'>('ALL');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update aging timer tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getPriorityScore = (item: any): number => {
    return item.priorityScore ?? item.severityScore ?? 50.0;
  };

  const getPriorityLevel = (item: any): string => {
    return item.priorityLevel ?? item.severityLabel ?? 'MEDIUM';
  };

  const getCategory = (item: any): string => {
    if (item.category) return item.category;
    if (item.isLifeThreatening || getPriorityLevel(item) === 'CRITICAL') return 'LIFE_THREATENING';
    return 'PROPERTY_DAMAGE';
  };

  const filteredIncidents = incidents.filter((inc) => {
    const level = getPriorityLevel(inc);
    const cat = getCategory(inc);
    const type = inc.incidentType ?? inc.type ?? 'OTHER';

    if (selectedFilter === 'CRITICAL' && level !== 'CRITICAL') return false;
    if (selectedFilter === 'LIFE_THREATENING' && cat !== 'LIFE_THREATENING') return false;
    if (selectedFilter === 'FLOOD' && type !== 'FLOOD') return false;
    if (selectedFilter === 'FIRE' && type !== 'FIRE') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (inc.title || '').toLowerCase();
      const addr = (inc.address || inc.reportedAddress || '').toLowerCase();
      const code = (inc.trackingCode || inc.trackingId || '').toLowerCase();
      return title.includes(q) || addr.includes(q) || code.includes(q);
    }
    return true;
  });

  const getIncidentIcon = (type: string) => {
    switch ((type || '').toUpperCase()) {
      case 'EARTHQUAKE':
        return <Zap size={13} color="#f59e0b" />;
      case 'FLOOD':
      case 'URBAN_INUNDATION':
        return <Droplets size={13} color="#38bdf8" />;
      case 'FIRE':
        return <Flame size={13} color="#f87171" />;
      case 'CYCLONE':
        return <Radio size={13} color="#c084fc" />;
      default:
        return <AlertTriangle size={13} color="#ef4444" />;
    }
  };

  const calculateSlaStatus = (item: any) => {
    const targetMins = item.slaTargetMinutes || (getPriorityLevel(item) === 'CRITICAL' ? 10 : 20);
    const reportedAt = item.reportedAt || item.createdAt || new Date().toISOString();
    const reportedTime = new Date(reportedAt).getTime();
    const elapsedMins = (currentTime - reportedTime) / (1000 * 60);
    const remainingMins = Math.round(targetMins - elapsedMins);

    const isBreached = remainingMins < 0;
    const absRemaining = Math.abs(remainingMins);
    const formatted = `${absRemaining}m`;

    return {
      targetMins,
      remainingMins,
      isBreached,
      text: isBreached ? `BREACHED +${formatted}` : `${formatted} remaining`
    };
  };

  const getIncidentSourceInfo = (inc: any) => {
    const channel = inc.reports?.[0]?.submissionChannel || inc.submissionChannel || inc.source;
    const reporter = inc.reporterName || inc.reports?.[0]?.reporterName;
    const contact = inc.reporterContact || inc.reports?.[0]?.reporterContact;
    const zoneId = inc.zoneId || '';
    const title = (inc.title || '').toLowerCase();
    const tracking = (inc.trackingCode || '').toLowerCase();

    let sourceLabel = 'Citizen 112 Helpline';
    let sourceBadge = '112 INTAKE';
    let icon = '📞';

    if (channel === 'PWA' || channel === 'WEB') {
      sourceLabel = 'Citizen PWA Portal';
      sourceBadge = 'VERIFIED APP';
      icon = '📱';
    } else if (channel === 'WHATSAPP' || channel === 'BOT') {
      sourceLabel = 'AegisOps WhatsApp Bot';
      sourceBadge = 'AI BOT';
      icon = '💬';
    } else if (channel === 'API' || tracking.includes('nasa') || title.includes('nasa') || title.includes('satellite')) {
      sourceLabel = 'NASA EONET Satellite Ingestion';
      sourceBadge = 'SATELLITE';
      icon = '🛰️';
    } else if (tracking.includes('usgs') || title.includes('usgs') || inc.incidentType === 'EARTHQUAKE' || inc.type === 'EARTHQUAKE') {
      sourceLabel = 'USGS / IMD Seismic Sensor Feed';
      sourceBadge = 'SENSOR NET';
      icon = '📡';
    } else if (zoneId.includes('mum')) {
      sourceLabel = 'BMC Disaster Control (Mumbai 1916)';
      sourceBadge = 'BMC MUNICIPAL';
      icon = '🏛️';
    } else if (zoneId.includes('dl') || zoneId.includes('ncr')) {
      sourceLabel = 'DDMA Emergency Helpline (Delhi 1077)';
      sourceBadge = 'DDMA OPS';
      icon = '🏛️';
    } else if (zoneId.includes('blr') || zoneId.includes('ka')) {
      sourceLabel = 'BBMP Disaster Cell (Bengaluru 1533)';
      sourceBadge = 'BBMP WAR ROOM';
      icon = '🏛️';
    } else if (contact) {
      sourceLabel = `Citizen Helpline (${contact.substring(0, Math.min(contact.length, 7))}***)`;
      sourceBadge = 'CALLER VERIFIED';
      icon = '📞';
    }

    const langCode = inc.detectedLanguage || 'en';
    const langName = langCode === 'hi' ? 'Hindi NLP' : langCode === 'mr' ? 'Marathi NLP' : langCode === 'kn' ? 'Kannada NLP' : langCode === 'ta' ? 'Tamil NLP' : 'English NLP';

    return {
      sourceLabel,
      sourceBadge,
      icon,
      reporter: reporter ? `${reporter}` : 'Citizen Caller',
      langName
    };
  };

  return (
    <div
      className="vercel-panel"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: 'var(--bg-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              Emergency Request Queue
            </span>
            <span className="gh-counter" style={{ flexShrink: 0 }}>{filteredIncidents.length}</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: 11, height: 26, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
              title="Refresh Incident Stream"
            >
              <RefreshCw size={11} className={isRefreshing ? 'spin-anim' : ''} color="#38bdf8" />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>
          Real-time AI Triage &bull; SLA Dispatch Priority
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Filter requests by tracking #, area, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 32, paddingRight: 10, fontSize: 12, height: 32, background: 'var(--bg-input)' }}
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="segmented-control" style={{ width: '100%', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 2 }}>
          {[
            { id: 'ALL', label: 'All', count: incidents.length },
            { id: 'CRITICAL', label: 'Critical', count: incidents.filter((i) => getPriorityLevel(i) === 'CRITICAL').length },
            { id: 'LIFE_THREATENING', label: 'Life-Saving', count: incidents.filter((i) => getCategory(i) === 'LIFE_THREATENING').length },
            { id: 'FLOOD', label: 'Floods', count: incidents.filter((i) => (i.incidentType || i.type) === 'FLOOD').length },
            { id: 'FIRE', label: 'Fires', count: incidents.filter((i) => (i.incidentType || i.type) === 'FIRE').length }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id as any)}
              className={`segmented-btn ${selectedFilter === f.id ? 'active' : ''}`}
              style={{ flex: 1, minWidth: 60, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 8px' }}
            >
              <span>{f.label}</span>
              <span style={{ opacity: 0.75, fontSize: 10 }} className="num-tabular">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Incident / Emergency Request Cards List */}
      <div
        role="region"
        aria-label="Active Emergency Requests Queue"
        aria-live="polite"
        style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
            <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>No emergency requests in queue</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>All incoming citizen requests have been resolved or filtered.</div>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const level = getPriorityLevel(inc);
            const score = getPriorityScore(inc);
            const cat = getCategory(inc);
            const isCritical = level === 'CRITICAL';
            const isLifeThreat = cat === 'LIFE_THREATENING';
            const type = inc.incidentType ?? inc.type ?? 'OTHER';
            const sla = calculateSlaStatus(inc);
            const sourceInfo = getIncidentSourceInfo(inc);

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`vercel-card incident-card ${isSelected ? 'selected' : ''}`}
                style={{
                  position: 'relative',
                  padding: '11px 13px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1px solid var(--accent-cyan)'
                    : isCritical
                    ? '1px solid var(--status-critical-border)'
                    : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--accent-cyan-bg)' : 'var(--glass-bg-card)',
                  boxShadow: isSelected
                    ? '0 0 0 1px var(--accent-cyan), 0 4px 16px rgba(56, 189, 248, 0.15)'
                    : 'var(--glass-shadow-sm)',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  overflow: 'hidden'
                }}
              >
                {/* Left severity indicator bar - sleek and aligned */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: isSelected
                      ? 'var(--accent-cyan)'
                      : isLifeThreat
                      ? '#ef4444'
                      : isCritical
                      ? '#f85149'
                      : level === 'HIGH'
                      ? '#f59e0b'
                      : '#38bdf8'
                  }}
                />

                {/* Top Row: Type, Tracking Code, Life-Threatening Chip, Priority Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {getIncidentIcon(type)}
                    </span>
                    <span
                      className="num-tabular font-mono"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.02em',
                        flexShrink: 0
                      }}
                    >
                      #{inc.trackingCode || inc.trackingId || inc.id.substring(0, 10)}
                    </span>
                    {isLifeThreat && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          padding: '1px 5px',
                          borderRadius: 4,
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}
                      >
                        Life-Threatening
                      </span>
                    )}
                  </div>

                  <span
                    className={`badge ${
                      isCritical
                        ? 'badge-critical'
                        : level === 'HIGH'
                        ? 'badge-high'
                        : 'badge-medium'
                    }`}
                    style={{ flexShrink: 0, fontSize: 10, padding: '2px 7px' }}
                  >
                    <span className="badge-dot" />
                    <span>{level} &bull; {score.toFixed(0)}</span>
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                    marginBottom: 5,
                    wordBreak: 'break-word'
                  }}
                >
                  {inc.title}
                </div>

                {/* Source of Information & Data Provenance */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 10,
                    marginBottom: 7,
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--glass-bg-subtle)',
                      border: '1px solid var(--glass-border-light)',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}
                    title={`Source of Information: ${sourceInfo.sourceLabel} - Authenticity Verified`}
                  >
                    <span>{sourceInfo.icon}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--accent-cyan)' }}>{sourceInfo.sourceBadge}</span>
                    <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                    <span style={{ fontSize: 10 }}>{sourceInfo.sourceLabel}</span>
                  </div>

                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>👤 {sourceInfo.reporter}</span>
                    <span>&bull;</span>
                    <span style={{ color: 'var(--text-secondary)' }}>🌐 {sourceInfo.langName}</span>
                  </span>
                </div>

                {/* Address & GPS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {inc.address || inc.reportedAddress}
                  </span>
                  {inc.latitude && inc.longitude && (
                    <span className="num-tabular font-mono" style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 6, flexShrink: 0, opacity: 0.85 }}>
                      ({Number(inc.latitude).toFixed(2)}°, {Number(inc.longitude).toFixed(2)}°)
                    </span>
                  )}
                </div>

                {/* SLA Countdown & Tactical Assignment Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: 11
                  }}
                >
                  {/* SLA Aging badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      color: sla.isBreached ? '#ef4444' : 'var(--text-secondary)',
                      fontWeight: sla.isBreached ? 700 : 500,
                      fontSize: 10.5
                    }}
                    title={`Target SLA: ${sla.targetMins} minutes`}
                  >
                    <Timer size={12} color={sla.isBreached ? '#ef4444' : '#38bdf8'} />
                    <span className="num-tabular">{sla.text}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDispatch(inc);
                    }}
                    className="btn btn-primary"
                    style={{
                      padding: '3px 10px',
                      fontSize: 11,
                      height: 26,
                      borderRadius: 5,
                      background: 'var(--accent-blue)',
                      borderColor: 'var(--accent-blue)',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontWeight: 600
                    }}
                  >
                    <span>Assign Unit</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
