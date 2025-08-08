import { useState, useEffect, useCallback } from 'react';
import { vfsSyncService } from '../filesystem/vfsSyncService';
import type { VFSNode } from '../filesystem/vfs';
import { useWindowStore } from '../store/windowStore';
import { useTheme, getThemeClasses } from '../hooks/useTheme';

// Define props interface for Files component
interface FilesProps {
  onOpenFile?: (fileName: string, filePath: string, content: string) => void;
  windowId?: string;
}

// View mode options
type ViewMode = 'grid' | 'list' | 'details';

// Sort options
type SortBy = 'name' | 'size' | 'type' | 'modified';
type SortOrder = 'asc' | 'desc';

// File type categories for better organization
const FILE_CATEGORIES = {
  document: ['txt', 'md', 'pdf', 'doc', 'docx', 'rtf'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
  video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  code: ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php'],
  executable: ['exe', 'msi', 'app', 'deb', 'rpm'],
  other: []
};

// Enhanced quick access items with better organization
const QUICK_ACCESS = [
  { name: 'Desktop', icon: '🖥️', path: '/Desktop', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Documents', icon: '📄', path: '/Documents', color: 'bg-green-500/20 text-green-400' },
  { name: 'Downloads', icon: '⬇️', path: '/Downloads', color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Pictures', icon: '🖼️', path: '/Pictures', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Music', icon: '🎵', path: '/Music', color: 'bg-pink-500/20 text-pink-400' },
  { name: 'Videos', icon: '🎬', path: '/Videos', color: 'bg-red-500/20 text-red-400' },
];

// Get file category
const getFileCategory = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if ((extensions as string[]).includes(ext)) return category;
  }
  return 'other';
};

// Enhanced file icon function with better categorization
const getFileIcon = (node: VFSNode) => {
  if (node.type === 'folder') return '📁';
  
  const category = getFileCategory(node.name);
  
  switch (category) {
    case 'document':
      return '📝';
    case 'image':
      return '🖼️';
    case 'video':
      return '🎬';
    case 'audio':
      return '🎵';
    case 'archive':
      return '📦';
    case 'code':
      return '⚛️';
    case 'executable':
      return '⚙️';
    default:
      return '📄';
  }
};

// Get file category color
const getFileColor = (node: VFSNode): string => {
  if (node.type === 'folder') return 'text-blue-400';
  
  const category = getFileCategory(node.name);
  
  switch (category) {
    case 'document':
      return 'text-green-400';
    case 'image':
      return 'text-purple-400';
    case 'video':
      return 'text-red-400';
    case 'audio':
      return 'text-pink-400';
    case 'archive':
      return 'text-orange-400';
    case 'code':
      return 'text-cyan-400';
    case 'executable':
      return 'text-yellow-400';
    default:
      return 'text-white';
  }
};

