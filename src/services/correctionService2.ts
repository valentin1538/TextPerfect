import axios from 'axios';

/**
 * Interface for LanguageTool API response
 */
interface LanguageToolResponse {
  matches: Array<{
    offset: number;
    length: number;
    replacements: Array<{
      value: string;
      shortDescription?: string;
    }>;
    rule: {
      id: string;
      description: string;
      category: {
        id: string;
        name: string;
      };
    };
    context: {
      text: string;
      offset: number;
      length: number;
    };
    sentence: string;
    message: string;
  }>;
  language: {
    name: string;
    code: string;
  };
}

interface CorrectionResult {
  text: string;
  correctedParts?: Array<{
    original: string;
    replacement: string;
    position: number;
    offset: number; // Offset original pour le debug
  }>;
}

/**
 * Text correction service using LanguageTool API
 */
export const correctText = async (
  text: string, 
  improvementOptions: {
    confidenceThreshold?: number;
    contextAware?: boolean;
    preserveCapitalization?: boolean;
    highlightCorrections?: boolean;
  } = {}
): Promise<CorrectionResult> => {
  const {
    confidenceThreshold = 0,
    contextAware = true,
    preserveCapitalization = true,
    highlightCorrections = false
  } = improvementOptions;
  
  try {
    const enabledRules = [
      'FR_AGREEMENT_VERB_INFINITIVE_PAST_PARTICIPLE',
      'CONFUSION_EST_ET',
      'FRENCH_VERB_AGREEMENT',
      'FR_CONJUGATION_ERROR',
      'FRENCH_SPELLING',
      'FR_MISC',
      'TYPOGRAPHY',
    ].join(',');

    const params = new URLSearchParams({
      text,
      language: 'fr',
      disabledRules: 'WHITESPACE_RULE,EN_QUOTES',
      enabledOnly: 'false',
      level: 'picky',
      enabledRules
    });

    const response = await axios.post<LanguageToolResponse>(
      'https://api.languagetool.org/v2/check',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // Group overlapping corrections to prevent conflicts
    const matches = response.data.matches;
    const groupedMatches = groupOverlappingMatches(matches);
    
    // Approche avec deux phases:
    // 1. Collecte des corrections
    // 2. Application des corrections

    let correctionInfos: Array<{
      offset: number;
      length: number;
      original: string;
      replacement: string;
    }> = [];

    // Collecte des corrections à appliquer
    for (const group of groupedMatches) {
      const bestMatch = selectBestMatch(group, contextAware);
      
      const offset = bestMatch.offset;
      const length = bestMatch.length;
      
      const estimatedConfidence = estimateConfidence(bestMatch);
      if (estimatedConfidence < confidenceThreshold) continue;
      
      if (bestMatch.replacements && bestMatch.replacements.length > 0) {
        const original = text.substring(offset, offset + length);
        let replacement = bestMatch.replacements[0].value;
        
        if (preserveCapitalization) {
          replacement = preserveOriginalCapitalization(original, replacement);
        }
        
        correctionInfos.push({
          offset,
          length,
          original,
          replacement
        });
      }
    }

    // Trier les corrections de la fin vers le début pour préserver les offsets
    correctionInfos.sort((a, b) => b.offset - a.offset);
    
    // Appliquer toutes les corrections
    let correctedText = text;
    const correctionParts: Array<{
      original: string;
      replacement: string;
      position: number;
      offset: number; // Pour le debug
    }> = [];

    // Les positions pour le texte surligné doivent être calculées pour le texte final
    let finalPositions: Array<{
      position: number;
      replacement: string;
      original: string;
      offset: number;
    }> = [];

    // Appliquer les corrections et recalculer les positions pour le surlignage
    for (const correction of correctionInfos) {
      const { offset, length, original, replacement } = correction;
      
      // Appliquer la correction
      correctedText = 
        correctedText.substring(0, offset) + 
        replacement + 
        correctedText.substring(offset + length);
      
      // Stocker les informations pour calculer les positions plus tard
      finalPositions.push({
        position: offset,
        replacement,
        original,
        offset // Pour le debug
      });
    }

    // Si nous voulons surligner les corrections, nous devons réaligner les positions
    if (highlightCorrections && finalPositions.length > 0) {
      // Trier les positions de correction du début vers la fin
      finalPositions.sort((a, b) => a.position - b.position);
      
      // Le texte final et les positions de surlignage
      let finalText = text;
      let offsetDelta = 0;
      
      for (let i = 0; i < finalPositions.length; i++) {
        const { position, original, replacement } = finalPositions[i];
        
        // Calculer la position ajustée dans le texte final
        const adjustedPosition = position + offsetDelta;
        
        // Appliquer la correction au texte
        finalText = 
          finalText.substring(0, position + offsetDelta) + 
          replacement + 
          finalText.substring(position + offsetDelta + original.length);
        
        // Enregistrer cette correction pour le surlignage
        correctionParts.push({
          original,
          replacement,
          position: adjustedPosition,
          offset: position // Pour le debug
        });
        
        // Mettre à jour le décalage pour les positions suivantes
        offsetDelta += (replacement.length - original.length);
      }
      
      // Le texte corrigé est notre texte final après toutes les corrections
      correctedText = finalText;
    }
    
    return {
      text: correctedText,
      correctedParts: highlightCorrections ? correctionParts : undefined
    };
  } catch (error) {
    console.error('Erreur API de correction:', error);
    throw new Error('Échec de la correction');
  }
};

/**
 * Group overlapping matches to prevent conflicting corrections
 */
function groupOverlappingMatches(matches: LanguageToolResponse['matches']): Array<LanguageToolResponse['matches']> {
  const groups: Array<LanguageToolResponse['matches']> = [];
  const sortedMatches = [...matches].sort((a, b) => a.offset - b.offset);
  
  let currentGroup: LanguageToolResponse['matches'] = [];
  let currentEnd = -1;
  
  for (const match of sortedMatches) {
    if (match.offset > currentEnd) {
      // Start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [match];
      currentEnd = match.offset + match.length;
    } else {
      // Add to current group
      currentGroup.push(match);
      currentEnd = Math.max(currentEnd, match.offset + match.length);
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

/**
 * Select the best match from a group of overlapping matches
 */
function selectBestMatch(
  group: LanguageToolResponse['matches'], 
  contextAware: boolean
): LanguageToolResponse['matches'][0] {
  if (group.length === 1) return group[0];
  
  return group.reduce((best, current) => {
    if (current.rule.category.id === 'GRAMMAR' && best.rule.category.id !== 'GRAMMAR') {
      return current;
    }
    
    if (contextAware && current.replacements.length > 0 && best.replacements.length > 0) {
      const currentQuality = estimateConfidence(current);
      const bestQuality = estimateConfidence(best);
      
      if (currentQuality > bestQuality) {
        return current;
      }
    }
    
    return current.length > best.length ? current : best;
  }, group[0]);
}

/**
 * Estimate the confidence of a match based on various factors
 */
function estimateConfidence(match: LanguageToolResponse['matches'][0]): number {
  if (!match.replacements.length) return 0;
  
  let confidence = 0.5;
  
  if (match.rule.category.id === 'GRAMMAR') confidence += 0.2;
  if (match.rule.category.id === 'TYPOS') confidence += 0.15;
  
  confidence -= Math.min(0.3, match.replacements.length * 0.03);
  
  if (match.length > 3) confidence += 0.1;
  
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Preserve the original capitalization pattern when replacing text
 */
function preserveOriginalCapitalization(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  
  if (original[0] === original[0].toUpperCase() && replacement.length > 0) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  
  return replacement;
}
