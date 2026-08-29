import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { Report, Incident, AuditLog } from '../types';
import { nlpService } from './ai/nlpService';
import { visionService } from './ai/visionService';
import { dedupClusterService } from './ai/dedupClusterService';
import { severityFusionService } from './ai/severityFusionService';
import { realtimeHub } from '../websocket/hub';

export interface SubmitReportInput {
  reporterName?: string;
  reporterContact?: string;
  rawText: string;
  latitude: number;
  longitude: number;
  reportedAddress?: string;
  mediaUrls?: string[];
  submissionChannel?: string;
  zoneId?: string;
}

export class ReportIngestionService {
  async submitReport(input: SubmitReportInput): Promise<{ report: Report; incident: Incident; isDuplicate: boolean }> {
    const reportId = `rep-${uuidv4().slice(0, 8)}`;
    const trackingId = `TRK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    // 1. AI NLP Pipeline
    const nlpResult = await nlpService.processReport(input.rawText, input.reportedAddress);

    // 2. AI Vision Pipeline (if media attached)
    let cvResult;
    let perceptualHash = '';
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      cvResult = await visionService.analyzeImage(input.mediaUrls[0]);
      perceptualHash = cvResult.perceptualHash;
    }

    // 3. Spam & Authenticity Check
    const authenticityScore = cvResult ? cvResult.authenticityScore : 0.98;
    const isSpam = input.rawText.trim().length < 5 || authenticityScore < 0.3;

    const report: Report = {
      id: reportId,
      trackingId,
      incidentId: null,
      reporterName: input.reporterName || 'Anonymous Citizen',
      reporterContact: input.reporterContact,
      rawText: input.rawText,
      normalizedText: nlpResult.normalizedText,
      detectedLanguage: nlpResult.detectedLanguage,
      latitude: input.latitude,
      longitude: input.longitude,
      reportedAddress: input.reportedAddress || `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
      mediaUrls: input.mediaUrls || [],
      authenticityScore,
      isSpam,
      status: isSpam ? 'SPAM_REJECTED' : 'PENDING_VERIFICATION',
      submissionChannel: input.submissionChannel || 'WEB',
      aiFeatures: {
        nlpExtraction: nlpResult,
        visionAssessment: cvResult,
        perceptualHash
      },
      submittedAt: now,
      createdAt: now
    };

    db.reports.set(report.id, report);

    if (isSpam) {
      realtimeHub.broadcast('REPORT_SUBMITTED', { report, isSpam: true });
      throw new Error('Submission rejected as potential spam or invalid length.');
    }

    // 4. AI Deduplication & Clustering
    const existingIncidents = Array.from(db.incidents.values());
    const dedupMatch = await dedupClusterService.findDuplicateIncident(report, existingIncidents);

    let incident: Incident;
    let isDuplicate = false;

