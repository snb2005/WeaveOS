import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Home,
  RefreshCw,
  FolderPlus,
  ArrowLeft
} from 'lucide-react';
import useAuthStore from '../stores/authStore.js';
import apiClient from '../services/apiClient.js';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  isDirectory: boolean;
  owner: any;
  createdAt: string;
  updatedAt: string;
}

const FileManager = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load files when component mounts or path changes
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!currentPath) {
        setCurrentPath(`/users/${user.username}`);
      } else {
        loadFiles();
      }
    }
  }, [isAuthenticated, user, currentPath]);

  const loadFiles = async () => {
    if (!currentPath) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('path', currentPath);
      
      const response = await fetch(`http://localhost:3001/api/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiClient.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      const response = await fetch('http://localhost:3001/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.token}`
        },
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      // Reload files after successful upload
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Error uploading file:', err);
    } finally {
      setIsLoading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/files/folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          path: currentPath
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.status}`);
      }

      setNewFolderName('');
      setShowCreateFolder(false);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      console.error('Error creating folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (filePath: string) => {
    setCurrentPath(filePath);
  };

  const handleGoUp = () => {
    if (!currentPath || currentPath === `/users/${user?.username}`) return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 2) { // users/username/...
      const parentPath = '/' + pathParts.slice(0, -1).join('/');
      setCurrentPath(parentPath);
    } else {
      setCurrentPath(`/users/${user?.username}`);
    }
  };

  const handleGoHome = () => {
    if (user) {
      setCurrentPath(`/users/${user.username}`);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p>Please sign in to access your files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">File Manager</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGoHome}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Go to Home"
            >
              <Home className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleGoUp}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              disabled={!currentPath || currentPath === `/users/${user?.username}`}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={loadFiles}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
          
          <label className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      {/* Path breadcrumb */}
      <div className="px-4 py-2 border-b border-white/10">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Home className="w-4 h-4" />
          <span>/</span>
          <span className="text-white">{currentPath}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                onClick={() => file.isDirectory && handleNavigate(file.path)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {file.isDirectory ? (
                    <Folder className="w-5 h-5 text-blue-400" />
                  ) : (
                    <File className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <div className="text-white font-medium">{file.filename}</div>
                    <div className="text-xs text-gray-400">
                      {formatDate(file.updatedAt)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400 w-20 text-right">
                  {!file.isDirectory && formatBytes(file.size)}
                </div>
                
                {!file.isDirectory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle download
                    }}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
            
            {files.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400">
                This folder is empty.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setShowCreateFolder(false);
                }
              }}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