// Check if file is text-editable
const isTextEditable = (filename: string): boolean => {
  const textExtensions = ['.txt', '.md', '.js', '.ts', '.tsx', '.jsx', '.css', '.scss', '.html', '.json', '.xml', '.csv'];
  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Format file size with better units
const formatFileSize = (size: number): string => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let sizeInUnits = size;
  
  while (sizeInUnits >= 1024 && index < units.length - 1) {
    sizeInUnits /= 1024;
    index++;
  }
  
  return `${sizeInUnits.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

// Format date
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const FilesEnhanced = ({ onOpenFile, windowId }: FilesProps) => {
  const { updateWindowState, windows } = useWindowStore();
  const { isLight } = useTheme();
  const theme = getThemeClasses(isLight);
  
  // Find current window state
  const currentWindow = windows.find(w => w.id === windowId);
  const filesState = currentWindow?.savedState?.customData?.files as any;
  
  const [currentPath, setCurrentPath] = useState<string>(filesState?.currentPath || '/');
  const [currentItems, setCurrentItems] = useState<VFSNode[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(filesState?.selectedItems || []));
  const [viewMode, setViewMode] = useState<ViewMode>(filesState?.viewMode || 'grid');
  const [sortBy, setSortBy] = useState<SortBy>(filesState?.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<SortOrder>(filesState?.sortOrder || 'asc');
  const [searchQuery, setSearchQuery] = useState(filesState?.searchQuery || '');
  const [showHidden, setShowHidden] = useState(filesState?.showHidden || false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: VFSNode } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>(filesState?.pathHistory || ['/']);
  const [historyIndex, setHistoryIndex] = useState(filesState?.historyIndex || 0);

  // Save state to window store whenever important state changes
  useEffect(() => {
    if (windowId) {
      updateWindowState(windowId, {
        customData: {
          files: {
            currentPath,
            selectedItems: Array.from(selectedItems),
            viewMode,
            sortBy,
            sortOrder,
            searchQuery,
            showHidden,
            pathHistory,
            historyIndex,
          }
        }
      });
    }
  }, [windowId, currentPath, selectedItems, viewMode, sortBy, sortOrder, searchQuery, showHidden, pathHistory, historyIndex, updateWindowState]);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      const items = vfsSyncService.listDir(path);
      
      // Filter hidden files if not showing them
      let filteredItems = showHidden ? items : items.filter(item => !item.name.startsWith('.'));
      
      // Apply search filter
      if (searchQuery) {
        filteredItems = filteredItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Sort items
      filteredItems.sort((a, b) => {
        // Always show folders first
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = (a.size || 0) - (b.size || 0);
            break;
          case 'type':
            const aExt = a.name.split('.').pop() || '';
            const bExt = b.name.split('.').pop() || '';
            comparison = aExt.localeCompare(bExt);
            break;
          case 'modified':
            const aDate = a.lastModified || new Date(0);
            const bDate = b.lastModified || new Date(0);
            comparison = aDate.getTime() - bDate.getTime();
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      setCurrentItems(filteredItems);
      setSelectedItems(new Set());
    } catch (error) {
      showNotification('Failed to load directory', 'error');
      setCurrentItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [showHidden, searchQuery, sortBy, sortOrder]);

  // Navigate to path
  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path);
    
    // Update history
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(path);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    loadDirectory(path);
  }, [loadDirectory, pathHistory, historyIndex]);

  // Navigate back
  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const path = pathHistory[newIndex];
      setCurrentPath(path);
      loadDirectory(path);
    }
  };

  // Navigate forward
  const navigateForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const path = pathHistory[newIndex];
      setCurrentPath(path);
      loadDirectory(path);
    }
  };

  // Navigate up
  const navigateUp = () => {
    const parentPath = currentPath === '/' ? '/' : currentPath.split('/').slice(0, -1).join('/') || '/';
    if (parentPath !== currentPath) {
      navigateToPath(parentPath);
    }
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle item double click
  const handleItemDoubleClick = (item: VFSNode) => {
    if (item.type === 'folder') {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      navigateToPath(newPath);
    } else if (isTextEditable(item.name) && onOpenFile) {
      try {
        const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
        const content = vfsSyncService.getFileContent(filePath);
        onOpenFile(item.name, filePath, content);
        showNotification(`Opened ${item.name}`, 'success');
      } catch (error) {
        showNotification(`Failed to open ${item.name}`, 'error');
      }
    }
  };

  // Handle item selection
  const handleItemClick = (item: VFSNode, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.name)) {
        newSelected.delete(item.name);
      } else {
        newSelected.add(item.name);
      }
      setSelectedItems(newSelected);
    } else {
      // Single select
      setSelectedItems(new Set([item.name]));
    }
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent, item?: VFSNode) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item
    });
  };

  // Create new folder
  const createNewFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        const folderPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        vfsSyncService.createFolder(folderPath);
        showNotification(`Created folder: ${name}`, 'success');
        loadDirectory(currentPath);
      } catch (error) {
        showNotification(`Failed to create folder: ${name}`, 'error');
      }
    }
    setContextMenu(null);
  };

  // Create new file
  const createNewFile = async () => {
    const name = prompt('Enter file name:');
    if (name) {
      try {
        const filePath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        vfsSyncService.createFile(filePath, '');
        showNotification(`Created file: ${name}`, 'success');
        loadDirectory(currentPath);
      } catch (error) {
        showNotification(`Failed to create file: ${name}`, 'error');
      }
    }
    setContextMenu(null);
  };

  // Delete selected items
  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;
    
    const itemNames = Array.from(selectedItems);
    const confirmMessage = `Are you sure you want to delete ${itemNames.length} item(s)?`;
    
    if (confirm(confirmMessage)) {
      let successCount = 0;
      for (const itemName of itemNames) {
        try {
          const itemPath = currentPath === '/' ? `/${itemName}` : `${currentPath}/${itemName}`;
          vfsSyncService.deleteNode(itemPath);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete ${itemName}:`, error);
        }
      }
      
      showNotification(`Deleted ${successCount} item(s)`, 'success');
      setSelectedItems(new Set());
      loadDirectory(currentPath);
    }
    setContextMenu(null);
  };

  // Get breadcrumb path
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Root', path: '/' }];
    
    let currentBreadcrumbPath = '';
    for (const part of parts) {
      currentBreadcrumbPath += `/${part}`;
      breadcrumbs.push({ name: part, path: currentBreadcrumbPath });
    }
    
    return breadcrumbs;
  };

  // Load initial directory
  useEffect(() => {
    loadDirectory(currentPath);
  }, [loadDirectory]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`w-full h-full ${theme.bgPrimary} rounded-xl border ${theme.border} flex flex-col overflow-hidden`}>
      {/* Header/Toolbar */}
      <div className={`${theme.bgSecondary} border-b ${theme.border} p-4`}>
        {/* Navigation Controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navigateBack}
              disabled={historyIndex === 0}
              className={`p-2 rounded-lg ${theme.button} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title="Back"
            >
              <span className={theme.textPrimary}>←</span>
            </button>
            <button
              onClick={navigateForward}
              disabled={historyIndex >= pathHistory.length - 1}
              className={`p-2 rounded-lg ${theme.button} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title="Forward"
            >
              <span className={theme.textPrimary}>→</span>
            </button>
            <button
              onClick={navigateUp}
              disabled={currentPath === '/'}
              className={`p-2 rounded-lg ${theme.button} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title="Up"
            >
              <span className={theme.textPrimary}>↑</span>
            </button>
            <button
              onClick={() => loadDirectory(currentPath)}
              className={`p-2 rounded-lg ${theme.button} transition-colors`}
              title="Refresh"
            >
              <span className={theme.textPrimary}>⟳</span>
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 ${theme.input} ${theme.inputFocus} rounded-lg focus:outline-none transition-colors`}
            />
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${theme.bgTertiary} rounded-lg p-1`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-theme-accent text-white' : 'text-theme-text-secondary hover:text-theme-text-primary'
                }`}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-theme-accent text-white' : 'text-theme-text-secondary hover:text-theme-text-primary'
                }`}
                title="List View"
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode('details')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'details' ? 'bg-theme-accent text-white' : 'text-theme-text-secondary hover:text-theme-text-primary'
                }`}
                title="Details View"
              >
                ≡
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          {getBreadcrumbs().map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span className="text-white/50">/</span>}
              <button
                onClick={() => navigateToPath(crumb.path)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-64 ${theme.bgSecondary} border-r ${theme.border} flex flex-col`}>
          <div className="p-4">
            <h3 className={`${theme.textPrimary} font-semibold mb-3`}>Quick Access</h3>
            <div className="space-y-1">
              {QUICK_ACCESS.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigateToPath(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    currentPath === item.path
                      ? `${item.color} border border-current`
                      : `${theme.textSecondary} ${theme.bgHover} hover:${theme.textPrimary}`
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Operations */}
          <div className="p-4 border-t border-theme-border mt-auto">
            <div className="space-y-2">
              <button
                onClick={createNewFolder}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-all"
              >
                <span>📁</span>
                <span className="text-sm">New Folder</span>
              </button>
              <button
                onClick={createNewFile}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-all"
              >
                <span>📄</span>
                <span className="text-sm">New File</span>
              </button>
              {selectedItems.size > 0 && (
                <button
                  onClick={deleteSelectedItems}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <span>🗑️</span>
                  <span className="text-sm">Delete ({selectedItems.size})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Sort Controls */}
          <div className="bg-theme-bg-secondary border-b border-theme-border px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-theme-text-muted text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-theme-bg-tertiary border border-theme-border rounded px-2 py-1 text-theme-text-primary text-sm focus:outline-none focus:border-theme-accent"
              >
                <option value="name" className="bg-theme-bg-tertiary">Name</option>
                <option value="size" className="bg-theme-bg-tertiary">Size</option>
                <option value="type" className="bg-theme-bg-tertiary">Type</option>
                <option value="modified" className="bg-theme-bg-tertiary">Modified</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            <label className="flex items-center gap-2 text-theme-text-muted text-sm">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="w-4 h-4 rounded border-theme-border bg-theme-bg-tertiary text-theme-accent"
              />
              Show hidden files
            </label>

            <div className="ml-auto text-gray-400 text-sm">
              {currentItems.length} items
            </div>
          </div>

          {/* File Content */}
          <div className="flex-1 p-4 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-white/70">Loading...</div>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-white/70">
                  {searchQuery ? 'No files match your search' : 'This folder is empty'}
                </div>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4'
                    : viewMode === 'list'
                    ? 'space-y-1'
                    : 'space-y-1'
                }
                onContextMenu={(e) => handleContextMenu(e)}
              >
                {currentItems.map(item => (
                  <div
                    key={item.name}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    className={`
                      cursor-pointer transition-all rounded-lg
                      ${selectedItems.has(item.name)
                        ? 'bg-blue-500/20 border border-blue-400/50'
                        : 'hover:bg-white/5 border border-transparent'
                      }
                      ${viewMode === 'grid'
                        ? 'p-3 text-center'
                        : 'p-2 flex items-center gap-3'
                      }
                    `}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="text-3xl mb-2">{getFileIcon(item)}</div>
                        <div className={`text-sm font-medium truncate ${getFileColor(item)}`}>
                          {item.name}
                        </div>
                        {item.type === 'file' && item.size && (
                          <div className="text-xs text-white/50 mt-1">
                            {formatFileSize(item.size)}
                          </div>
                        )}
                      </>
                    ) : viewMode === 'list' ? (
                      <>
                        <div className="text-xl">{getFileIcon(item)}</div>
                        <div className={`flex-1 font-medium truncate ${getFileColor(item)}`}>
                          {item.name}
                        </div>
                        {item.type === 'file' && item.size && (
                          <div className="text-sm text-white/50">
                            {formatFileSize(item.size)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-xl">{getFileIcon(item)}</div>
                        <div className={`flex-1 font-medium truncate ${getFileColor(item)}`}>
                          {item.name}
                        </div>
                        <div className="text-sm text-white/50 w-20 text-right">
                          {item.type === 'file' ? formatFileSize(item.size || 0) : 'Folder'}
                        </div>
                        <div className="text-sm text-white/50 w-32 text-right">
                          {getFileCategory(item.name)}
                        </div>
                        <div className="text-sm text-white/50 w-40 text-right">
                          {item.modified ? formatDate(item.modified) : '-'}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-theme-glass-bg backdrop-blur-sm border border-theme-glass-border rounded-lg py-2 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.item ? (
            <>
              <button
                onClick={() => {
                  if (contextMenu.item?.type === 'folder') {
                    const newPath = currentPath === '/' ? `/${contextMenu.item.name}` : `${currentPath}/${contextMenu.item.name}`;
                    navigateToPath(newPath);
                  } else if (contextMenu.item && isTextEditable(contextMenu.item.name) && onOpenFile) {
                    const filePath = currentPath === '/' ? `/${contextMenu.item.name}` : `${currentPath}/${contextMenu.item.name}`;
                    try {
                      const content = vfsSyncService.getFileContent(filePath);
                      onOpenFile(contextMenu.item.name, filePath, content);
                    } catch (error) {
                      showNotification(`Failed to open ${contextMenu.item.name}`, 'error');
                    }
                  }
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
              >
                {contextMenu.item.type === 'folder' ? '📂 Open' : '📝 Open'}
              </button>
              <button
                onClick={() => {
                  if (contextMenu.item) {
                    setSelectedItems(new Set([contextMenu.item.name]));
                    deleteSelectedItems();
                  }
                }}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-zinc-700/50 transition-colors"
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={createNewFolder}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
              >
                📁 New Folder
              </button>
              <button
                onClick={createNewFile}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
              >
                📄 New File
              </button>
            </>
          )}
        </div>
      )}

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

export default FilesEnhanced;
