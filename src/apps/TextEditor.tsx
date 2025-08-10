import React, { useState, useEffect, useRef } from 'react';
import { vfsSyncService } from '../services/vfsSyncService';
import { useWindowStore } from '../store/windowStore';
import { useTheme, getThemeClasses } from '../hooks/useTheme';

interface TextEditorProps {
  filePath?: string;
  initialContent?: string;
  fileName?: string;
  windowId?: string;
}

const TextEditorEnhanced: React.FC<TextEditorProps> = ({ 
  filePath, 
  initialContent = '', 
  fileName = 'Untitled.txt',
  windowId
}) => {
  const { updateWindowState, windows } = useWindowStore();
  const { isLight } = useTheme();
  const theme = getThemeClasses(isLight);
  
  // Find current window state
  const currentWindow = windows.find(w => w.id === windowId);
  const editorState = currentWindow?.savedState?.customData?.editor as any;
  
  const [content, setContent] = useState(editorState?.content || initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(editorState?.content || initialContent);
  const [isAutoSave, setIsAutoSave] = useState(editorState?.isAutoSave ?? true);
  const [fontSize, setFontSize] = useState(editorState?.fontSize || 14);
  const [wordWrap, setWordWrap] = useState(editorState?.wordWrap ?? true);
  const [showLineNumbers, setShowLineNumbers] = useState(editorState?.showLineNumbers ?? true);
  const [cursorPosition, setCursorPosition] = useState(editorState?.cursorPosition || { line: 1, column: 1 });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save state to window store whenever important state changes
  useEffect(() => {
    if (windowId && textareaRef.current) {
      const textarea = textareaRef.current;
      updateWindowState(windowId, {
        customData: {
          editor: {
            content,
            isAutoSave,
            fontSize,
            wordWrap,
            showLineNumbers,
            cursorPosition,
            scrollPosition: { x: textarea.scrollLeft, y: textarea.scrollTop }
          }
        },
        cursorPosition: textarea.selectionStart
      });
    }
  }, [windowId, content, isAutoSave, fontSize, wordWrap, showLineNumbers, cursorPosition, updateWindowState]);

  // Restore scroll position when component mounts
  useEffect(() => {
    if (textareaRef.current && editorState?.scrollPosition) {
      textareaRef.current.scrollLeft = editorState.scrollPosition.x;
      textareaRef.current.scrollTop = editorState.scrollPosition.y;
    }
  }, [editorState]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('weave-editor-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 14);
      setWordWrap(settings.wordWrap !== false);
      setShowLineNumbers(settings.showLineNumbers !== false);
      // Theme is now controlled globally, no need to set locally
      setIsAutoSave(settings.isAutoSave !== false);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: any) => {
    const settings = {
      fontSize,
      wordWrap,
      showLineNumbers,
      theme,
      isAutoSave,
      ...newSettings
    };
    localStorage.setItem('weave-editor-settings', JSON.stringify(settings));
  };

  // Update cursor position
  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      setCursorPosition({ line, column });
    }
  };

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
      }, 2000);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [content, isAutoSave, hasUnsavedChanges, filePath]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateCursorPosition();
  };

  const handleCursorMove = () => {
    updateCursorPosition();
  };

  const handleSave = async () => {
    try {
      if (filePath) {
        vfsSyncService.updateFile(filePath, content);
        setLastSavedContent(content);
        setHasUnsavedChanges(false);
        showNotification(`Saved ${fileName}`, 'success');
      } else {
        // For new files, save to a default location
        const newPath = `/Documents/${fileName}`;
        try {
          vfsSyncService.createFile(newPath, content);
          setLastSavedContent(content);
          setHasUnsavedChanges(false);
          showNotification(`Saved as ${newPath}`, 'success');
        } catch (error) {
          showNotification('Failed to save file', 'error');
        }
      }
    } catch (error) {
      showNotification('Failed to save file', 'error');
      console.error('Error saving file:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Ctrl+Plus/Minus for font size
    if (e.ctrlKey && e.key === '=') {
      e.preventDefault();
      const newFontSize = Math.min(fontSize + 2, 24);
      setFontSize(newFontSize);
      saveSettings({ fontSize: newFontSize });
    }
    
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      const newFontSize = Math.max(fontSize - 2, 10);
      setFontSize(newFontSize);
      saveSettings({ fontSize: newFontSize });
    }
    
    // Tab insertion
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const spaces = '  '; // 2 spaces for tab
      setContent(content.substring(0, start) + spaces + content.substring(end));
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        updateCursorPosition();
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
      'scss': 'SCSS',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'php': 'PHP',
      'xml': 'XML',
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

  const getSelectionInfo = () => {
    const textarea = textareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      return {
        characters: selectedText.length,
        words: selectedText.trim() === '' ? 0 : selectedText.trim().split(/\s+/).length,
        lines: selectedText.split('\n').length
      };
    }
    return null;
  };

  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setContent(content.substring(0, start) + template + content.substring(end));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + template.length;
        textarea.focus();
        updateCursorPosition();
      }, 0);
    }
  };

  const templates = {
    html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>',
    react: 'import React from \'react\';\n\nconst Component = () => {\n    return (\n        <div>\n            \n        </div>\n    );\n};\n\nexport default Component;',
    function: 'function functionName() {\n    // Your code here\n    return;\n}',
    class: 'class ClassName {\n    constructor() {\n        // Constructor code\n    }\n    \n    method() {\n        // Method code\n    }\n}'
  };

  return (
    <div className={`w-full h-full ${theme.bgPrimary} rounded-xl border ${theme.border} flex flex-col overflow-hidden`}>
      {/* Toolbar */}
      <div className={`${theme.bgSecondary} border-b ${theme.border} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <div>
                <div className={`${theme.textPrimary} font-semibold flex items-center gap-2`}>
                  {fileName}
                  {hasUnsavedChanges && <span className="text-orange-400">●</span>}
                </div>
                <div className={`${theme.textMuted} text-sm`}>
                  {getLanguageFromExtension(fileName)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  insertTemplate(templates[e.target.value as keyof typeof templates]);
                  e.target.value = '';
                }
              }}
              className={`${theme.bgSecondary} border ${theme.border} rounded-lg px-3 py-2 ${theme.textPrimary} text-sm focus:outline-none focus:border-blue-400`}
              defaultValue=""
            >
              <option value="" className={theme.bgSecondary}>Insert Template</option>
              <option value="html" className={theme.bgSecondary}>HTML Document</option>
              <option value="react" className={theme.bgSecondary}>React Component</option>
              <option value="function" className={theme.bgSecondary}>Function</option>
              <option value="class" className={theme.bgSecondary}>Class</option>
            </select>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                hasUnsavedChanges
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : `${theme.bgSecondary} ${theme.textMuted} cursor-not-allowed`
              }`}
              title="Save (Ctrl+S)"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* Editor Controls */}
        <div className="flex items-center gap-4 text-sm">
          <label className={`flex items-center gap-2 ${theme.textSecondary}`}>
            <input
              type="checkbox"
              checked={isAutoSave}
              onChange={(e) => {
                setIsAutoSave(e.target.checked);
                saveSettings({ isAutoSave: e.target.checked });
              }}
              className={`w-4 h-4 rounded border ${theme.border} ${theme.bgSecondary} text-blue-500`}
            />
            Auto-save
          </label>

          <label className={`flex items-center gap-2 ${theme.textSecondary}`}>
            <input
              type="checkbox"
              checked={wordWrap}
              onChange={(e) => {
                setWordWrap(e.target.checked);
                saveSettings({ wordWrap: e.target.checked });
              }}
              className={`w-4 h-4 rounded border ${theme.border} ${theme.bgSecondary} text-blue-500`}
            />
            Word wrap
          </label>

          <label className={`flex items-center gap-2 ${theme.textSecondary}`}>
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => {
                setShowLineNumbers(e.target.checked);
                saveSettings({ showLineNumbers: e.target.checked });
              }}
              className={`w-4 h-4 rounded border ${theme.border} ${theme.bgSecondary} text-blue-500`}
            />
            Line numbers
          </label>

          <div className={`flex items-center gap-2 ${theme.textSecondary}`}>
            <span>Font size:</span>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setFontSize(newSize);
                saveSettings({ fontSize: newSize });
              }}
              className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-8 text-center">{fontSize}</span>
          </div>
        </div>

        {/* Removed theme buttons - theme is now controlled globally through Settings */}
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        {showLineNumbers && (
          <div 
            className={`w-16 ${theme.bgSecondary} border-r ${theme.border} text-right ${theme.textMuted} font-mono text-sm py-4 px-2 overflow-hidden`}
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
          >
            {content.split('\n').map((_: string, index: number) => (
              <div key={index} className="h-6 leading-6">
                {index + 1}
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onClick={handleCursorMove}
            onKeyUp={handleCursorMove}
            placeholder="Start typing your code or text..."
            className={`w-full h-full resize-none border-none outline-none p-4 ${theme.bgPrimary} ${theme.textPrimary} font-mono leading-6`}
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordWrap: wordWrap ? 'break-word' : 'normal',
              overflowWrap: wordWrap ? 'break-word' : 'normal'
            }}
            spellCheck={['md', 'txt'].includes(getFileExtension(fileName))}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className={`${theme.bgSecondary} border-t ${theme.border} px-4 py-2 text-sm ${theme.textMuted} flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>Lines: {getLineCount()}</span>
          <span>Words: {getWordCount()}</span>
          <span>Characters: {getCharacterCount()}</span>
          {getSelectionInfo() && (
            <span className="text-blue-400">
              Selected: {getSelectionInfo()?.characters} chars, {getSelectionInfo()?.words} words
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {filePath && (
            <span className={theme.textMuted}>
              📁 {filePath}
            </span>
          )}
          <span className={hasUnsavedChanges ? 'text-orange-400' : 'text-green-400'}>
            {hasUnsavedChanges ? '● Unsaved changes' : '✓ Saved'}
          </span>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default TextEditorEnhanced;
