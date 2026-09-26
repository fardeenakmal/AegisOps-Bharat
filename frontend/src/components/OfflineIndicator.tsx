import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { offlineStorageService } from '../services/offlineStorageService';

interface OfflineIndicatorProps {
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ compact = false }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const updateStatus = async () => {
    setIsOnline(navigator.onLine);
    const count = await offlineStorageService.getPendingQueueCount();
    setPendingCount(count);
  };

  useEffect(() => {
    updateStatus();

    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();
    const handleQueueChanged = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChanged);

    // Periodic check every 10 seconds
    const interval = setInterval(updateStatus, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChanged);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const result = await offlineStorageService.syncOutboxQueue();
      if (result.synced > 0) {
        setSyncNotice(`Synced ${result.synced} offline actions to EOC!`);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSyncing(false);
      updateStatus();
    }
  };

  if (compact) {
    if (!isOnline) {
      return (
        <div
          title={`Offline: ${pendingCount} actions queued in IndexedDB`}
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <WifiOff size={15} color="#f85149" />
        </div>
      );
    }
    if (pendingCount > 0) {
      return (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          title={`${pendingCount} offline actions queued. Click to sync.`}
          style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(210,153,34,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <CloudUpload size={14} className={isSyncing ? 'spin-anim' : ''} color="#fbbf24" />
        </button>
      );
    }
    return (
      <div
        title="PWA Grid Online & Synchronized"
        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Wifi size={14} color="#16a34a" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {isOnline ? (
        pendingCount > 0 ? (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="btn btn-secondary"
            style={{
              background: 'rgba(210, 153, 34, 0.12)',
              color: '#fde68a',
              border: '1px solid rgba(210, 153, 34, 0.35)',
              borderRadius: 20,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              height: 22
            }}
            title="Click to flush outbox queue to server"
          >
            <CloudUpload size={11} className={isSyncing ? 'spin-anim' : ''} color="#fbbf24" />
            <span className="num-tabular">{isSyncing ? 'Syncing...' : `${pendingCount} Queued (Sync)`}</span>
          </button>
        ) : (
          <div
            className="badge badge-success mobile-hide"
            style={{
              padding: '1px 7px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.01em'
            }}
            title="AegisOps Telemetry Grid Connected & Synchronized"
          >
            <span className="badge-dot" style={{ background: '#2ea043', boxShadow: '0 0 6px rgba(46, 160, 67, 0.8)' }} />
            <span>PWA ONLINE</span>
          </div>
        )
      ) : (
        <div
          className="badge badge-critical"
          style={{
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Zero Cellular Connectivity. Changes are cached safely in IndexedDB and will auto-sync upon reconnection."
        >
          <WifiOff size={11} color="#f85149" className="pulse-slow" />
          <span>OFFLINE ({pendingCount} queued)</span>
        </div>
      )}

      {syncNotice && (
        <div
          className="badge badge-success"
          style={{
            fontSize: 10,
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <CheckCircle2 size={11} color="#2ea043" />
          <span>{syncNotice}</span>
        </div>
      )}
    </div>
  );
};

