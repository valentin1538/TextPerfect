import React, { useRef, useEffect } from 'react';

interface TextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ text, onTextChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div className="relative rounded-md shadow-sm">
      <label htmlFor="original-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Texte original
      </label>
      <textarea
        ref={textareaRef}
        id="original-text"
        value={text}
        onChange={handleTextChange}
        placeholder="Collez ou écrivez votre texte ici..."
        className="w-full min-h-[300px] p-4 font-serif text-base leading-relaxed border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
      />
      <div className="absolute inset-0 pointer-events-none border border-transparent rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500" />
    </div>
  );
};

export default TextEditor;