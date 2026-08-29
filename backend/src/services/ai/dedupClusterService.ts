import { Incident, Report } from '../../types';
import { visionService } from './visionService';

export interface DedupMatchResult {
  isDuplicate: boolean;
  matchingIncidentId?: string;
  similarityScore: number;
  distanceMeters: number;
  timeDeltaMinutes: number;
  rationale: string;
}

export interface IDedupClusterService {
  findDuplicateIncident(
    report: Report,
    existingIncidents: Incident[]
  ): Promise<DedupMatchResult>;
  haversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number;
}

export class DedupClusterService implements IDedupClusterService {
  // Haversine formula
  haversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Token-based Jaccard similarity for textual descriptions
  private textSimilarity(textA: string, textB: string): number {
    const tokenize = (s: string) =>
      new Set(
        s
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

    const setA = tokenize(textA);
    const setB = tokenize(textB);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersectionCount = 0;
    setA.forEach((w) => {
      if (setB.has(w)) intersectionCount++;
    });

    const unionCount = setA.size + setB.size - intersectionCount;
    return unionCount > 0 ? intersectionCount / unionCount : 0;
  }

  async findDuplicateIncident(
    report: Report,
    existingIncidents: Incident[]
  ): Promise<DedupMatchResult> {
    const MAX_CLUSTER_DISTANCE_METERS = 1200; // 1.2km radius
    const MAX_CLUSTER_TIME_MINUTES = 180; // 3 hours window

    let bestMatch: DedupMatchResult = {
      isDuplicate: false,
      similarityScore: 0,
      distanceMeters: Infinity,
      timeDeltaMinutes: Infinity,
      rationale: 'No matching active incident found within proximity threshold.'
    };

    const reportTime = new Date(report.submittedAt || report.createdAt).getTime();

    for (const incident of existingIncidents) {
      if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
        continue;
      }

      const distance = this.haversineDistanceMeters(
        report.latitude,
        report.longitude,
        incident.latitude,
        incident.longitude
      );

      const incidentTime = new Date(incident.createdAt).getTime();
      const timeDeltaMinutes = Math.abs(reportTime - incidentTime) / (60 * 1000);

      if (distance <= MAX_CLUSTER_DISTANCE_METERS && timeDeltaMinutes <= MAX_CLUSTER_TIME_MINUTES) {
        // Geospatial score (1.0 at 0m down to 0.0 at max distance)
        const geoScore = Math.max(0, 1 - distance / MAX_CLUSTER_DISTANCE_METERS);

        // Textual similarity against incident title + reports
        let maxTextSim = this.textSimilarity(report.rawText, incident.title);
        for (const r of incident.reports) {
          const sim = this.textSimilarity(report.rawText, r.rawText);
          if (sim > maxTextSim) maxTextSim = sim;
        }

        // Image hash similarity if available
        let imageSim = 0;
        if (report.aiFeatures?.perceptualHash) {
          for (const r of incident.reports) {
            if (r.aiFeatures?.perceptualHash) {
              const sim = visionService.calculateImageSimilarity(
                report.aiFeatures.perceptualHash,
                r.aiFeatures.perceptualHash
              );
              if (sim > imageSim) imageSim = sim;
            }
          }
        }

        // Fused cluster similarity: 50% spatial proximity + 35% text semantics + 15% image
        const combinedScore = geoScore * 0.50 + maxTextSim * 0.35 + imageSim * 0.15;

        if (combinedScore > 0.48 && combinedScore > bestMatch.similarityScore) {
          bestMatch = {
            isDuplicate: true,
            matchingIncidentId: incident.id,
            similarityScore: parseFloat(combinedScore.toFixed(3)),
            distanceMeters: Math.round(distance),
            timeDeltaMinutes: Math.round(timeDeltaMinutes),
            rationale: `Matched incident "${incident.title}" (${Math.round(distance)}m away, Δt ${Math.round(timeDeltaMinutes)}m, semantic overlap ${(maxTextSim * 100).toFixed(0)}%).`
          };
        }
      }
    }

    return bestMatch;
  }
}

export const dedupClusterService = new DedupClusterService();
