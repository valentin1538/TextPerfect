import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import CorrectedOutput from './CorrectedOutput';
import TextStats from './TextStats';
import { correctText } from '../services/correctionService2';

interface TextState {
  content: string;
  stats: {
    characters: number;
    words: number;
    sentences: number;
  };
}

const WritingInterface2: React.FC = () => {
  const [originalText, setOriginalText] = useState<TextState>({
    content: '',
    stats: { characters: 0, words: 0, sentences: 0 }
  });
  
  const [correctedText, setCorrectedText] = useState<TextState>({
    content: '',
    stats: { characters: 0, words: 0, sentences: 0 }
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCorrected, setIsCorrected] = useState<boolean>(false);
  const [highlightedText, setHighlightedText] = useState<string>('');
  
  const [correctionSettings, setCorrectionSettings] = useState({
    confidenceThreshold: 0.2,
    contextAware: true,
    preserveCapitalization: true,
    highlightCorrections: false
  });

  const updateCorrectionSetting = (key: keyof typeof correctionSettings, value: any) => {
    setCorrectionSettings(prev => ({ ...prev, [key]: value }));
  };

  // Update stats when text changes
  useEffect(() => {
    const stats = calculateStats(originalText.content);
    setOriginalText(prev => ({ ...prev, stats }));
  }, [originalText.content]);

  useEffect(() => {
    const stats = calculateStats(correctedText.content);
    setCorrectedText(prev => ({ ...prev, stats }));
  }, [correctedText.content]);

  const calculateStats = (text: string) => {
    const characters = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+\s/).filter(Boolean).length;
    
    return { characters, words, sentences };
  };

  const handleTextChange = (newText: string) => {
    setOriginalText(prev => ({ ...prev, content: newText }));
    
    // Reset corrected text if original is changed after correction
    if (isCorrected) {
      setIsCorrected(false);
    }
  };
  
  const handleCorrect = async () => {
    if (originalText.content.trim() === '') return;
    
    setIsLoading(true);
    
    try {
      // Utiliser les options avancées du service de correction
      const result = await correctText(originalText.content, correctionSettings);
      
      // Mettre à jour le texte corrigé
      if (typeof result === 'string') {
        setCorrectedText(prev => ({ ...prev, content: result }));
        setHighlightedText('');
      } else {
        setCorrectedText(prev => ({ ...prev, content: result.text }));
        
        // Générer le HTML surligné si l'option est activée et qu'il y a des corrections
        if (correctionSettings.highlightCorrections && result.correctedParts && result.correctedParts.length > 0) {
          // Trier les parties corrigées par position, de la fin au début
          const sortedParts = [...result.correctedParts].sort((a, b) => b.position - a.position);
          
          // Commencer avec le texte corrigé
          let htmlContent = result.text;
          
          // Remplacer chaque correction par sa version surlignée
          for (const part of sortedParts) {
            const replacement = `<span class="bg-yellow-200 dark:bg-yellow-700 font-bold">${part.replacement}</span>`;
            
            // Remplacer uniquement l'instance exacte à la position correcte
            htmlContent = 
              htmlContent.substring(0, part.position) + 
              replacement + 
              htmlContent.substring(part.position + part.replacement.length);
          }
          
          setHighlightedText(htmlContent);
        } else {
          setHighlightedText('');
        }
      }
      
      setIsCorrected(true);
    } catch (error) {
      console.error('Error correcting text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCorrectedText({ content: '', stats: { characters: 0, words: 0, sentences: 0 } });
    setIsCorrected(false);
    setHighlightedText('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-start mb-4">
          <div className="w-full md:w-1/2 md:pr-4 mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Texte original</h2>
            <TextEditor 
              text={originalText.content} 
              onTextChange={handleTextChange} 
            />
            <TextStats stats={originalText.stats} />
          </div>
          
          <div className="w-full md:w-1/2 md:pl-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Texte corrigé</h2>
            <CorrectedOutput 
              text={correctedText.content}
              highlightedText={highlightedText}
              isLoading={isLoading}
              isCorrected={isCorrected}
            />
            <TextStats stats={correctedText.stats} />
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <details>
              <summary className="font-medium cursor-pointer text-blue-600 dark:text-blue-400">Options avancées</summary>
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={correctionSettings.contextAware}
                      onChange={e => updateCorrectionSetting('contextAware', e.target.checked)}
                      className="mr-2"
                    />
                    Correction contextuelle
                  </label>
                  
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={correctionSettings.preserveCapitalization}
                      onChange={e => updateCorrectionSetting('preserveCapitalization', e.target.checked)}
                      className="mr-2"
                    />
                    Conserver la casse
                  </label>
                  
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={correctionSettings.highlightCorrections}
                      onChange={e => updateCorrectionSetting('highlightCorrections', e.target.checked)}
                      className="mr-2"
                    />
                    Surligner les corrections
                  </label>
                </div>
                
                <div>
                  <label className="block mb-1">Seuil de confiance: {correctionSettings.confidenceThreshold}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={correctionSettings.confidenceThreshold}
                    onChange={e => updateCorrectionSetting('confidenceThreshold', parseFloat(e.target.value))}
                    className="w-full max-w-xs"
                  />
                </div>
              </div>
            </details>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleCorrect}
              disabled={isLoading || originalText.content.trim() === ''}
              className={`px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors ${
                isLoading || originalText.content.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Corriger le texte
            </button>
            
            <button
              onClick={handleReset}
              disabled={isLoading || !isCorrected}
              className={`px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors ${
                isLoading || !isCorrected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingInterface2;