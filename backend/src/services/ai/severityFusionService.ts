import { IncidentType, SeverityLabel } from '../../types';

export interface SeverityFusionInput {
  incidentType: IncidentType;
  reportCount: number;
  estimatedCasualties: number;
  estimatedTrapped: number;
  cvDamageScore?: number; // 0.0 - 1.0
  casualtyIndicators: string[];
  populationDensityWeight?: number; // 1.0 default
}

export interface SeverityFusionResult {
  severityScore: number; // 0.0 - 100.0
  severityLabel: SeverityLabel;
  slaTargetMinutes: number;
  breakdown: {
    baseScore: number;
    corroborationBonus: number;
    casualtyImpact: number;
    trappedImpact: number;
    cvDamageImpact: number;
  };
}

export interface ISeverityFusionService {
  calculateSeverity(input: SeverityFusionInput): SeverityFusionResult;
}

export class SeverityFusionService implements ISeverityFusionService {
  private baseWeights: Record<IncidentType, number> = {
    FIRE: 65,
    FLOOD: 60,
    STRUCTURAL_COLLAPSE: 70,
    EARTHQUAKE: 75,
    LANDSLIDE: 65,
    HAZMAT_SPILL: 65,
    GAS_LEAK: 55,
    ROAD_ACCIDENT: 45,
    MEDICAL_EMERGENCY: 50,
    STORM_CYCLONE: 65,
    OTHER: 30
  };

  calculateSeverity(input: SeverityFusionInput): SeverityFusionResult {
    const baseScore = this.baseWeights[input.incidentType] || 40;

    // 1. Corroboration boost (diminishing returns)
    // 1 report = 0, 2 reports = +6, 5 reports = +12, 10 reports = +18
    const corroborationBonus = Math.min(20, Math.log2(Math.max(1, input.reportCount)) * 6);

    // 2. Casualty signals
    const casualtyImpact = Math.min(25, input.estimatedCasualties * 4.5);

    // 3. Trapped individuals (high urgency)
    const trappedImpact = Math.min(25, input.estimatedTrapped * 4.0);

    // 4. CV Damage Impact
    const cvDamageImpact = (input.cvDamageScore || 0.5) * 15;

    // 5. Total calculation with bounds [0, 100]
    let rawScore = baseScore * 0.40 + corroborationBonus + casualtyImpact + trappedImpact + cvDamageImpact;
    const finalScore = Math.min(100, Math.max(10, parseFloat(rawScore.toFixed(1))));

    // Determine Label and SLA
    let severityLabel: SeverityLabel = 'LOW';
    let slaTargetMinutes = 45;

    if (finalScore >= 80) {
      severityLabel = 'CRITICAL';
      slaTargetMinutes = 10;
    } else if (finalScore >= 60) {
      severityLabel = 'HIGH';
      slaTargetMinutes = 20;
    } else if (finalScore >= 40) {
      severityLabel = 'MEDIUM';
      slaTargetMinutes = 35;
    }

    return {
      severityScore: finalScore,
      severityLabel,
      slaTargetMinutes,
      breakdown: {
        baseScore,
        corroborationBonus: parseFloat(corroborationBonus.toFixed(1)),
        casualtyImpact: parseFloat(casualtyImpact.toFixed(1)),
        trappedImpact: parseFloat(trappedImpact.toFixed(1)),
        cvDamageImpact: parseFloat(cvDamageImpact.toFixed(1))
      }
    };
  }
}

export const severityFusionService = new SeverityFusionService();
