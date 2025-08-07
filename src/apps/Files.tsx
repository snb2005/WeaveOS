import { useState, useEffect, useCallback } from 'react';
import { vfs } from '../filesystem/vfs';
import type { VFSNode } from '../filesystem/vfs';
import { Notification } from '../components/Notification';

// Define props interface for Files component
interface FilesProps {
  onOpenFile?: (fileName: string, filePath: string, content: string) => void;
}

// Quick access items for sidebar
const QUICK_ACCESS = [
  { name: 'Desktop', icon: '🖥️', path: '/Desktop' },
  { name: 'Documents', icon: '📄', path: '/Documents' },
  { name: 'Downloads', icon: '⬇️', path: '/Downloads' },
  { name: 'Pictures', icon: '🖼️', path: '/Pictures' },
  { name: 'Music', icon: '🎵', path: '/Music' },
  { name: 'Videos', icon: '🎬', path: '/Videos' },
];

// Get file icon based on extension
const getFileIcon = (node: VFSNode) => {
  if (node.type === 'folder') return '📁';
  
  const name = node.name.toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md')) return '📝';
  if (name.endsWith('.pdf')) return '📕';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif')) return '🖼️';
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac')) return '🎵';
  if (name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.avi')) return '🎬';
  if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return '📦';
  if (name.endsWith('.exe') || name.endsWith('.msi')) return '⚙️';
  if (name.endsWith('.tsx') || name.endsWith('.jsx') || name.endsWith('.js') || name.endsWith('.ts')) return '⚛️';
  if (name.endsWith('.css') || name.endsWith('.scss')) return '🎨';
  if (name.endsWith('.html')) return '🌐';
  if (name.endsWith('.iso')) return '💿';
  if (name.endsWith('.lnk')) return '🔗';
  if (name.endsWith('.pptx') || name.endsWith('.ppt')) return '📊';
  
  return '📄';
};

// Check if file is text-editable
const isTextEditable = (filename: string): boolean => {
  const textExtensions = ['.txt', '.md', '.js', '.ts', '.tsx', '.jsx', '.css', '.scss', '.html', '.json', '.xml', '.csv'];
  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Format file size
const formatFileSize = (size: number): string => {
  if (size === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Files: React.FC<FilesProps> = ({ onOpenFile }) => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [currentDirectory, setCurrentDirectory] = useState<VFSNode | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: VFSNode | null } | null>(null);
  const [showNewItemDialog, setShowNewItemDialog] = useState<'folder' | 'file' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedItem, setCopiedItem] = useState<{ item: VFSNode; path: string; operation: 'copy' | 'cut' } | null>(null);

  // Show notification with auto-dismiss
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Refresh the file list from VFS
  const refreshDirectory = useCallback(() => {
    try {
      const node = vfs.getNode(currentPath);
      setCurrentDirectory(node || null);
    } catch (error) {
      console.error('Error refreshing directory:', error);
      setCurrentDirectory(null);
    }
  }, [currentPath]);

  // Update current directory when path changes or VFS changes
  useEffect(() => {
    refreshDirectory();
  }, [currentPath, refreshDirectory]);

  // Set up interval to check for VFS changes (for terminal sync)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDirectory();
    }, 1000); // Check every second for changes
    
    return () => clearInterval(interval);
  }, [refreshDirectory]);

  const handleItemClick = (node: VFSNode) => {
    if (node.type === 'folder') {
      const newPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
      setCurrentPath(newPath);
      setSelectedItem(null);
    } else {
      setSelectedItem(node.name);
      
      // Check if file is text-editable and try to open it
      if (isTextEditable(node.name) && onOpenFile) {
        try {
          const filePath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
          const content = vfs.getFileContent(filePath);
          onOpenFile(node.name, filePath, content);
        } catch (error) {
          console.error('Error reading file:', error);
          showNotification('Error opening file', 'error');
        }
      }
    }
  };

  const handleBackClick = () => {
    if (currentPath !== '/') {
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
      setCurrentPath(parentPath);
      setSelectedItem(null);
    }
  };

  const handleQuickAccessClick = (path: string) => {
    setCurrentPath(path);
    setSelectedItem(null);
  };

  const handleBreadcrumbClick = (targetPath: string) => {
    setCurrentPath(targetPath);
    setSelectedItem(null);
  };

  const handleContextMenu = (e: React.MouseEvent, node: VFSNode | null) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item: node });
  };

  const handleCreateNew = (type: 'folder' | 'file') => {
    setShowNewItemDialog(type);
    setNewItemName('');
    setContextMenu(null);
  };

  const handleConfirmNewItem = () => {
    if (!newItemName.trim()) return;
    
    try {
      const itemPath = currentPath === '/' ? `/${newItemName}` : `${currentPath}/${newItemName}`;
      
      if (showNewItemDialog === 'folder') {
        vfs.createFolder(itemPath);
        showNotification(`Folder "${newItemName}" created successfully`, 'success');
      } else {
        vfs.createFile(itemPath, '');
        showNotification(`File "${newItemName}" created successfully`, 'success');
      }
      
      refreshDirectory();
      setShowNewItemDialog(null);
      setNewItemName('');
    } catch (error) {
      console.error('Error creating item:', error);
      showNotification('Error creating item: ' + (error as Error).message, 'error');
    }
  };

  const handleDeleteItem = (node: VFSNode) => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      try {
        const itemPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
        vfs.deleteNode(itemPath);
        showNotification(`"${node.name}" deleted successfully`, 'success');
        refreshDirectory();
        setContextMenu(null);
      } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Error deleting item: ' + (error as Error).message, 'error');
      }
    }
  };

  const handleRenameItem = (node: VFSNode) => {
    const newName = prompt('Enter new name:', node.name);
    if (newName && newName !== node.name) {
      try {
        const oldPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
        const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
        vfs.moveNode(oldPath, newPath);
        showNotification(`"${node.name}" renamed to "${newName}"`, 'success');
        refreshDirectory();
        setContextMenu(null);
      } catch (error) {
        console.error('Error renaming item:', error);
        showNotification('Error renaming item: ' + (error as Error).message, 'error');
      }
    }
  };

  const handleCopyItem = (node: VFSNode) => {
    const itemPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
    setCopiedItem({ item: node, path: itemPath, operation: 'copy' });
    showNotification(`"${node.name}" copied`, 'info');
    setContextMenu(null);
  };

  const handleCutItem = (node: VFSNode) => {
    const itemPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
    setCopiedItem({ item: node, path: itemPath, operation: 'cut' });
    showNotification(`"${node.name}" cut`, 'info');
    setContextMenu(null);
  };

  const handlePasteItem = () => {
    if (!copiedItem) return;
    
    try {
      const newPath = currentPath === '/' ? `/${copiedItem.item.name}` : `${currentPath}/${copiedItem.item.name}`;
      
      if (copiedItem.operation === 'copy') {
        // For copy, we need to duplicate the content
        if (copiedItem.item.type === 'file') {
          const content = vfs.getFileContent(copiedItem.path);
          vfs.createFile(newPath, content);
        } else {
          // For folders, we'll create a new folder (simple implementation)
          vfs.createFolder(newPath);
        }
        showNotification(`"${copiedItem.item.name}" copied successfully`, 'success');
      } else {
        // For cut, we move the item
        vfs.moveNode(copiedItem.path, newPath);
        showNotification(`"${copiedItem.item.name}" moved successfully`, 'success');
        setCopiedItem(null); // Clear after cut operation
      }
      
      refreshDirectory();
      setContextMenu(null);
    } catch (error) {
      console.error('Error pasting item:', error);
      showNotification('Error pasting item: ' + (error as Error).message, 'error');
    }
  };

  const handleOpenWith = (node: VFSNode) => {
    if (node.type === 'file' && isTextEditable(node.name) && onOpenFile) {
      try {
        const filePath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
        const content = vfs.getFileContent(filePath);
        onOpenFile(node.name, filePath, content);
        setContextMenu(null);
      } catch (error) {
        console.error('Error opening file:', error);
        showNotification('Error opening file', 'error');
      }
    }
  };

  const getItemProperties = (node: VFSNode) => {
    const itemPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
    const size = node.type === 'file' ? formatFileSize(node.content?.length || 0) : 'Folder';
    const created = new Date(node.created).toLocaleString();
    const modified = new Date(node.modified).toLocaleString();
    
    alert(`Properties of "${node.name}"\n\nType: ${node.type === 'folder' ? 'Folder' : 'File'}\nSize: ${size}\nPath: ${itemPath}\nCreated: ${created}\nModified: ${modified}`);
    setContextMenu(null);
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const formatPath = () => {
    if (currentPath === '/') return 'Home';
    return currentPath.replace(/^\//, '').replace(/\//g, ' / ');
  };

  const getBreadcrumbs = () => {
    if (currentPath === '/') return [];
    const parts = currentPath.split('/').filter(Boolean);
    return parts.map((part, index) => ({
      name: part,
      path: '/' + parts.slice(0, index + 1).join('/')
    }));
  };

  const items = currentDirectory?.type === 'folder' && currentDirectory.children ? currentDirectory.children : [];
  const folders = items.filter(item => item.type === 'folder') as VFSNode[];
  const files = items.filter(item => item.type === 'file') as VFSNode[];
  const sortedItems = [...folders.sort((a, b) => a.name.localeCompare(b.name)), ...files.sort((a, b) => a.name.localeCompare(b.name))];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;

      const selectedNode = sortedItems.find(item => item.name === selectedItem);
      if (!selectedNode) return;

      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        handleCopyItem(selectedNode);
      }
      // Ctrl+X - Cut
      else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        handleCutItem(selectedNode);
      }
      // Ctrl+V - Paste
      else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (copiedItem) {
          handlePasteItem();
        }
      }
      // Delete key - Delete
      else if (e.key === 'Delete') {
        e.preventDefault();
        handleDeleteItem(selectedNode);
      }
      // F2 - Rename
      else if (e.key === 'F2') {
        e.preventDefault();
        handleRenameItem(selectedNode);
      }
      // Enter - Open file/folder
      else if (e.key === 'Enter') {
        e.preventDefault();
        handleItemClick(selectedNode);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, sortedItems, copiedItem]);

  return (
    <div className="h-full bg-white flex">
      {/* Sidebar */}
      <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Quick Access</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {QUICK_ACCESS.map((item) => (
            <button
              key={item.name}
              onClick={() => handleQuickAccessClick(item.path)}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                currentPath === item.path
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBackClick}
              disabled={currentPath === '/'}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go back"
            >
              <span className="text-lg">←</span>
            </button>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-1 text-sm">
              <button
                onClick={() => setCurrentPath('/')}
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
              >
                🏠 Home
              </button>
              {getBreadcrumbs().map((crumb, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.path)}
                    className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* New Item Buttons */}
            <button
              onClick={() => handleCreateNew('folder')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="New Folder"
            >
              📁 New Folder
            </button>
            <button
              onClick={() => handleCreateNew('file')}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="New File"
            >
              📝 New File
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 ml-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                title="Grid view"
              >
                <span className="text-sm">⊞</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                title="List view"
              >
                <span className="text-sm">☰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4" onContextMenu={(e) => handleContextMenu(e, null)}>
          {sortedItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-16">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg">This folder is empty</p>
              <p className="text-sm mt-2">Right-click to create new files or folders</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {sortedItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`p-3 rounded-lg border border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all text-center group ${
                    selectedItem === item.name ? 'border-blue-500 bg-blue-100' : ''
                  } ${
                    copiedItem?.item.name === item.name && copiedItem?.operation === 'cut' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="text-3xl mb-2">{getFileIcon(item)}</div>
                  <div className="text-xs text-gray-700 break-words leading-tight">
                    {item.name}
                  </div>
                  {item.type === 'file' && item.content && (
                    <div className="text-xs text-gray-500 mt-1">{formatFileSize(item.content.length)}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {sortedItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-100 text-left transition-colors ${
                    selectedItem === item.name ? 'bg-blue-100' : ''
                  } ${
                    copiedItem?.item.name === item.name && copiedItem?.operation === 'cut' ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-xl">{getFileIcon(item)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.type === 'folder' 
                        ? 'Folder' 
                        : `File • ${item.content ? formatFileSize(item.content.length) : 'Empty'}`
                      }
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.modified).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-600">
          <span>
            {sortedItems.length} items ({folders.length} folders, {files.length} files)
          </span>
          <span className="flex items-center space-x-4">
            <span>{formatPath()}</span>
            {selectedItem && (
              <span className="text-gray-500">
                F2:Rename | Del:Delete | Ctrl+C:Copy | Ctrl+X:Cut | Ctrl+V:Paste
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.item ? (
            <>
              {/* Open/Open With */}
              {contextMenu.item.type === 'file' && isTextEditable(contextMenu.item.name) && (
                <>
                  <button
                    onClick={() => handleOpenWith(contextMenu.item!)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors font-medium"
                  >
                    📖 Open
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                </>
              )}
              
              {/* Cut, Copy, Paste */}
              <button
                onClick={() => handleCutItem(contextMenu.item!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                ✂️ Cut
              </button>
              <button
                onClick={() => handleCopyItem(contextMenu.item!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                📋 Copy
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              {/* Rename */}
              <button
                onClick={() => handleRenameItem(contextMenu.item!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                ✏️ Rename
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              {/* Delete */}
              <button
                onClick={() => handleDeleteItem(contextMenu.item!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 transition-colors"
              >
                🗑️ Delete
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              {/* Properties */}
              <button
                onClick={() => getItemProperties(contextMenu.item!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                ℹ️ Properties
              </button>
            </>
          ) : (
            <>
              {/* Paste (if something is copied/cut) */}
              {copiedItem && (
                <>
                  <button
                    onClick={handlePasteItem}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    📄 Paste
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                </>
              )}
              
              {/* New items */}
              <button
                onClick={() => handleCreateNew('folder')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                📁 New Folder
              </button>
              <button
                onClick={() => handleCreateNew('file')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                📝 New File
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              {/* View options */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                {viewMode === 'grid' ? '☰ List View' : '⊞ Grid View'}
              </button>
              
              {/* Refresh */}
              <button
                onClick={() => {
                  refreshDirectory();
                  setContextMenu(null);
                  showNotification('Folder refreshed', 'info');
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                🔄 Refresh
              </button>
            </>
          )}
        </div>
      )}

      {/* New Item Dialog */}
      {showNewItemDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Create New {showNewItemDialog === 'folder' ? 'Folder' : 'File'}
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Enter ${showNewItemDialog} name...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleConfirmNewItem()}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowNewItemDialog(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNewItem}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Files;
