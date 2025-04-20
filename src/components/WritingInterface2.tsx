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
  const [correctionSettings, setCorrectionSettings] = useState({
    confidenceThreshold: 0.2,
    contextAware: true,
    preserveCapitalization: true
  });

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
      // Utilisons les options avancées du service de correction
      const result = await correctText(originalText.content, correctionSettings);
      setCorrectedText(prev => ({ ...prev, content: result }));
      setIsCorrected(true);
    } catch (error) {
      console.error('Error correcting text:', error);
      // Handle error - could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  // Optionnel: fonction pour ajuster les paramètres de correction
  const updateCorrectionSetting = (setting: keyof typeof correctionSettings, value: any) => {
    setCorrectionSettings(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <div className="flex flex-col space-y-6">
      <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-white">
        Correcteur de Texte pour Écrivains
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300">
        Collez votre texte ci-dessous pour corriger la grammaire, l'orthographe et la conjugaison tout en préservant le style et la mise en forme.
      </p>
      
      {/* Optionnel: Panneau de configuration avancée (peut être caché par défaut) */}
      
      {/* <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Options avancées</h3>
        <div className="flex flex-wrap gap-4">
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
          <div>
            <label className="block text-sm">Seuil de confiance: {correctionSettings.confidenceThreshold}</label>
            <input 
              type="range" 
              min="0" 
              max="0.9" 
              step="0.1"
              value={correctionSettings.confidenceThreshold}
              onChange={e => updateCorrectionSetting('confidenceThreshold', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div> */}
     
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TextEditor 
            text={originalText.content} 
            onTextChange={handleTextChange}
          />
          <TextStats stats={originalText.stats} />
          
          <div className="mt-4">
            <button
              onClick={handleCorrect}
              disabled={isLoading || originalText.content.trim() === ''}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                isLoading || originalText.content.trim() === ''
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Correction en cours...
                </span>
              ) : (
                'Corriger le texte'
              )}
            </button>
          </div>
        </div>
        
        <div>
          <CorrectedOutput 
            text={correctedText.content} 
            isLoading={isLoading}
            isCorrected={isCorrected}
          />
          {isCorrected && <TextStats stats={correctedText.stats} />}
        </div>
      </div>
    </div>
  );
};

export default WritingInterface2;
