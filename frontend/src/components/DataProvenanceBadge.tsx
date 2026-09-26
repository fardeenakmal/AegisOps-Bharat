import React from 'react';
import { ShieldCheck, AlertCircle, Cpu, Radio } from 'lucide-react';

interface DataProvenanceBadgeProps {
  source?: string;
  isLive?: boolean;
  disclaimer?: string;
  size?: 'sm' | 'md';
}

export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
  source,
  isLive = true,
  disclaimer,
  size = 'sm'
}) => {
  const isFallbackOrMock = !isLive || (disclaimer && disclaimer.toLowerCase().includes('fallback')) || (source && source.toLowerCase().includes('mock'));
  const isSimulation = source === 'SIMULATION' || (disclaimer && disclaimer.toLowerCase().includes('simulation'));

  if (isSimulation) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: size === 'sm' ? '2px 6px' : '4px 8px',
          borderRadius: '4px',
          fontSize: size === 'sm' ? '10px' : '11px',
          fontWeight: 600,
          background: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          letterSpacing: '0.04em'
        }}
        title={disclaimer || 'Spatiotemporal simulation model (Operator triggered)'}
      >
        <Cpu size={size === 'sm' ? 10 : 12} />
        SIMULATED MODEL
      </span>
    );
  }

  if (isFallbackOrMock) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: size === 'sm' ? '2px 6px' : '4px 8px',
          borderRadius: '4px',
          fontSize: size === 'sm' ? '10px' : '11px',
          fontWeight: 600,
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          letterSpacing: '0.03em'
        }}
        title={disclaimer || 'Official government feed offline. Operating in calibrated mock baseline.'}
      >
        <AlertCircle size={size === 'sm' ? 10 : 12} />
        FALLBACK BASELINE
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 6px' : '4px 8px',
        borderRadius: '4px',
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 600,
        background: 'rgba(34, 197, 94, 0.14)',
        color: '#4ade80',
        border: '1px solid rgba(34, 197, 94, 0.35)',
        letterSpacing: '0.03em'
      }}
      title={disclaimer || 'Verified authoritative live open API stream'}
    >
      <Radio size={size === 'sm' ? 10 : 12} />
      LIVE TELEMETRY
    </span>
  );
};

