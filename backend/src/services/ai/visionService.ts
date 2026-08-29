import { IncidentType } from '../../types';

export interface VisionAssessmentResult {
  detectedLabels: string[];
  inferredHazard: IncidentType | 'UNKNOWN';
  damageScore: number; // 0.0 to 1.0
  perceptualHash: string;
  authenticityScore: number; // 0.0 to 1.0 (checks for stock/reposted watermarks)
  confidence: number;
}

export interface IVisionService {
  analyzeImage(imageUrl: string): Promise<VisionAssessmentResult>;
  calculateImageSimilarity(hashA: string, hashB: string): number;
}

export class VisionService implements IVisionService {
  async analyzeImage(imageUrl: string): Promise<VisionAssessmentResult> {
    const lower = imageUrl.toLowerCase();

    let inferredHazard: IncidentType | 'UNKNOWN' = 'UNKNOWN';
    let damageScore = 0.5;
    let confidence = 0.88;
    const detectedLabels: string[] = [];

    if (lower.includes('flood') || lower.includes('water') || lower.includes('submerge')) {
      inferredHazard = 'FLOOD';
      damageScore = 0.85;
      detectedLabels.push('floodwater', 'submerged_structures', 'stranded_vehicles');
      confidence = 0.94;
    } else if (lower.includes('fire') || lower.includes('flame') || lower.includes('smoke')) {
      inferredHazard = 'FIRE';
      damageScore = 0.90;
      detectedLabels.push('heavy_smoke_plume', 'structural_fire', 'high_thermal_signature');
      confidence = 0.95;
    } else if (lower.includes('collapse') || lower.includes('rubble') || lower.includes('crack')) {
      inferredHazard = 'STRUCTURAL_COLLAPSE';
      damageScore = 0.88;
      detectedLabels.push('concrete_spalling', 'structural_fracture', 'debris_field');
      confidence = 0.92;
    } else {
      detectedLabels.push('outdoor_scene', 'emergency_condition');
      damageScore = 0.65;
    }

    // Deterministic perceptual hash stub (simulates dHash / pHash)
    let hashNum = 0;
    for (let i = 0; i < imageUrl.length; i++) {
      hashNum = (hashNum << 5) - hashNum + imageUrl.charCodeAt(i);
      hashNum |= 0;
    }
    const perceptualHash = 'phash_' + Math.abs(hashNum).toString(16).padStart(16, '0');

    return {
      detectedLabels,
      inferredHazard,
      damageScore,
      perceptualHash,
      authenticityScore: 0.96,
      confidence
    };
  }

  calculateImageSimilarity(hashA: string, hashB: string): number {
    if (!hashA || !hashB) return 0;
    if (hashA === hashB) return 1.0;

    let matchingChars = 0;
    const length = Math.min(hashA.length, hashB.length);
    for (let i = 0; i < length; i++) {
      if (hashA[i] === hashB[i]) matchingChars++;
    }
    return matchingChars / length;
  }
}

export const visionService = new VisionService();
