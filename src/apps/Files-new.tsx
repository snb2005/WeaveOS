import { useState, useEffect } from 'react';

// File system types
interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
  extension?: string;
  children?: FileItem[];
}

// Virtual file system data
const VIRTUAL_FILE_SYSTEM: FileItem = {
  name: 'root',
  type: 'folder',
  children: [
    {
      name: 'Desktop',
      type: 'folder',
      children: [
        { name: 'Shortcut to Terminal.lnk', type: 'file', extension: 'lnk', size: '1 KB' },
        { name: 'Welcome.txt', type: 'file', extension: 'txt', size: '2 KB' },
        { name: 'screenshot.png', type: 'file', extension: 'png', size: '145 KB' },
      ]
    },
    {
      name: 'Documents',
      type: 'folder',
      children: [
        { name: 'resume.pdf', type: 'file', extension: 'pdf', size: '234 KB' },
        { name: 'notes.txt', type: 'file', extension: 'txt', size: '15 KB' },
        { name: 'presentation.pptx', type: 'file', extension: 'pptx', size: '2.1 MB' },
        {
          name: 'Projects',
          type: 'folder',
          children: [
            { name: 'weave-os.zip', type: 'file', extension: 'zip', size: '5.2 MB' },
            { name: 'README.md', type: 'file', extension: 'md', size: '8 KB' },
            {
              name: 'src',
              type: 'folder',
              children: [
                { name: 'main.tsx', type: 'file', extension: 'tsx', size: '3 KB' },
                { name: 'App.tsx', type: 'file', extension: 'tsx', size: '12 KB' },
                { name: 'index.css', type: 'file', extension: 'css', size: '2 KB' },
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Downloads',
      type: 'folder',
      children: [
        { name: 'ubuntu-22.04.iso', type: 'file', extension: 'iso', size: '3.6 GB' },
        { name: 'installer.exe', type: 'file', extension: 'exe', size: '45 MB' },
        { name: 'music-pack.zip', type: 'file', extension: 'zip', size: '128 MB' },
      ]
    },
    {
      name: 'Pictures',
      type: 'folder',
      children: [
        { name: 'vacation.jpg', type: 'file', extension: 'jpg', size: '2.3 MB' },
        { name: 'profile.png', type: 'file', extension: 'png', size: '456 KB' },
        { name: 'wallpaper.jpg', type: 'file', extension: 'jpg', size: '1.8 MB' },
        {
          name: 'Screenshots',
          type: 'folder',
          children: [
            { name: 'screenshot1.png', type: 'file', extension: 'png', size: '234 KB' },
            { name: 'screenshot2.png', type: 'file', extension: 'png', size: '189 KB' },
          ]
        }
      ]
    },
    {
      name: 'Music',
      type: 'folder',
      children: [
        { name: 'song1.mp3', type: 'file', extension: 'mp3', size: '4.2 MB' },
        { name: 'song2.mp3', type: 'file', extension: 'mp3', size: '3.8 MB' },
        { name: 'playlist.m3u', type: 'file', extension: 'm3u', size: '1 KB' },
      ]
    },
    {
      name: 'Videos',
      type: 'folder',
      children: [
        { name: 'demo.mp4', type: 'file', extension: 'mp4', size: '45 MB' },
        { name: 'tutorial.mkv', type: 'file', extension: 'mkv', size: '234 MB' },
      ]
    }
  ]
};

// Quick access items for sidebar
const QUICK_ACCESS = [
  { name: 'Desktop', icon: '🖥️', path: ['Desktop'] },
  { name: 'Documents', icon: '📄', path: ['Documents'] },
  { name: 'Downloads', icon: '⬇️', path: ['Downloads'] },
  { name: 'Pictures', icon: '🖼️', path: ['Pictures'] },
  { name: 'Music', icon: '🎵', path: ['Music'] },
  { name: 'Videos', icon: '🎬', path: ['Videos'] },
];

// Get file icon based on extension
const getFileIcon = (item: FileItem) => {
  if (item.type === 'folder') return '📁';
  
  switch (item.extension?.toLowerCase()) {
    case 'txt':
    case 'md':
      return '📝';
    case 'pdf':
      return '📕';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️';
    case 'mp3':
    case 'wav':
    case 'flac':
      return '🎵';
    case 'mp4':
    case 'mkv':
    case 'avi':
      return '🎬';
    case 'zip':
    case 'rar':
    case '7z':
      return '📦';
    case 'exe':
    case 'msi':
      return '⚙️';
    case 'tsx':
    case 'jsx':
    case 'js':
    case 'ts':
      return '⚛️';
    case 'css':
    case 'scss':
      return '🎨';
    case 'html':
      return '🌐';
    case 'iso':
      return '💿';
    case 'lnk':
      return '🔗';
    case 'pptx':
    case 'ppt':
      return '📊';
    default:
      return '📄';
  }
};

// Navigate to a path in the file system
const navigateToPath = (root: FileItem, pathArray: string[]): FileItem | null => {
  let current = root;
  
  for (const segment of pathArray) {
    if (!current.children) return null;
    const found = current.children.find(child => child.name === segment);
    if (!found || found.type !== 'folder') return null;
    current = found;
  }
  
  return current;
};

const Files = () => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<FileItem>(VIRTUAL_FILE_SYSTEM);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Update current directory when path changes
  useEffect(() => {
    const newDirectory = navigateToPath(VIRTUAL_FILE_SYSTEM, currentPath);
    if (newDirectory) {
      setCurrentDirectory(newDirectory);
    }
  }, [currentPath]);

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentPath(prev => [...prev, item.name]);
      setSelectedItem(null);
    } else {
      setSelectedItem(item.name);
      // Could open file preview or trigger download
      console.log(`Opening file: ${item.name}`);
    }
  };

  const handleBackClick = () => {
    if (currentPath.length > 0) {
      setCurrentPath(prev => prev.slice(0, -1));
      setSelectedItem(null);
    }
  };

  const handleQuickAccessClick = (path: string[]) => {
    setCurrentPath(path);
    setSelectedItem(null);
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(prev => prev.slice(0, index + 1));
    setSelectedItem(null);
  };

  const formatPath = () => {
    return currentPath.length === 0 ? 'Home' : currentPath.join(' / ');
  };

  const items = currentDirectory.children || [];
  const folders = items.filter(item => item.type === 'folder');
  const files = items.filter(item => item.type === 'file');
  const sortedItems = [...folders, ...files];

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
                JSON.stringify(currentPath) === JSON.stringify(item.path)
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
              disabled={currentPath.length === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go back"
            >
              <span className="text-lg">←</span>
            </button>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-1 text-sm">
              <button
                onClick={() => setCurrentPath([])}
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
              >
                🏠 Home
              </button>
              {currentPath.map((segment, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
                  >
                    {segment}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1">
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-16">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg">This folder is empty</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {sortedItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 rounded-lg border border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all text-center group ${
                    selectedItem === item.name ? 'border-blue-500 bg-blue-100' : ''
                  }`}
                >
                  <div className="text-3xl mb-2">{getFileIcon(item)}</div>
                  <div className="text-xs text-gray-700 break-words leading-tight">
                    {item.name}
                  </div>
                  {item.size && (
                    <div className="text-xs text-gray-500 mt-1">{item.size}</div>
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
                  className={`w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-100 text-left transition-colors ${
                    selectedItem === item.name ? 'bg-blue-100' : ''
                  }`}
                >
                  <span className="text-xl">{getFileIcon(item)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.type === 'folder' ? 'Folder' : `${item.extension?.toUpperCase() || 'File'} • ${item.size || 'Unknown size'}`}
                    </div>
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
          <span>{formatPath()}</span>
        </div>
      </div>
    </div>
  );
};

export default Files;
