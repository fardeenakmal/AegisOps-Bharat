if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type StompConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

export interface StompEventHandler {
  (eventType: string, data: any): void;
}

class EmergencyStompClient {
  private client: Client | null = null;
  private statusListeners: ((status: StompConnectionStatus) => void)[] = [];
  private eventHandlers: Map<string, StompEventHandler[]> = new Map();
  private currentStatus: StompConnectionStatus = 'DISCONNECTED';

  public connect(token?: string) {
    if (this.client && this.client.active) return;

    this.setStatus('CONNECTING');

    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const apiUrl = (import.meta as any).env?.VITE_API_URL;
    const host = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : window.location.origin;
    const socketUrl = `${host}/ws-emergency`;

    this.client = new Client({
      webSocketFactory: () => {
        try {
          return new SockJS(socketUrl);
        } catch (err) {
          const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const cleanHost = host.replace(/^https?:\/\//, '');
          return new WebSocket(`${wsProto}//${cleanHost}/ws-emergency`);
        }
      },
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.debug('[STOMP]', msg);
        }
      },
      onConnect: () => {
        this.setStatus('CONNECTED');
        this.subscribeTopics();
      },
      onDisconnect: () => {
        this.setStatus('DISCONNECTED');
      },
      onStompError: (frame) => {
        console.warn('[STOMP Error]', frame.headers['message'], frame.body);
        this.setStatus('DISCONNECTED');
      },
      onWebSocketClose: () => {
        this.setStatus('DISCONNECTED');
      }
    });

    this.client.activate();
  }

  private subscribeTopics() {
    if (!this.client || !this.client.connected) return;

    // 1. Topic: Critical and Regional Alerts
    this.client.subscribe('/topic/alerts', (message: IMessage) => {
      this.handleIncomingMessage(message);
    });

    // 2. Topic: Incoming Requests & Priority Overrides
    this.client.subscribe('/topic/requests', (message: IMessage) => {
      this.handleIncomingMessage(message);
    });

    // 3. Topic: Tactical Response Team Status & Telemetry
    this.client.subscribe('/topic/teams', (message: IMessage) => {
      this.handleIncomingMessage(message);
    });
  }

  public subscribeZone(zoneId: string) {
    if (!this.client || !this.client.connected) return;
    this.client.subscribe(`/topic/zones/${zoneId}`, (message: IMessage) => {
      this.handleIncomingMessage(message);
    });
  }

  private handleIncomingMessage(message: IMessage) {
    try {
      const payload = JSON.parse(message.body);
      const type = payload.type || 'UNKNOWN_EVENT';
      const data = payload.data || payload;

      const handlers = this.eventHandlers.get(type) || [];
      handlers.forEach((h) => h(type, data));

      // Global wildcard handlers
      const wildcardHandlers = this.eventHandlers.get('*') || [];
      wildcardHandlers.forEach((h) => h(type, data));
    } catch (err) {
      console.error('Failed to parse STOMP message payload', err);
    }
  }

  public on(eventType: string, handler: StompEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    return () => {
      const list = this.eventHandlers.get(eventType);
      if (list) {
        this.eventHandlers.set(
          eventType,
          list.filter((h) => h !== handler)
        );
      }
    };
  }

  public onStatusChange(listener: (status: StompConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private setStatus(status: StompConnectionStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((l) => l(status));
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.setStatus('DISCONNECTED');
    }
  }
}

export const emergencyStompClient = new EmergencyStompClient();

