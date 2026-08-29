import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Incident, IncidentType, SeverityLabel } from '../types';

interface IncidentQueueProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  onOpenDispatch: (incident: Incident) => void;
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
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'EARTHQUAKE' | 'FLOOD' | 'OTHER'>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedFilter === 'CRITICAL' && inc.severityLabel !== 'CRITICAL') return false;
    if (selectedFilter === 'EARTHQUAKE' && inc.type !== 'EARTHQUAKE') return false;
    if (selectedFilter === 'FLOOD' && inc.type !== 'FLOOD') return false;
    if (selectedFilter === 'OTHER' && (inc.type === 'EARTHQUAKE' || inc.type === 'FLOOD')) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q) ||
        inc.trackingCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getIncidentIcon = (type: IncidentType) => {
    switch (type) {
      case 'EARTHQUAKE':
        return <Zap size={13} color="#f59e0b" />;
      case 'FLOOD':
        return <Droplets size={13} color="#38bdf8" />;
      case 'FIRE':
        return <Flame size={13} color="#f87171" />;
      default:
        return <AlertTriangle size={13} color="#ef4444" />;
    }
  };

  const getSourceLabel = (inc: Incident) => {
    if (inc.id.startsWith('inc-usgs')) {
      return {
        label: 'USGS Global Seismic Network',
        tag: 'USGS OFFICIAL',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)'
      };
    }
    if (inc.type === 'FLOOD' || inc.type === 'STORM_CYCLONE') {
      return {
        label: 'Open-Meteo Atmospheric Radar',
        tag: 'OPEN-METEO RADAR',
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.12)'
      };
    }
    return {
      label: '112 Citizen Dispatch / NDMA Triage',
      tag: '112 CITIZEN DISPATCH',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)'
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
      {/* Header & Refresh Action */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#ededed', letterSpacing: '-0.01em' }}>
              Live Incident Stream
            </h2>
            <span
              className="badge badge-low"
              style={{ padding: '1px 6px', fontSize: 10, fontFamily: 'monospace' }}
            >
              {filteredIncidents.length} Active
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#737373', marginTop: 2 }}>
            Real-time feed with verified source telemetry & SLA monitoring
          </p>
        </div>

        {/* Working Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
            title="Refresh Incident Stream"
          >
            <RefreshCw size={11} className={isRefreshing ? 'spin-anim' : ''} color="#38bdf8" />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* Vercel-Style Search Box & Filters */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#737373" style={{ position: 'absolute', left: 10 }} />
          <input
            type="text"
            placeholder="Search incident code, location, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 30, paddingRight: 36, fontSize: 12, height: 32 }}
          />
          <div style={{ position: 'absolute', right: 8 }}>
            <kbd>⌘K</kbd>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="segmented-control" style={{ width: '100%', justifyContent: 'space-between' }}>
          {[
            { id: 'ALL', label: `All (${incidents.length})` },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'EARTHQUAKE', label: 'USGS Quakes' },
            { id: 'FLOOD', label: 'Flood / Rain' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id as any)}
              className={`segmented-btn ${selectedFilter === f.id ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#737373' }}>
            <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: '#a1a1a1' }}>No incidents in selected sector</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Select "All Regions" to view all national and regional live disaster feeds.
            </div>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const isUsgs = inc.id.startsWith('inc-usgs');
            const isCritical = inc.severityLabel === 'CRITICAL';
            const source = getSourceLabel(inc);

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="vercel-card"
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid #38bdf8'
                    : isCritical
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.05)' : undefined
                }}
              >
                {/* Card Header & Source Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{getIncidentIcon(inc.type)}</span>
                    <span className="num-tabular" style={{ fontSize: 11, fontWeight: 600, color: '#737373' }}>
                      {inc.trackingCode}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: source.color,
                        background: source.bg,
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontWeight: 600,
                        letterSpacing: '0.02em'
                      }}
                      title={`Verified Source: ${source.label}`}
                    >
                      {source.tag}
                    </span>
                  </div>

                  <span
                    className={`badge ${
                      inc.severityLabel === 'CRITICAL'
                        ? 'badge-critical'
                        : inc.severityLabel === 'HIGH'
                        ? 'badge-high'
                        : 'badge-medium'
                    }`}
                  >
                    <span className="badge-dot" />
                    {inc.severityLabel} &bull; {inc.severityScore.toFixed(0)}
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ededed',
                    lineHeight: 1.35,
                    marginBottom: 4
                  }}
                >
                  {inc.title}
                </div>

                {/* Address & GPS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a1a1a1', marginBottom: 6 }}>
                  <MapPin size={11} color="#737373" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.address}
                  </span>
                  <span className="num-tabular" style={{ color: '#737373', fontSize: 10, marginLeft: 'auto' }}>
                    ({inc.latitude.toFixed(2)}°, {inc.longitude.toFixed(2)}°)
                  </span>
                </div>

                {/* Footer Source Attribution & Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 6,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: 10,
                    color: '#737373'
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isUsgs ? (
                      <>
                        <span>Mag: <b style={{ color: '#ededed' }}>M {inc.aiClassificationMetadata?.magnitude || 5.0}</b></span>
                        <span>Depth: <b style={{ color: '#ededed' }}>{inc.aiClassificationMetadata?.depthKm || 10} km</b></span>
                      </>
                    ) : (
                      <>
                        <span>Trapped: <b style={{ color: '#fca5a5' }}>{inc.estimatedTrapped}</b></span>
                        <span>Reports: <b style={{ color: '#ededed' }}>{inc.reportCount}</b></span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
                    <span>Inspect</span>
                    <ArrowRight size={10} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
