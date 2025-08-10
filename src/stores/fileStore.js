import { create } from 'zustand';
import apiClient from '../services/apiClient';

const useFileStore = create((set, get) => ({
  // State
  files: [],
  currentPath: [],
  currentFolder: null,
  selectedFiles: [],
  isLoading: false,
  error: null,
  uploadProgress: {},
  sharedWithMe: [],
  sharedByMe: [],

  // Actions
  loadFiles: async (folderId = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.getFiles(folderId);
      
      set({
        files: response.files,
        currentFolder: folderId,
        isLoading: false,
        error: null
      });
      
      return response.files;
    } catch (error) {
      set({
        files: [],
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  uploadFiles: async (files, parentId = null) => {
    const uploadPromises = files.map(async (file, index) => {
      const uploadId = `upload-${Date.now()}-${index}`;
      
      // Initialize upload progress
      set(state => ({
        uploadProgress: {
          ...state.uploadProgress,
          [uploadId]: { progress: 0, status: 'uploading', filename: file.name }
        }
      }));

      try {
        const response = await apiClient.uploadFile(file, parentId);
        
        // Update progress to complete
        set(state => ({
          uploadProgress: {
            ...state.uploadProgress,
            [uploadId]: { progress: 100, status: 'complete', filename: file.name }
          }
        }));

        // Add new file to current files if uploading to current folder
        if (parentId === get().currentFolder) {
          set(state => ({
            files: [...state.files, response.file]
          }));
        }

        // Remove upload progress after a delay
        setTimeout(() => {
          set(state => {
            const newProgress = { ...state.uploadProgress };
            delete newProgress[uploadId];
            return { uploadProgress: newProgress };
          });
        }, 3000);

        return response;
      } catch (error) {
        // Update progress to error
        set(state => ({
          uploadProgress: {
            ...state.uploadProgress,
            [uploadId]: { progress: 0, status: 'error', filename: file.name, error: error.message }
          }
        }));

        throw error;
      }
    });

    return Promise.allSettled(uploadPromises);
  },

  downloadFile: async (fileId, filename) => {
    try {
      const blob = await apiClient.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  createFolder: async (name, parentId = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.createFolder(name, parentId);
      
      // Add new folder to current files if creating in current folder
      if (parentId === get().currentFolder) {
        set(state => ({
          files: [...state.files, response.file],
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
      
      return response;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  deleteFile: async (fileId) => {
    try {
      await apiClient.deleteFile(fileId);
      
      // Remove file from current files
      set(state => ({
        files: state.files.filter(file => file.id !== fileId),
        selectedFiles: state.selectedFiles.filter(id => id !== fileId)
      }));
      
      return true;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  renameFile: async (fileId, newName) => {
    try {
      const response = await apiClient.renameFile(fileId, newName);
      
      // Update file in current files
      set(state => ({
        files: state.files.map(file => 
          file.id === fileId ? { ...file, filename: newName } : file
        )
      }));
      
      return response;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  moveFile: async (fileId, newParentId) => {
    try {
      const response = await apiClient.moveFile(fileId, newParentId);
      
      // Remove file from current files if moved out of current folder
      if (newParentId !== get().currentFolder) {
        set(state => ({
          files: state.files.filter(file => file.id !== fileId),
          selectedFiles: state.selectedFiles.filter(id => id !== fileId)
        }));
      }
      
      return response;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  navigateToFolder: async (folderId, folderName) => {
    const currentPath = get().currentPath;
    
    if (folderId === null) {
      // Navigating to root
      set({ currentPath: [] });
    } else {
      // Add folder to path
      const newPath = [...currentPath, { id: folderId, name: folderName }];
      set({ currentPath: newPath });
    }
    
    await get().loadFiles(folderId);
  },

  navigateUp: async () => {
    const currentPath = get().currentPath;
    
    if (currentPath.length === 0) return; // Already at root
    
    const newPath = currentPath.slice(0, -1);
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    
    set({ currentPath: newPath });
    await get().loadFiles(parentId);
  },

  navigateToPath: async (pathIndex) => {
    const currentPath = get().currentPath;
    const newPath = currentPath.slice(0, pathIndex + 1);
    const targetId = pathIndex === -1 ? null : newPath[newPath.length - 1].id;
    
    set({ currentPath: newPath });
    await get().loadFiles(targetId);
  },

  // File selection
  selectFile: (fileId) => {
    set(state => {
      const isSelected = state.selectedFiles.includes(fileId);
      const newSelection = isSelected
        ? state.selectedFiles.filter(id => id !== fileId)
        : [...state.selectedFiles, fileId];
      
      return { selectedFiles: newSelection };
    });
  },

  selectAllFiles: () => {
    const files = get().files;
    set({ selectedFiles: files.map(file => file.id) });
  },

  clearSelection: () => {
    set({ selectedFiles: [] });
  },

  // File sharing
  shareFile: async (fileId, userId, permissions) => {
    try {
      const response = await apiClient.shareFile(fileId, userId, permissions);
      
      // Update file in current files to reflect sharing
      set(state => ({
        files: state.files.map(file => 
          file.id === fileId 
            ? { ...file, sharedWith: [...(file.sharedWith || []), { user: userId, permissions }] }
            : file
        )
      }));
      
      return response;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  revokeFileSharing: async (fileId, userId) => {
    try {
      await apiClient.revokeFileSharing(fileId, userId);
      
      // Update file in current files to remove sharing
      set(state => ({
        files: state.files.map(file => 
          file.id === fileId 
            ? { ...file, sharedWith: (file.sharedWith || []).filter(share => share.user !== userId) }
            : file
        )
      }));
      
      return true;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  loadSharedFiles: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const [sharedWithMe, sharedByMe] = await Promise.all([
        apiClient.getSharedWithMe(),
        apiClient.getSharedByMe()
      ]);
      
      set({
        sharedWithMe: sharedWithMe.files,
        sharedByMe: sharedByMe.files,
        isLoading: false,
        error: null
      });
      
      return { sharedWithMe: sharedWithMe.files, sharedByMe: sharedByMe.files };
    } catch (error) {
      set({
        sharedWithMe: [],
        sharedByMe: [],
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Utility methods
  getFileById: (fileId) => {
    return get().files.find(file => file.id === fileId);
  },

  getSelectedFiles: () => {
    const { files, selectedFiles } = get();
    return files.filter(file => selectedFiles.includes(file.id));
  },

  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    files: [],
    currentPath: [],
    currentFolder: null,
    selectedFiles: [],
    isLoading: false,
    error: null,
    uploadProgress: {},
    sharedWithMe: [],
    sharedByMe: []
  })
}));

export default useFileStore;
