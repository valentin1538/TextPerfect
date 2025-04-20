import React, { useState, useEffect } from 'react';
import { Clipboard, Check, Edit2, Save } from 'lucide-react';

interface CorrectedOutputProps {
  text: string;
  isLoading: boolean;
  isCorrected: boolean;
  onTextChange?: (newText: string) => void; // Callback pour informer le parent des changements
}

const CorrectedOutput: React.FC<CorrectedOutputProps> = ({ 
  text, 
  isLoading, 
  isCorrected,
  onTextChange 
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  
  // Mettre à jour editedText quand text change (par ex, nouvelle correction)
  useEffect(() => {
    setEditedText(text);
  }, [text]);

  const copyToClipboard = () => {
    if (!editedText) return;
    
    navigator.clipboard.writeText(editedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    if (onTextChange) {
      onTextChange(e.target.value);
    }
  };
  
  const toggleEditMode = () => {
    if (isEditing && onTextChange) {
      onTextChange(editedText);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Texte corrigé {isEditing && "(en édition)"}
        </label>
        <div className="flex gap-2">
          {!isLoading && text && (
            <button
              onClick={toggleEditMode}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-1 text-sm"
              title={isEditing ? "Sauvegarder les modifications" : "Modifier le texte"}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  <span>Modifier</span>
                </>
              )}
            </button>
          )}
          {text && (
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-1 text-sm"
              title="Copier le texte corrigé"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copié!</span>
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" />
                  <span>Copier</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="w-full min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[300px] p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isEditing ? (
          <textarea
            value={editedText}
            onChange={handleTextChange}
            className="w-full min-h-[300px] p-4 font-serif text-base leading-relaxed border border-blue-500 dark:border-blue-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        ) : text ? (
          <div 
            className="w-full min-h-[300px] p-4 font-serif text-base leading-relaxed border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-auto"
            dangerouslySetInnerHTML={{ __html: editedText.replace(/\n/g, '<br>') }} 
          />
        ) : (
          <div className="text-gray-400 dark:text-gray-500 h-full min-h-[300px] flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            {isCorrected 
              ? "Aucune correction nécessaire." 
              : "Le texte corrigé apparaîtra ici."}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectedOutput;