    if (dedupMatch.isDuplicate && dedupMatch.matchingIncidentId) {
      // Merge into existing incident
      incident = db.incidents.get(dedupMatch.matchingIncidentId)!;
      isDuplicate = true;

      report.incidentId = incident.id;
      report.status = 'MERGED_DUPLICATE';
      incident.reports.push(report);
      incident.reportCount = incident.reports.length;

      // Increment casualty & trapped signals if new report reveals them
      incident.estimatedCasualties += nlpResult.estimatedCasualties;
      incident.estimatedTrapped += nlpResult.estimatedTrapped;

      // Recalculate fused severity with corroborating boost
      const severity = severityFusionService.calculateSeverity({
        incidentType: incident.type,
        reportCount: incident.reportCount,
        estimatedCasualties: incident.estimatedCasualties,
        estimatedTrapped: incident.estimatedTrapped,
        cvDamageScore: cvResult?.damageScore,
        casualtyIndicators: nlpResult.casualtyIndicators
      });

      incident.severityScore = severity.severityScore;
      incident.severityLabel = severity.severityLabel;
      incident.slaTargetMinutes = severity.slaTargetMinutes;
      incident.updatedAt = now;

      // Audit Log for AI merge
      const auditLog: AuditLog = {
        id: `aud-${uuidv4().slice(0, 8)}`,
        entityType: 'INCIDENT',
        entityId: incident.id,
        action: 'AI_REPORT_MERGED',
        actorType: 'AI_PIPELINE',
        actorId: 'dedup-cluster-v2.0',
        modelName: 'spatiotemporal-semantic-dedup',
        modelVersion: '2.0.1',
        confidence: dedupMatch.similarityScore,
        newValue: {
          mergedReportId: report.id,
          newReportCount: incident.reportCount,
          updatedSeverity: incident.severityScore,
          rationale: dedupMatch.rationale
        },
        timestamp: now
      };
      db.auditLogs.unshift(auditLog);

      realtimeHub.broadcast('INCIDENT_MERGED', {
        incident,
        mergedReport: report,
        dedupRationale: dedupMatch.rationale
      });
    } else {
      // Create new Incident aggregate root
      const incidentId = `inc-${uuidv4().slice(0, 8)}`;
      const trackingCode = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const fusedType = cvResult && cvResult.inferredHazard !== 'UNKNOWN'
        ? cvResult.inferredHazard
        : nlpResult.incidentType;

      const severity = severityFusionService.calculateSeverity({
        incidentType: fusedType,
        reportCount: 1,
        estimatedCasualties: nlpResult.estimatedCasualties,
        estimatedTrapped: nlpResult.estimatedTrapped,
        cvDamageScore: cvResult?.damageScore,
        casualtyIndicators: nlpResult.casualtyIndicators
      });

      report.incidentId = incidentId;
      report.status = 'VERIFIED';

      incident = {
        id: incidentId,
        trackingCode,
        title: `${fusedType.replace(/_/g, ' ')}: ${nlpResult.operatorSummary.split('.')[0]}`,
        type: fusedType,
        severityScore: severity.severityScore,
        severityLabel: severity.severityLabel,
        status: 'REPORTED',
        zoneId: input.zoneId || 'zone-city-1',
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.reportedAddress || `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
        landmarks: nlpResult.extractedLocationText ? [nlpResult.extractedLocationText] : [],
        estimatedCasualties: nlpResult.estimatedCasualties,
        estimatedTrapped: nlpResult.estimatedTrapped,
        needsSummary: nlpResult.needs,
        modelConfidence: parseFloat(((nlpResult.confidence + (cvResult?.confidence || 0.9)) / 2).toFixed(2)),
        aiClassificationMetadata: {
          nlp: nlpResult,
          vision: cvResult,
          severityBreakdown: severity.breakdown
        },
        reportCount: 1,
        reports: [report],
        slaTargetMinutes: severity.slaTargetMinutes,
        version: 1,
        createdAt: now,
        updatedAt: now
      };

      db.incidents.set(incident.id, incident);

      // Audit Log for new AI creation
      const auditLog: AuditLog = {
        id: `aud-${uuidv4().slice(0, 8)}`,
        entityType: 'INCIDENT',
        entityId: incident.id,
        action: 'AI_INCIDENT_CREATED',
        actorType: 'AI_PIPELINE',
        actorId: 'ai-triage-ensemble-v2',
        modelName: 'ensemble-fused-triage',
        modelVersion: '2.4.0',
        confidence: incident.modelConfidence,
        newValue: {
          type: incident.type,
          severityScore: incident.severityScore,
          severityLabel: incident.severityLabel,
          needs: incident.needsSummary
        },
        timestamp: now
      };
      db.auditLogs.unshift(auditLog);

      realtimeHub.broadcast('INCIDENT_CREATED', { incident, report });
    }

    realtimeHub.broadcast('REPORT_SUBMITTED', { report, incidentId: incident.id });

    return { report, incident, isDuplicate };
  }

  getReportStatus(trackingId: string): Report | null {
    for (const r of db.reports.values()) {
      if (r.trackingId === trackingId) return r;
    }
    return null;
  }
}

export const reportIngestionService = new ReportIngestionService();
