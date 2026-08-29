import { IncidentType, NeedsSummary } from '../../types';

export interface NLPTriageResult {
  detectedLanguage: string;
  normalizedText: string;
  incidentType: IncidentType;
  confidence: number;
  extractedLocationText?: string;
  casualtyIndicators: string[];
  estimatedCasualties: number;
  estimatedTrapped: number;
  needs: NeedsSummary;
  severitySignal: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  operatorSummary: string;
}

export interface INLPService {
  processReport(text: string, reportedLocation?: string): Promise<NLPTriageResult>;
  summarizeCluster(reportTexts: string[]): Promise<string>;
}

export class NLPService implements INLPService {
  async processReport(text: string, reportedLocation?: string): Promise<NLPTriageResult> {
    const lower = text.toLowerCase();

    // 1. Multilingual Detection for Indian Regional Languages & Hinglish
    let detectedLanguage = 'en';
    if (
      lower.includes('bachao') ||
      lower.includes('paani') ||
      lower.includes('aag') ||
      lower.includes('fase') ||
      lower.includes('jaldi') ||
      lower.includes('bhejo') ||
      lower.includes('madad')
    ) {
      detectedLanguage = 'hi'; // Hindi / Hinglish
    } else if (
      lower.includes('madat') ||
      lower.includes('aale') ||
      lower.includes('lagli') ||
      lower.includes('phasle') ||
      lower.includes('dada')
    ) {
      detectedLanguage = 'mr'; // Marathi
    } else if (
      lower.includes('kaapaathunga') ||
      lower.includes('thee') ||
      lower.includes('vellam') ||
      lower.includes('udavi')
    ) {
      detectedLanguage = 'ta'; // Tamil
    } else if (
      lower.includes('banchao') ||
      lower.includes('aagun') ||
      lower.includes('bonya')
    ) {
      detectedLanguage = 'bn'; // Bengali
    }

    // 2. Incident Type Classification for Indian Hazard Scenarios
    let incidentType: IncidentType = 'OTHER';
    let confidence = 0.88;

    if (
      lower.includes('gas') ||
      lower.includes('leak') ||
      lower.includes('chemical') ||
      lower.includes('toxic') ||
      lower.includes('hazmat') ||
      lower.includes('fumes')
    ) {
      incidentType = 'GAS_LEAK';
      confidence = 0.95;
    } else if (
      lower.includes('flood') ||
      lower.includes('water') ||
      lower.includes('paani') ||
      lower.includes('drown') ||
      lower.includes('submerged') ||
      lower.includes('inundat') ||
      lower.includes('vellam') ||
      lower.includes('bonya') ||
      lower.includes('waterlogging') ||
      lower.includes('overflow') ||
      lower.includes('river rise')
    ) {
      incidentType = 'FLOOD';
      confidence = 0.97;
    } else if (
      lower.includes('fire') ||
      lower.includes('flame') ||
      lower.includes('smoke') ||
      lower.includes('aag') ||
      lower.includes('burning') ||
      lower.includes('thee') ||
      lower.includes('aagun') ||
      lower.includes('lagli')
    ) {
      incidentType = 'FIRE';
      confidence = 0.96;
    } else if (
      lower.includes('landslide') ||
      lower.includes('debris') ||
      lower.includes('mudslide') ||
      lower.includes('bhooskhalan') ||
      lower.includes('mountain slip')
    ) {
      incidentType = 'LANDSLIDE';
      confidence = 0.94;
    } else if (
      lower.includes('collapse') ||
      lower.includes('rubble') ||
      lower.includes('pul gir') ||
      lower.includes('building gir') ||
      lower.includes('gir gaya') ||
      lower.includes('structural') ||
      lower.includes('bridge crack') ||
      lower.includes('flyover')
    ) {
      incidentType = 'STRUCTURAL_COLLAPSE';
      confidence = 0.93;
    } else if (
      lower.includes('cyclone') ||
      lower.includes('toofan') ||
      lower.includes('storm') ||
      lower.includes('squall') ||
      lower.includes('super cyclone')
    ) {
      incidentType = 'STORM_CYCLONE';
      confidence = 0.95;
    } else if (
      lower.includes('earthquake') ||
      lower.includes('tremor') ||
      lower.includes('bhookamp') ||
      lower.includes('quake')
    ) {
      incidentType = 'EARTHQUAKE';
      confidence = 0.94;
    } else if (
      lower.includes('accident') ||
      lower.includes('crash') ||
      lower.includes('collision') ||
      lower.includes('highway') ||
      lower.includes('vehicle') ||
      lower.includes('bus palat') ||
      lower.includes('gaadi')
    ) {
      incidentType = 'ROAD_ACCIDENT';
      confidence = 0.92;
    } else if (
      lower.includes('heart') ||
      lower.includes('unconscious') ||
      lower.includes('behosh') ||
      lower.includes('breathing') ||
      lower.includes('bleeding')
    ) {
      incidentType = 'MEDICAL_EMERGENCY';
      confidence = 0.91;
    }

    // 3. Casualty & Entrapment Signals
    const casualtyIndicators: string[] = [];
    let estimatedCasualties = 0;
    let estimatedTrapped = 0;

    if (
      lower.includes('trapped') ||
      lower.includes('fase') ||
      lower.includes('phasle') ||
      lower.includes('stuck') ||
      lower.includes('buried')
    ) {
      casualtyIndicators.push('trapped_individuals');
      estimatedTrapped += 3;
    }
    if (
      lower.includes('unconscious') ||
      lower.includes('behosh') ||
      lower.includes('collapsed') ||
      lower.includes('fainted')
    ) {
      casualtyIndicators.push('unconscious_patients');
      estimatedCasualties += 2;
    }
    if (
      lower.includes('child') ||
      lower.includes('children') ||
      lower.includes('bacche') ||
      lower.includes('baby') ||
      lower.includes('infant')
    ) {
      casualtyIndicators.push('pediatric_vulnerable');
    }
    if (
      lower.includes('elderly') ||
      lower.includes('senior') ||
      lower.includes('bujurg')
    ) {
      casualtyIndicators.push('elderly_vulnerable');
    }
    if (
      lower.includes('burn') ||
      lower.includes('bleeding') ||
      lower.includes('injured') ||
      lower.includes('ghayal') ||
      lower.includes('jakhmi')
    ) {
      casualtyIndicators.push('severe_trauma');
      estimatedCasualties += 2;
    }

    // Extract numbers: "6 log bus me fase hain", "5 people trapped in car", "8 log trapped"
    const trappedMatch = text.match(/(\d+)\s*(?:[a-zA-Z]+\s*){0,4}(?:trapped|fase|phasle|stuck|dube)/i);
    if (trappedMatch && trappedMatch[1]) {
      estimatedTrapped = parseInt(trappedMatch[1], 10);
    }
    const injuredMatch = text.match(/(\d+)\s*(?:[a-zA-Z]+\s*){0,4}(?:injured|hurt|casualties|ghayal|jakhmi|casualties)/i);
    if (injuredMatch && injuredMatch[1]) {
      estimatedCasualties = parseInt(injuredMatch[1], 10);
    }

    // 4. Needs & Resource Extraction (India NDRF/SDRF/108 Fleet Aligned)
    const needs: NeedsSummary = {};
    const notes: string[] = [];

    if (incidentType === 'FLOOD') {
      needs.boats = Math.max(1, Math.ceil(estimatedTrapped / 4));
      needs.ambulances = Math.max(1, Math.ceil(estimatedCasualties / 2));
      needs.sarTeams = 1;
      notes.push('NDRF deep water rescue boats and GVK-108 ALS ambulances mobilized');
    } else if (incidentType === 'FIRE') {
      needs.fireTrucks = 3;
      needs.ambulances = Math.max(2, Math.ceil(estimatedCasualties / 2));
      if (lower.includes('high rise') || lower.includes('floor') || lower.includes('plaza') || lower.includes('complex')) {
        notes.push('Municipal Fire Brigade 70m aerial turntable hydraulic ladder requested');
      }
      needs.medicalKits = 10;
    } else if (incidentType === 'STRUCTURAL_COLLAPSE' || incidentType === 'LANDSLIDE') {
      needs.sarTeams = 2;
      needs.extricationJaws = true;
      needs.ambulances = 3;
      notes.push('NDRF canine search squad, acoustic listening radars, and heavy concrete cutters mobilized');
    } else if (incidentType === 'ROAD_ACCIDENT') {
      needs.ambulances = Math.max(1, Math.ceil(estimatedCasualties / 2));
      needs.policeUnits = 1;
      if (lower.includes('crushed') || lower.includes('pinned') || lower.includes('palat')) {
        needs.extricationJaws = true;
      }
    } else if (incidentType === 'GAS_LEAK') {
      needs.fireTrucks = 1;
      needs.policeUnits = 2;
      notes.push('SDRF Hazmat Level-A protective crew and perimeter containment cordoned');
    } else {
      needs.ambulances = 1;
    }
    needs.specialNotes = notes;

    // 5. Severity Signal
    let severitySignal: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (estimatedCasualties >= 5 || estimatedTrapped >= 5 || incidentType === 'FIRE' || incidentType === 'FLOOD' || incidentType === 'STRUCTURAL_COLLAPSE') {
      severitySignal = 'CRITICAL';
    } else if (estimatedCasualties > 0 || estimatedTrapped > 0 || incidentType === 'LANDSLIDE') {
      severitySignal = 'HIGH';
    } else if (incidentType === 'ROAD_ACCIDENT' || incidentType === 'GAS_LEAK') {
      severitySignal = 'MEDIUM';
    }

    // 6. Operational Brief
    const locSnippet = reportedLocation ? ` at ${reportedLocation}` : '';
    const operatorSummary = `${incidentType} reported${locSnippet} (${detectedLanguage.toUpperCase()}). Est ${estimatedTrapped} trapped, ${estimatedCasualties} casualties. Tactical response: ${Object.keys(needs).filter((k) => k !== 'specialNotes').join(', ')}.`;

    return {
      detectedLanguage,
      normalizedText: text.trim(),
      incidentType,
      confidence,
      extractedLocationText: reportedLocation,
      casualtyIndicators,
      estimatedCasualties,
      estimatedTrapped,
      needs,
      severitySignal,
      operatorSummary
    };
  }

  async summarizeCluster(reportTexts: string[]): Promise<string> {
    if (reportTexts.length === 0) return 'No corroborating citizen reports recorded.';
    if (reportTexts.length === 1) return reportTexts[0];
    return `Corroborating cluster of ${reportTexts.length} citizen submissions across 112/PWA feeds. Highlights: "${reportTexts[0].slice(0, 100)}..." + ${reportTexts.length - 1} field witness reports.`;
  }
}

export const nlpService = new NLPService();
