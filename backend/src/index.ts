import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { WebSocketServer } from 'ws';
import { apiRouter } from './routes/api';
import { authRouter } from './routes/auth';
import { realtimeHub } from './websocket/hub';
import { correlationMiddleware, authenticateJWT } from './middleware/auth';
import { metricsHandler } from './observability/metrics';
import { postgresService } from './db/postgresPool';
import { externalApiService } from './services/externalApiService';
import { db } from './db/memoryStore';

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Audit Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allows WebSockets & external tile maps in development/production
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(correlationMiddleware);
app.use(authenticateJWT);

// Health check handler
const healthCheckHandler = (req: any, res: any) => {
  res.json({
    status: 'HEALTHY',
    version: '2.0.0-production',
    service: 'AegisOps Emergency Response & Disaster Coordination Platform',
    postgres: {
      connected: postgresService.isConnected
    },
    externalFeeds: {
      lastSync: externalApiService.lastSyncTime,
      stats: externalApiService.syncedFeedStats
    },
    systemStats: {
      activeIncidents: db.incidents.size,
      availableResources: Array.from(db.resources.values()).filter((r) => r.status === 'AVAILABLE').length,
      registeredHospitals: db.hospitals.size,
      auditLogsCount: db.auditLogs.length
    },
    timestamp: new Date().toISOString()
  });
};

// Prometheus Metrics Endpoints
app.get('/metrics', metricsHandler);
app.get('/api/metrics', metricsHandler);

// Liveness & Readiness Healthchecks
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// REST Routers
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

const server = http.createServer(app);

// WebSocket Stream at /ws/incidents
const wss = new WebSocketServer({ server, path: '/ws/incidents' });
realtimeHub.init(wss);

server.listen(PORT, async () => {
  console.log(`[AegisOps Production Backend] Running on http://localhost:${PORT}`);
  console.log(`[Prometheus Metrics] Available at http://localhost:${PORT}/metrics`);
  console.log(`[WebSocket Stream] Active at ws://localhost:${PORT}/ws/incidents`);

  // Initial Sync of real-world disaster & meteorological feeds (USGS + Open-Meteo)
  try {
    await externalApiService.syncRealWorldData();
  } catch (err: any) {
    console.warn('[External Feed Sync Startup Notice]', err.message);
  }

  // Periodic sync every 10 minutes
  setInterval(() => {
    externalApiService.syncRealWorldData().catch((err) => {
      console.warn('[Periodic Feed Sync Notice]', err.message);
    });
  }, 10 * 60 * 1000);
});
