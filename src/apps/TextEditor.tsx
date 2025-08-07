import React, { useState, useEffect, useRef } from 'react';
import { vfsSyncService } from '../filesystem/vfsSyncService';

interface TextEditorProps {
  filePath?: string;
  initialContent?: string;
  fileName?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  filePath, 
  initialContent = '', 
  fileName = 'Untitled.txt' 
}) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [isAutoSave, setIsAutoSave] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== lastSavedContent);
  }, [content, lastSavedContent]);

  // Auto-save functionality
  useEffect(() => {
    let autoSaveTimer: NodeJS.Timeout;
    
    if (isAutoSave && hasUnsavedChanges && filePath) {
      autoSaveTimer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [content, isAutoSave, hasUnsavedChanges, filePath]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = async () => {
    try {
      if (filePath) {
        // Save to existing file using new VFS
        vfsSyncService.updateFile(filePath, content);
        setLastSavedContent(content);
        setHasUnsavedChanges(false);
        console.log(`File saved: ${filePath}`);
      } else {
        // For new files, we would need to implement a "Save As" dialog
        // For now, just update the state
        setLastSavedContent(content);
        setHasUnsavedChanges(false);
        console.log('Content saved to buffer (no file path specified)');
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Tab insertion
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      setContent(content.substring(0, start) + '  ' + content.substring(end));
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = getFileExtension(filename);
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'React JSX',
      'ts': 'TypeScript',
      'tsx': 'React TSX',
      'json': 'JSON',
      'md': 'Markdown',
      'html': 'HTML',
      'css': 'CSS',
      'py': 'Python',
      'txt': 'Plain Text',
    };
    return languageMap[ext] || 'Plain Text';
  };

  const getLineCount = () => {
    return content.split('\n').length;
  };

  const getCharacterCount = () => {
    return content.length;
  };

  const getWordCount = () => {
    return content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 min-h-12">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📝</span>
            <span className="font-medium text-gray-800">
              {fileName}
              {hasUnsavedChanges && <span className="text-orange-500 ml-1">●</span>}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {getLanguageFromExtension(fileName)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-save toggle */}
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isAutoSave}
              onChange={(e) => setIsAutoSave(e.target.checked)}
              className="rounded"
            />
            <span>Auto-save</span>
          </label>
          
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              hasUnsavedChanges
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Save (Ctrl+S)"
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing..."
            className="w-full h-full resize-none border-none outline-none p-4 font-mono text-sm leading-6 bg-white"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              minHeight: '100%',
            }}
            spellCheck={getFileExtension(fileName) === 'md' || getFileExtension(fileName) === 'txt'}
          />
        </div>
        
        {/* Line numbers (optional enhancement) */}
        <div className="w-12 bg-gray-100 border-l border-gray-200 text-right text-xs text-gray-500 font-mono p-2 leading-6">
          {content.split('\n').map((_, index) => (
            <div key={index} className="h-6">
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Lines: {getLineCount()}</span>
          <span>Words: {getWordCount()}</span>
          <span>Characters: {getCharacterCount()}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {filePath && (
            <span className="text-gray-500">
              📁 {filePath}
            </span>
          )}
          <span>
            {hasUnsavedChanges ? '● Unsaved changes' : '✓ Saved'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
