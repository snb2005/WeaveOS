import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import * as git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
import { vfsSyncService } from '../services/vfsSyncService';
import { simpleGit } from '../utils/simpleGit';

interface CodeEditorProps {
  windowId?: string;
  filePath?: string;
  initialContent?: string;
  fileName?: string;
}

interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
  language: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  filePath: initialFilePath,
  initialContent,
  fileName: initialFileName 
}) => {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [useSimpleGit, setUseSimpleGit] = useState(false);
  const [vimMode, setVimMode] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [fileTree, setFileTree] = useState<Array<{name: string, path: string, isDirectory: boolean}>>([]);
  const [currentRepo, setCurrentRepo] = useState<string>('');
  const [gitStatus, setGitStatus] = useState<string>('');
  // const [vimStatus, setVimStatus] = useState<string>('-- NORMAL --'); // TODO: Implement vim status display
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [fileBrowserMode, setFileBrowserMode] = useState<'open' | 'save'>('open');
  const [currentBrowserPath, setCurrentBrowserPath] = useState('/');
  const [browserFiles, setBrowserFiles] = useState<Array<{name: string, path: string, isDirectory: boolean}>>([]);
  const [saveFileName, setSaveFileName] = useState('');
  const [isLoadingBrowser, setIsLoadingBrowser] = useState(false);
  const editorRef = useRef<any>(null);
  const fsRef = useRef<FS | null>(null);
  const vimModeRef = useRef<any>(null);

  // Initialize file system
  useEffect(() => {
    try {
      fsRef.current = new FS('WeaveCodeEditor');
      loadFileTree();
    } catch (error) {
      console.error('Error initializing file system:', error);
    }
  }, []);

  // Refresh file tree when files are saved (debounced)
  useEffect(() => {
    const dirtyFiles = tabs.filter(tab => tab.isDirty);
    
    // Only refresh if there are no dirty files (meaning all files are saved)
    if (dirtyFiles.length === 0 && tabs.length > 0) {
      const refreshTimer = setTimeout(() => {
        console.log('Auto-refreshing file tree after save...');
        loadFileTree();
      }, 1000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [tabs.map(tab => tab.isDirty).join(','), tabs.length]);

  const loadFileTree = async () => {
    try {
      console.log('Loading file tree from VFS...');
      const rootFiles = await vfsSyncService.listDir('/');
      console.log('VFS root files:', rootFiles);
      console.log('First root file structure:', rootFiles[0]); // Debug the actual structure
      
      const treeItems = rootFiles.map((file: any) => {
        // For root files, construct path like the Files app does
        const fullPath = `/${file.name}`;
        
        console.log(`Root file: ${file.name}, constructed path: ${fullPath}, type: ${file.type}`);
        
        return {
          name: file.name,
          path: fullPath,
          isDirectory: file.type === 'folder'
        };
      });
      
      console.log('File tree items:', treeItems);
      setFileTree(treeItems);
    } catch (error) {
      console.error('Error loading file tree:', error);
      setFileTree([]);
    }
  };

  const loadBrowserFiles = async (path: string) => {
    setIsLoadingBrowser(true);
    try {
      console.log('Loading browser files for path:', path);
      const files = await vfsSyncService.listDir(path);
      console.log('VFS returned files:', files);
      console.log('First file structure:', files[0]); // Debug the actual structure
      
      const treeItems = files.map((file: any) => {
        // Construct the full path like the Files app does
        let fullPath;
        if (path === '/') {
          fullPath = `/${file.name}`;
        } else {
          // Remove trailing slash from path before concatenating
          const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
          fullPath = `${cleanPath}/${file.name}`;
        }
        
        console.log(`File: ${file.name}, constructed path: ${fullPath}, type: ${file.type}`);
        
        return {
          name: file.name,
          path: fullPath,
          isDirectory: file.type === 'folder'
        };
      });
      
      console.log('Processed tree items:', treeItems);
      setBrowserFiles(treeItems);
    } catch (error) {
      console.error('Error loading browser files:', error);
      setBrowserFiles([]);
      // Show error to user
      alert(`Failed to load directory "${path}": ${(error as Error).message}`);
    } finally {
      setIsLoadingBrowser(false);
    }
  };

  const openFileBrowser = (mode: 'open' | 'save') => {
    console.log('Opening file browser in mode:', mode);
    setFileBrowserMode(mode);
    setCurrentBrowserPath('/');
    if (mode === 'save' && activeTab) {
      setSaveFileName(activeTab.name);
    } else {
      setSaveFileName('');
    }
    loadBrowserFiles('/');
    setShowFileBrowser(true);
  };

  const navigateToBrowserPath = (path: string) => {
    console.log('Navigating to browser path:', path);
    // Ensure path is properly formatted
    const cleanPath = path === '' ? '/' : path;
    setCurrentBrowserPath(cleanPath);
    loadBrowserFiles(cleanPath);
  };

  const handleBrowserFileSelect = (file: {name: string, path: string, isDirectory: boolean}) => {
    console.log('File selected:', file);
    
    if (file.isDirectory) {
      console.log('Navigating to directory:', file.path);
      navigateToBrowserPath(file.path);
    } else if (fileBrowserMode === 'open') {
      console.log('Opening file:', file.path);
      setShowFileBrowser(false);
      loadFileFromVFS(file.path);
    } else if (fileBrowserMode === 'save') {
      // For save mode, populate the filename when clicking a file
      setSaveFileName(file.name);
    }
  };

  const handleBrowserSave = async () => {
    if (!saveFileName.trim()) {
      alert('Please enter a file name');
      return;
    }
    
    // Clean up the path construction
    let fullPath;
    if (currentBrowserPath === '/') {
      fullPath = `/${saveFileName}`;
    } else {
      // Remove trailing slash from currentBrowserPath if it exists
      const cleanPath = currentBrowserPath.endsWith('/') ? currentBrowserPath.slice(0, -1) : currentBrowserPath;
      fullPath = `${cleanPath}/${saveFileName}`;
    }
    
    console.log('Save As: Setting file path to:', fullPath);
    
    if (activeTab) {
      // Update the tab with new path and name
      const language = getLanguageFromFileName(saveFileName);
      
      // Update the tab immediately and wait for state to update
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, path: fullPath, name: saveFileName, language, isDirty: true }
            : tab
        )
      );
      
      setShowFileBrowser(false);
      
      // Wait a moment for the state to update, then save directly to the correct path
      setTimeout(async () => {
        try {
          console.log('Save As: Saving content to VFS at path:', fullPath);
          
          // Save directly to VFS with the correct path
          const exists = await vfsSyncService.exists(fullPath);
          if (exists) {
            await vfsSyncService.updateFile(fullPath, activeTab.content, 'codeeditor');
            console.log('Save As: File updated in VFS:', fullPath);
          } else {
            await vfsSyncService.createFile(fullPath, activeTab.content, 'codeeditor');
            console.log('Save As: File created in VFS:', fullPath);
          }
          
          // Update tab to mark as saved
          setTabs(prevTabs => 
            prevTabs.map(tab => 
              tab.id === activeTabId 
                ? { ...tab, isDirty: false, path: fullPath, name: saveFileName }
                : tab
            )
          );
          
          console.log('Save As: File saved successfully');
          
          // Refresh file system views
          await Promise.all([
            loadFileTree(),
            loadBrowserFiles(currentBrowserPath)
          ]);
          
        } catch (error) {
          console.error('Save As: Error saving file:', error);
          alert('Failed to save file: ' + (error as Error).message);
        }
      }, 100);
    }
  };

  const createNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName?.trim()) return;
    
    try {
      // Clean up the path construction
      let folderPath;
      if (currentBrowserPath === '/') {
        folderPath = `/${folderName}`;
      } else {
        const cleanPath = currentBrowserPath.endsWith('/') ? currentBrowserPath.slice(0, -1) : currentBrowserPath;
        folderPath = `${cleanPath}/${folderName}`;
      }
      
      console.log('Creating folder at path:', folderPath);
      await vfsSyncService.createFolder(folderPath);
      
      console.log('Folder created successfully, refreshing views...');
      
      // Refresh both the browser files and main file tree
      await Promise.all([
        loadBrowserFiles(currentBrowserPath),
        loadFileTree()
      ]);
      
      console.log('Views refreshed after folder creation');
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + (error as Error).message);
    }
  };

  // Initialize with initial file if provided
  useEffect(() => {
    if (initialFilePath && initialContent !== undefined && initialFileName) {
      const language = getLanguageFromFileName(initialFileName);
      const newTab: FileTab = {
        id: `tab-${Date.now()}`,
        name: initialFileName,
        path: initialFilePath,
        content: initialContent,
        isDirty: false,
        language
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    }
  }, [initialFilePath, initialContent, initialFileName]);

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor
    monaco.editor.defineTheme('weave-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a2e',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#6b7280',
        'editor.selectionBackground': '#4c1d95',
        'editor.lineHighlightBackground': '#16213e'
      }
    });
    
    monaco.editor.setTheme('weave-dark');

    // Initialize vim mode if enabled
    if (vimMode) {
      try {
        // Dynamic import for monaco-vim
        import('monaco-vim').then(({ initVimMode }) => {
          const statusNode = document.createElement('div');
          statusNode.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:20px;background:#1a1a2e;color:white;padding:2px 8px;font-size:12px;z-index:1000;';
          editor.getDomNode()?.appendChild(statusNode);
          
          vimModeRef.current = initVimMode(editor, statusNode);
        }).catch(err => {
          console.error('Error loading vim mode:', err);
        });
      } catch (error) {
        console.error('Vim mode not available:', error);
      }
    } else if (vimModeRef.current) {
      // Disable vim mode
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => {
      handleSaveAs();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => {
      handleOpenFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, () => {
      handleNewFile();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeTabId || value === undefined) return;
    
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content: value, isDirty: true }
          : tab
      )
    );
  };

  const handleNewFile = () => {
    const timestamp = Date.now();
    const newTab: FileTab = {
      id: `tab-${timestamp}`,
      name: 'untitled.txt',
      path: `/tmp/untitled-${timestamp}.txt`, // Give it a default path in tmp
      content: '',
      isDirty: false,
      language: 'plaintext'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleOpenFile = () => {
    openFileBrowser('open');
  };

  const loadFileFromVFS = async (filePath: string) => {
    console.log('Loading file from VFS:', filePath);
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const fileName = filePath.split('/').pop() || 'untitled';
      const language = getLanguageFromFileName(fileName);
      
      // Check if file is already open
      const existingTab = tabs.find(tab => tab.path === filePath);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }
      
      const newTab: FileTab = {
        id: `tab-${Date.now()}`,
        name: fileName,
        path: filePath,
        content,
        isDirty: false,
        language
      };
      
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      console.log('File loaded successfully:', fileName);
    } catch (error) {
      console.error('Error loading file from VFS:', error);
      
      // Show a more informative error to the user
      const fileName = filePath.split('/').pop() || 'untitled';
      const shouldCreateNew = window.confirm(
        `Failed to load file "${fileName}" from path "${filePath}". Would you like to create a new file with this name?`
      );
      
      if (shouldCreateNew) {
        const language = getLanguageFromFileName(fileName);
        
        const newTab: FileTab = {
          id: `tab-${Date.now()}`,
          name: fileName,
          path: filePath,
          content: '',
          isDirty: false,
          language
        };
        
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
    }
  };

  const handleSaveAs = async () => {
    if (!activeTab) return;
    openFileBrowser('save');
  };

  const handleSaveFile = async () => {
    if (!activeTab) return;
    
    try {
      // For new files without a path, create a default path
      let filePath = activeTab.path;
      if (!filePath || filePath === '') {
        filePath = `/tmp/${activeTab.name}`;
        
        // Update the tab with the new path
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, path: filePath }
              : tab
          )
        );
      }
      
      console.log('Regular Save: Saving file to path:', filePath);
      
      // Save to VFS (our primary file system)
      try {
        // Check if file exists, then update or create
        const exists = await vfsSyncService.exists(filePath);
        if (exists) {
          await vfsSyncService.updateFile(filePath, activeTab.content, 'codeeditor');
          console.log('Regular Save: File updated in VFS:', filePath);
        } else {
          await vfsSyncService.createFile(filePath, activeTab.content, 'codeeditor');
          console.log('Regular Save: File created in VFS:', filePath);
        }
        
        // Mark file as saved
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, isDirty: false, path: filePath }
              : tab
          )
        );
        
        // Refresh file trees to show the new/updated file
        await loadFileTree();
        
        // If file browser is open, refresh it too
        if (showFileBrowser) {
          await loadBrowserFiles(currentBrowserPath);
        }
        
        console.log(`Regular Save: File saved successfully to VFS: ${filePath}`);
      } catch (vfsError) {
        console.error('Regular Save: VFS save failed:', vfsError);
        
        // Fallback: try to save to lightning-fs with proper directory creation
        if (fsRef.current) {
          try {
            // Ensure directory exists
            const dirPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
            if (dirPath !== '/') {
              try {
                // Create directories recursively
                const pathParts = dirPath.split('/').filter(part => part);
                let currentPath = '';
                for (const part of pathParts) {
                  currentPath += '/' + part;
                  try {
                    await fsRef.current.promises.mkdir(currentPath);
                  } catch (mkdirError) {
                    // Directory might already exist, continue
                  }
                }
              } catch (mkdirError) {
                // Directory creation failed, but continue with file save attempt
              }
            }
            
            // Now save the file
            await fsRef.current.promises.writeFile(filePath, activeTab.content);
            
            setTabs(prevTabs => 
              prevTabs.map(tab => 
                tab.id === activeTabId 
                  ? { ...tab, isDirty: false, path: filePath }
                  : tab
              )
            );
            
            console.log(`Regular Save: File saved to lightning-fs: ${filePath}`);
          } catch (fsError) {
            console.error('Regular Save: Lightning-fs save also failed:', fsError);
            // If both systems fail, just mark as clean but warn user
            setTabs(prevTabs => 
              prevTabs.map(tab => 
                tab.id === activeTabId 
                  ? { ...tab, isDirty: false }
                  : tab
              )
            );
            alert('Warning: File saved locally but may not persist. Try saving to a different location.');
          }
        } else {
          throw vfsError; // Re-throw VFS error if no fallback available
        }
      }
    } catch (error) {
      console.error('Regular Save: Error saving file:', error);
      alert('Failed to save file. Please try again or choose a different location.');
    }
  };

  const handleCloseTab = (tabId: string) => {
    const tabToClose = tabs.find(tab => tab.id === tabId);
    if (tabToClose?.isDirty) {
      const shouldClose = window.confirm(`"${tabToClose.name}" has unsaved changes. Close anyway?`);
      if (!shouldClose) return;
    }

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[0].id : null);
    }
  };

  const initializeGitRepo = async () => {
    setGitStatus('Initializing repository...');
    
    // Try isomorphic-git first
    if (!useSimpleGit && fsRef.current) {
      try {
        await git.init({
          fs: fsRef.current,
          dir: '/repo',
          defaultBranch: 'main'
        });
        
        setCurrentRepo('/repo');
        setGitStatus('Repository initialized (isomorphic-git)');
        return;
      } catch (error) {
        console.warn('isomorphic-git failed, falling back to simple git:', error);
        setUseSimpleGit(true);
      }
    }
    
    // Fallback to simple git
    try {
      simpleGit.init();
      setCurrentRepo('simple-git');
      setGitStatus('Repository initialized (simple git)');
    } catch (error) {
      console.error('Failed to initialize any git system:', error);
      setGitStatus('Error initializing repository');
    }
  };

  const commitChanges = async () => {
    if (!currentRepo) return;
    
    try {
      setGitStatus('Committing changes...');
      
      if (useSimpleGit || currentRepo === 'simple-git') {
        // Use simple git
        const filesToCommit: Record<string, string> = {};
        
        // First, save all dirty files to VFS
        for (const tab of tabs.filter(t => t.isDirty)) {
          try {
            const exists = await vfsSyncService.exists(tab.path);
            if (exists) {
              await vfsSyncService.updateFile(tab.path, tab.content, 'codeeditor');
            } else {
              await vfsSyncService.createFile(tab.path, tab.content, 'codeeditor');
            }
            filesToCommit[tab.path] = tab.content;
          } catch (error) {
            console.warn(`Failed to save ${tab.path} to VFS:`, error);
            // Still include in commit with current content
            filesToCommit[tab.path] = tab.content;
          }
        }
        
        if (Object.keys(filesToCommit).length === 0) {
          setGitStatus('No changes to commit');
          return;
        }
        
        // Add all files
        simpleGit.addAll(filesToCommit);
        
        // Commit
        const message = prompt('Commit message:') || 'Update files';
        const commitId = simpleGit.commit(message, {
          name: 'Weave User',
          email: 'user@weave.dev'
        });
        
        setGitStatus(`Committed ${commitId.substring(0, 7)}: ${message}`);
        
        // Mark all tabs as clean
        setTabs(prevTabs => 
          prevTabs.map(tab => ({ ...tab, isDirty: false }))
        );
      } else if (fsRef.current) {
        // Use isomorphic-git
        // Save all dirty files first
        for (const tab of tabs.filter(t => t.isDirty)) {
          await fsRef.current.promises.writeFile(tab.path || tab.name, tab.content);
        }
        
        // Add all changes
        await git.add({
          fs: fsRef.current,
          dir: currentRepo,
          filepath: '.'
        });
        
        // Commit
        const message = prompt('Commit message:') || 'Update files';
        const oid = await git.commit({
          fs: fsRef.current,
          dir: currentRepo,
          message,
          author: {
            name: 'Weave User',
            email: 'user@weave.dev'
          }
        });
        
        setGitStatus(`Committed ${oid.substring(0, 7)}: ${message}`);
        
        // Mark all tabs as clean
        setTabs(prevTabs => 
          prevTabs.map(tab => ({ ...tab, isDirty: false }))
        );
      }
    } catch (error) {
      console.error('Error committing changes:', error);
      setGitStatus('Error committing changes');
    }
  };

  const toggleVimMode = () => {
    const newVimMode = !vimMode;
    setVimMode(newVimMode);
    
    if (editorRef.current) {
      // Re-initialize editor with new vim mode
      const currentEditor = editorRef.current;
      
      if (newVimMode) {
        try {
          import('monaco-vim').then(({ initVimMode }) => {
            const statusNode = document.createElement('div');
            statusNode.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:20px;background:#1a1a2e;color:white;padding:2px 8px;font-size:12px;z-index:1000;';
            currentEditor.getDomNode()?.appendChild(statusNode);
            
            vimModeRef.current = initVimMode(currentEditor, statusNode);
          }).catch(err => {
            console.error('Error loading vim mode:', err);
          });
        } catch (error) {
          console.error('Vim mode not available:', error);
        }
      } else if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
        
        // Remove status node
        const statusNodes = currentEditor.getDomNode()?.querySelectorAll('div[style*="position:absolute;bottom:0"]');
        statusNodes?.forEach((node: any) => node.remove());
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 space-x-4">
        <button
          onClick={handleNewFile}
          className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
        >
          New
        </button>
        <button
          onClick={handleOpenFile}
          className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
        >
          Open
        </button>
        <button
          onClick={handleSaveFile}
          className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
          disabled={!activeTab?.isDirty}
        >
          Save
        </button>
        <button
          onClick={handleSaveAs}
          className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
          disabled={!activeTab}
        >
          Save As
        </button>
        <div className="h-4 w-px bg-gray-600"></div>
        <button
          onClick={toggleVimMode}
          className={`text-sm px-2 py-1 rounded ${
            vimMode 
              ? 'text-green-400 bg-green-900/30' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Vim: {vimMode ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setShowFileExplorer(!showFileExplorer)}
          className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
        >
          Explorer
        </button>
        <div className="h-4 w-px bg-gray-600"></div>
        <button
          onClick={initializeGitRepo}
          className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
          disabled={!!currentRepo}
        >
          Init Git
        </button>
        {currentRepo && (
          <button
            onClick={commitChanges}
            className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
          >
            Commit
          </button>
        )}
        {gitStatus && (
          <span className="text-xs text-green-400">{gitStatus}</span>
        )}
      </div>

      <div className="flex-1 flex">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <h3 className="text-white text-sm font-medium mb-3">Explorer</h3>
            <div className="space-y-2">
              <button
                onClick={handleNewFile}
                className="w-full text-left text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                📄 New File
              </button>
              <button
                onClick={() => openFileBrowser('open')}
                className="w-full text-left text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                📁 Open File
              </button>
              <div className="h-px bg-gray-600 my-2"></div>
            </div>
            
            {/* Git Repository Info */}
            <div className="mt-4">
              <h4 className="text-white text-xs font-medium mb-2">Git Repository</h4>
              <div className="text-gray-400 text-xs mb-2">
                {currentRepo ? `${currentRepo}` : 'No repository'}
              </div>
              {!currentRepo && (
                <button
                  onClick={initializeGitRepo}
                  className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-900/30"
                >
                  Initialize Git
                </button>
              )}
              {gitStatus && (
                <div className="text-xs text-green-400 mt-1">{gitStatus}</div>
              )}
            </div>

            {/* File Tree */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white text-xs font-medium">Files</h4>
                <button
                  onClick={loadFileTree}
                  className="text-xs text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700"
                  title="Refresh"
                >
                  ↻
                </button>
              </div>
              
              {/* VFS Files */}
              <div className="space-y-1 mb-3">
                <div className="text-xs text-gray-400 mb-1">VFS Files:</div>
                {fileTree.length > 0 ? (
                  fileTree.map((file, index) => (
                    <div
                      key={index}
                      className="text-xs px-2 py-1 rounded cursor-pointer text-gray-300 hover:bg-gray-700 flex items-center justify-between group"
                      onClick={() => {
                        if (file.isDirectory) {
                          // For directories, open them in the file browser
                          setCurrentBrowserPath(file.path);
                          loadBrowserFiles(file.path);
                          setFileBrowserMode('open');
                          setShowFileBrowser(true);
                        } else {
                          loadFileFromVFS(file.path);
                        }
                      }}
                    >
                      <span className="flex items-center">
                        {file.isDirectory ? '📁' : '📄'} {file.name}
                      </span>
                      {!file.isDirectory && (
                        <button
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white text-xs px-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadFileFromVFS(file.path);
                          }}
                          title="Open file"
                        >
                          →
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-xs px-2 py-1">
                    No files found
                    <button
                      onClick={loadFileTree}
                      className="ml-2 text-blue-400 hover:text-blue-300"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
              
              {/* Open Tabs */}
              {tabs.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 mb-1">Open Files:</div>
                  {tabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`text-xs px-2 py-1 rounded cursor-pointer ${
                        activeTabId === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      onClick={() => setActiveTabId(tab.id)}
                    >
                      📄 {tab.name}
                      {tab.isDirty && ' •'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-xs">No files open</div>
              )}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="h-8 bg-gray-800 border-b border-gray-700 flex">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`flex items-center px-3 text-sm border-r border-gray-700 cursor-pointer ${
                    activeTabId === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className={tab.isDirty ? 'text-orange-400' : ''}>
                    {tab.name}
                    {tab.isDirty && ' •'}
                  </span>
                  <button
                    className="ml-2 text-gray-500 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          <div className="flex-1">
            {activeTab ? (
              <Editor
                language={activeTab.language}
                value={activeTab.content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'all',
                  cursorStyle: vimMode ? 'block' : 'line',
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  cursorSmoothCaretAnimation: 'on',
                  folding: true,
                  foldingHighlight: true,
                  showFoldingControls: 'always',
                  unfoldOnClickAfterEndOfLine: true,
                  contextmenu: true,
                  mouseWheelZoom: true,
                  multiCursorModifier: 'ctrlCmd',
                  accessibilitySupport: 'auto',
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Welcome to Weave Code Editor</h3>
                  <p className="text-sm mb-4">Open a file or create a new one to get started</p>
                  <div className="space-x-2">
                    <button
                      onClick={handleNewFile}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      New File
                    </button>
                    <button
                      onClick={handleOpenFile}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Open File
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-blue-600 text-white text-xs flex items-center px-4 space-x-4">
        <span>
          {activeTab 
            ? `${activeTab.language.toUpperCase()} | ${activeTab.name}${activeTab.isDirty ? ' (modified)' : ''}`
            : 'Ready'
          }
        </span>
        {vimMode && <span className="text-green-200">VIM</span>}
        <span className="ml-auto">
          Weave Code Editor v1.0
        </span>
      </div>

      {/* File Browser Modal */}
      {showFileBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">
                {fileBrowserMode === 'open' ? 'Open File' : 'Save File'}
              </h3>
              <button
                onClick={() => setShowFileBrowser(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Current Path */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Current Path:</div>
              <div className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                {currentBrowserPath}
              </div>
            </div>

            {/* Navigation */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {currentBrowserPath !== '/' && (
                  <button
                    onClick={() => {
                      const parentPath = currentBrowserPath.split('/').slice(0, -1).join('/') || '/';
                      navigateToBrowserPath(parentPath);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => loadBrowserFiles(currentBrowserPath)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                  title="Refresh directory"
                >
                  ↻ Refresh
                </button>
              </div>
              <button
                onClick={createNewFolder}
                className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-gray-700"
                title="Create new folder"
              >
                📁+ New Folder
              </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto mb-4 max-h-48">
              {isLoadingBrowser ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400 text-sm">Loading files...</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {browserFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`text-sm px-2 py-1 rounded cursor-pointer text-gray-300 hover:bg-gray-700 flex items-center justify-between group ${
                        file.isDirectory ? 'hover:bg-blue-700' : 'hover:bg-gray-700'
                      }`}
                      onClick={() => handleBrowserFileSelect(file)}
                      title={file.isDirectory ? 'Click to open folder' : 'Click to select file'}
                    >
                      <span className="flex items-center">
                        {file.isDirectory ? '📁' : '📄'} {file.name}
                      </span>
                      {file.isDirectory && (
                        <span className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs">
                          →
                        </span>
                      )}
                    </div>
                  ))}
                  {browserFiles.length === 0 && !isLoadingBrowser && (
                    <div className="text-gray-500 text-sm px-2 py-1">
                      No files in this directory
                      <button
                        onClick={() => loadBrowserFiles(currentBrowserPath)}
                        className="ml-2 text-blue-400 hover:text-blue-300"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save File Input (only for save mode) */}
            {fileBrowserMode === 'save' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">File Name:</label>
                <input
                  type="text"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter file name..."
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFileBrowser(false)}
                className="px-3 py-1 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              {fileBrowserMode === 'save' && (
                <button
                  onClick={handleBrowserSave}
                  className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
                  disabled={!saveFileName.trim()}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
