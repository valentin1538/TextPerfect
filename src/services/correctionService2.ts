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

/**
 * Text correction service using LanguageTool API
 * 
 * @param text - The text to be corrected
 * @param improvementOptions - Options to customize the correction behavior
 * @returns The corrected text
 */
export const correctText = async (
  text: string, 
  improvementOptions: {
    confidenceThreshold?: number; // 0-1, ignore suggestions below this confidence
    contextAware?: boolean; // Consider surrounding context for better corrections
    preserveCapitalization?: boolean; // Preserve original capitalization when replacing
  } = {}
): Promise<string> => {
  const {
    confidenceThreshold = 0,
    contextAware = true,
    preserveCapitalization = true
  } = improvementOptions;
  
  try {

    const enabledRules = [
      'FR_AGREEMENT_VERB_INFINITIVE_PAST_PARTICIPLE',
      'CONFUSION_EST_ET',
      'FRENCH_VERB_AGREEMENT', // Accord sujet-verbe en français
      'FR_CONJUGATION_ERROR', // Erreurs de conjugaison générales
      'FRENCH_SPELLING', // Orthographe française
      'FR_MISC', // Règles diverses pour le français
      'TYPOGRAPHY', // Règles typographiques
    ].join(',');

    // Enhanced parameters for better correction quality
    const params = new URLSearchParams({
      text,
      language: 'fr',
      disabledRules: 'WHITESPACE_RULE,EN_QUOTES', // Preserve formatting and French quotes
      enabledOnly: 'false',
      level: 'picky', // More thorough checking (default, default_with_ns, picky)
      enabledRules: enabledRules // Ajouter cette ligne pour activer des règles spécifiques
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
    
    let correctedText = text;
    const matches = response.data.matches;
    
    // Group overlapping corrections to prevent conflicts
    const groupedMatches = groupOverlappingMatches(matches);
    
    // Apply corrections from end to start to avoid offset issues
    for (const group of groupedMatches.reverse()) {
      // For groups with multiple options, choose the best one
      const bestMatch = selectBestMatch(group, contextAware);
      
      const offset = bestMatch.offset;
      const length = bestMatch.length;
      
      // Skip corrections with low confidence if threshold is set
      const estimatedConfidence = estimateConfidence(bestMatch);
      if (estimatedConfidence < confidenceThreshold) continue;
      
      if (bestMatch.replacements && bestMatch.replacements.length > 0) {
        let replacement = bestMatch.replacements[0].value;
        
        // Preserve original capitalization if needed
        if (preserveCapitalization) {
          replacement = preserveOriginalCapitalization(
            text.substring(offset, offset + length),
            replacement
          );
        }
        
        correctedText = 
          correctedText.substring(0, offset) + 
          replacement + 
          correctedText.substring(offset + length);
      }
    }
    
    return correctedText;
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
  
  // Prioritize matches by category and confidence
  return group.reduce((best, current) => {
    // Prioritize grammar issues over style suggestions
    if (current.rule.category.id === 'GRAMMAR' && best.rule.category.id !== 'GRAMMAR') {
      return current;
    }
    
    // For contextual corrections, prefer matches with better replacements
    if (contextAware && current.replacements.length > 0 && best.replacements.length > 0) {
      // Check if current replacement fits better in context
      const currentQuality = estimateConfidence(current);
      const bestQuality = estimateConfidence(best);
      
      if (currentQuality > bestQuality) {
        return current;
      }
    }
    
    // Default to the longer match (often more comprehensive)
    return current.length > best.length ? current : best;
  }, group[0]);
}

/**
 * Estimate the confidence of a match based on various factors
 */
function estimateConfidence(match: LanguageToolResponse['matches'][0]): number {
  if (!match.replacements.length) return 0;
  
  // Factors affecting confidence:
  // 1. Number of replacements (fewer is better)
  // 2. Rule category (grammar > spelling > style)
  // 3. Length of the error (longer errors are often more certain)
  
  let confidence = 0.5; // Base confidence
  
  // Adjust based on category
  if (match.rule.category.id === 'GRAMMAR') confidence += 0.2;
  if (match.rule.category.id === 'TYPOS') confidence += 0.15;
  
  // Adjust based on number of replacements
  confidence -= Math.min(0.3, match.replacements.length * 0.03);
  
  // Longer suggestions might be more reliable for certain error types
  if (match.length > 3) confidence += 0.1;
  
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Preserve the original capitalization pattern when replacing text
 */
function preserveOriginalCapitalization(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  
  // If original is all uppercase, make replacement all uppercase
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  
  // If original starts with uppercase, capitalize replacement
  if (original[0] === original[0].toUpperCase() && replacement.length > 0) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  
  return replacement;
}
