import { WebSocketServer, WebSocket } from 'ws';

export type SocketEventType =
  | 'REPORT_SUBMITTED'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'INCIDENT_MERGED'
  | 'RESOURCE_STATUS_CHANGED'
  | 'DISPATCH_CREATED'
  | 'DISPATCH_UPDATED'
  | 'HOSPITAL_CAPACITY_UPDATED'
  | 'PREDICTION_ALERT_ISSUED'
  | 'PUBLIC_BROADCAST'
  | 'AUDIT_LOG_RECORDED'
  | 'EXTERNAL_FEEDS_SYNCED';

export interface RealtimeMessage {
  type: SocketEventType;
  timestamp: string;
  data: any;
}

export class RealtimeHub {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(wss: WebSocketServer) {
    this.wss = wss;
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial heartbeat acknowledgment
      ws.send(
        JSON.stringify({
          type: 'CONNECTION_ESTABLISHED',
          timestamp: new Date().toISOString(),
          data: { message: 'Connected to Emergency Live Operations Stream' }
        })
      );

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(type: SocketEventType, data: any) {
    const payload: RealtimeMessage = {
      type,
      timestamp: new Date().toISOString(),
      data
    };
    const serialized = JSON.stringify(payload);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  }
}

export const realtimeHub = new RealtimeHub();
