import { Request, Response } from 'express';
import { db } from '../db/memoryStore';
import { realtimeHub } from '../websocket/hub';

export class MetricsCollector {
  private reportsCount = 4;
  private duplicateMergeCount = 1;
  private slaBreachCount = 0;
  private lastChecked = Date.now();

  constructor() {
    this.startSlaMonitorDaemon();
  }

  recordReportSubmitted(isDuplicate: boolean) {
    this.reportsCount++;
    if (isDuplicate) this.duplicateMergeCount++;
  }

  // Periodic SLA aging & breach escalation daemon
  private startSlaMonitorDaemon() {
    setInterval(() => {
      const now = Date.now();
      db.incidents.forEach((inc) => {
        if (inc.status === 'REPORTED' || inc.status === 'TRIAGED') {
          const ageMinutes = (now - new Date(inc.createdAt).getTime()) / (60 * 1000);
          if (ageMinutes > inc.slaTargetMinutes && !inc.aiClassificationMetadata?.slaEscalated) {
            this.slaBreachCount++;
            if (!inc.aiClassificationMetadata) inc.aiClassificationMetadata = {};
            inc.aiClassificationMetadata.slaEscalated = true;
            console.warn(`[SLA ESCALATION ALERT] Incident ${inc.trackingCode} (${inc.title}) has exceeded ${inc.slaTargetMinutes}m SLA target!`);
            realtimeHub.broadcast('INCIDENT_UPDATED', { incident: inc, slaBreach: true });
          }
        }
      });
    }, 20000); // Check every 20 seconds
  }

  // Generate standard Prometheus text format output
  getPrometheusMetrics(): string {
    const activeIncidents = Array.from(db.incidents.values()).filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    );
    const criticalIncidents = activeIncidents.filter((i) => i.severityLabel === 'CRITICAL');
    const availableResources = Array.from(db.resources.values()).filter((r) => r.status === 'AVAILABLE');
    const totalResources = db.resources.size;

    return `
# HELP disaster_reports_total Total number of citizen reports ingested
# TYPE disaster_reports_total counter
disaster_reports_total{status="all"} ${this.reportsCount}
disaster_reports_total{status="duplicate_merged"} ${this.duplicateMergeCount}

# HELP disaster_incidents_active Current active disaster incidents
# TYPE disaster_incidents_active gauge
disaster_incidents_active{severity="critical"} ${criticalIncidents.length}
disaster_incidents_active{severity="all"} ${activeIncidents.length}

# HELP disaster_sla_breaches_total Total number of SLA breach escalations
# TYPE disaster_sla_breaches_total counter
disaster_sla_breaches_total ${this.slaBreachCount}

# HELP disaster_resource_availability_ratio Ratio of available emergency units
# TYPE disaster_resource_availability_ratio gauge
disaster_resource_availability_ratio ${totalResources > 0 ? (availableResources.length / totalResources).toFixed(3) : 1}
`.trim();
  }
}

export const metricsCollector = new MetricsCollector();

export const metricsHandler = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metricsCollector.getPrometheusMetrics());
};
