/**
 * VFS Synchronization Service with MongoDB GridFS Backend
 * 
 * This service provides the same interface as the original VFS but uses
 * MongoDB GridFS for storage instead of localStorage
 */

import apiClient from './apiClient';

export interface VFSOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'move' | 'copy';
  path: string;
  newPath?: string;
  content?: string;
  timestamp: number;
  source: string; // 'terminal', 'filemanager', 'texteditor', etc.
}

export interface VFSEventListener {
  onFileCreated?: (path: string, content: string, source: string) => void;
  onFileUpdated?: (path: string, content: string, source: string) => void;
  onFileDeleted?: (path: string, source: string) => void;
  onFileMoved?: (oldPath: string, newPath: string, source: string) => void;
  onFileCopied?: (sourcePath: string, destPath: string, source: string) => void;
  onFolderCreated?: (path: string, source: string) => void;
  onFolderDeleted?: (path: string, source: string) => void;
}

// VFS Node interface for compatibility with original Files app
export interface VFSNode {
  name: string;
  type: 'file' | 'folder';
  size: number;
  extension?: string;
  content?: string;
  created: Date;
  modified: Date;
  // Backend-specific fields
  id?: string;
  path?: string;
  parent?: string | null;
}

class VFSSyncService {
  private listeners: VFSEventListener[] = [];
  private operationHistory: VFSOperation[] = [];
  private currentFolderId: string | null = null;

  /**
   * Event Management
   */
  addEventListener(listener: VFSEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: VFSEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(operation: VFSOperation): void {
    this.operationHistory.push(operation);
    
    this.listeners.forEach(listener => {
      switch (operation.type) {
        case 'create':
          if (operation.path.endsWith('/')) {
            listener.onFolderCreated?.(operation.path, operation.source);
          } else {
            listener.onFileCreated?.(operation.path, operation.content || '', operation.source);
          }
          break;
        case 'update':
          listener.onFileUpdated?.(operation.path, operation.content || '', operation.source);
          break;
        case 'delete':
          if (operation.path.endsWith('/')) {
            listener.onFolderDeleted?.(operation.path, operation.source);
          } else {
            listener.onFileDeleted?.(operation.path, operation.source);
          }
          break;
        case 'move':
          listener.onFileMoved?.(operation.path, operation.newPath || '', operation.source);
          break;
        case 'copy':
          listener.onFileCopied?.(operation.path, operation.newPath || '', operation.source);
          break;
      }
    });
  }

  /**
   * Convert backend response to VFS nodes
   */
  private convertBackendToVFS(backendFile: any): VFSNode {
    return {
      id: backendFile.id || backendFile._id,
      name: backendFile.originalName || backendFile.filename,
      type: backendFile.isDirectory ? 'folder' : 'file',
      size: backendFile.size || 0,
      extension: backendFile.isDirectory ? undefined : (backendFile.originalName || backendFile.filename).split('.').pop() || '',
      created: backendFile.createdAt ? new Date(backendFile.createdAt) : new Date(),
      modified: backendFile.updatedAt ? new Date(backendFile.updatedAt) : new Date(),
      path: backendFile.path || '',
      parent: backendFile.parent
    };
  }

  /**
   * File system operations (API compatible with original VFS)
   */
  async listDir(path: string): Promise<VFSNode[]> {
    try {
      const response = await apiClient.getFiles(path);
      const backendFiles = response.files || [];
      
      const vfsNodes = backendFiles.map((file: any) => this.convertBackendToVFS(file));
      
      return vfsNodes;
    } catch (error) {
      console.error(`❌ VFS: Failed to list directory ${path}:`, error);
      throw error;
    }
  }

  async createFile(path: string, content: string = '', source: string = 'filemanager'): Promise<void> {
    try {
      const fileName = this.getFileNameFromPath(path);
      const parentPath = this.getParentPathFromPath(path);
      
      // Create an empty file with content
      const file = new File([content], fileName, { type: 'text/plain' });
      
      await apiClient.uploadFile(file, parentPath);
      
      this.notifyListeners({
        type: 'create',
        path,
        content,
        timestamp: Date.now(),
        source
      });
      
    } catch (error) {
      console.error(`❌ VFS: Failed to create file ${path}:`, error);
      throw error;
    }
  }

  async createFolder(path: string, source: string = 'filemanager'): Promise<void> {
    try {
      const folderName = this.getFileNameFromPath(path);
      const parentPath = this.getParentPathFromPath(path);
      
      await apiClient.createFolder(folderName, parentPath);
      
      this.notifyListeners({
        type: 'create',
        path: path + '/',
        timestamp: Date.now(),
        source
      });
      
    } catch (error) {
      console.error(`❌ VFS: Failed to create folder ${path}:`, error);
      throw error;
    }
  }

  async getFileContent(path: string): Promise<string> {
    try {
      console.log(`📖 VFS: Reading file content: ${path}`);
      
      // Find the file first
      const parentPath = this.getParentPathFromPath(path);
      const fileName = this.getFileNameFromPath(path);
      const items = await this.listDir(parentPath);
      const file = items.find(i => i.name === fileName && i.type === 'file');
      
      if (!file?.id) {
        throw new Error(`File not found: ${path}`);
      }
      
      // Use the new content-specific endpoint for better performance
      const response = await apiClient.getFileContent(file.id);
      const content = response.content;
      
      console.log(`✅ VFS: File content read successfully: ${path} (${content.length} characters)`);
      return content;
    } catch (error) {
      console.error(`❌ VFS: Failed to read file ${path}:`, error);
      throw error;
    }
  }

  async updateFile(path: string, content: string, source: string = 'filemanager'): Promise<void> {
    try {
      console.log(`✏️ VFS: Updating file: ${path}`);
      
      // Check if file exists first
      const parentPath = this.getParentPathFromPath(path);
      const fileName = this.getFileNameFromPath(path);
      console.log(`🔍 VFS: Looking for file "${fileName}" in directory "${parentPath}"`);
      
      const items = await this.listDir(parentPath);
      console.log(`📂 VFS: Found ${items.length} items in ${parentPath}:`, items.map(i => ({name: i.name, id: i.id, type: i.type})));
      
      const existingFile = items.find(i => i.name === fileName);
      console.log(`🔎 VFS: Search result for "${fileName}":`, existingFile);
      
      if (!existingFile?.id) {
        // File doesn't exist, create it instead
        console.log(`📝 VFS: File doesn't exist, creating: ${path}`);
        await this.createFile(path, content, source);
        return;
      }
      
      console.log(`✏️ VFS: Updating file content with ID: ${existingFile.id}`);
      // Use the new content update endpoint
      await apiClient.updateFileContent(existingFile.id, content);
      
      this.notifyListeners({
        type: 'update',
        path,
        content,
        timestamp: Date.now(),
        source
      });
      
      console.log(`✅ VFS: File updated successfully: ${path}`);
    } catch (error) {
      console.error(`❌ VFS Sync - Update file failed:`, error);
      throw error;
    }
  }

  async deleteNode(path: string, source: string = 'filemanager'): Promise<void> {
    try {
      console.log(`🗑️ VFS: Deleting: ${path}`);
      
      // Get the file ID from the current directory listing
      const parentPath = this.getParentPathFromPath(path);
      const fileName = this.getFileNameFromPath(path);
      const items = await this.listDir(parentPath);
      const item = items.find(i => i.name === fileName);
      
      if (!item?.id) {
        throw new Error(`File not found: ${path}`);
      }
      
      await apiClient.deleteFile(item.id);
      
      this.notifyListeners({
        type: 'delete',
        path,
        timestamp: Date.now(),
        source
      });
      
      console.log(`✅ VFS: Deleted successfully: ${path}`);
    } catch (error) {
      console.error(`❌ VFS: Failed to delete ${path}:`, error);
      throw error;
    }
  }

  /**
   * Utility methods for path handling
   */
  private getFileNameFromPath(path: string): string {
    return path.split('/').pop() || '';
  }

  private getParentPathFromPath(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }

  /**
   * Compatibility methods with original VFS
   */
  async exists(path: string): Promise<boolean> {
    try {
      const parentPath = this.getParentPathFromPath(path);
      const fileName = this.getFileNameFromPath(path);
      const items = await this.listDir(parentPath);
      return items.some(item => item.name === fileName);
    } catch {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    try {
      const parentPath = this.getParentPathFromPath(path);
      const fileName = this.getFileNameFromPath(path);
      const items = await this.listDir(parentPath);
      const item = items.find(i => i.name === fileName);
      return item?.type === 'file';
    } catch {
      return false;
    }
  }

  async isFolder(path: string): Promise<boolean> {
    try {
      const parentPath = this.getParentPathFromPath(path);
      const fileName = this.getFileNameFromPath(path);
      const items = await this.listDir(parentPath);
      const item = items.find(i => i.name === fileName);
      return item?.type === 'folder';
    } catch {
      return false;
    }
  }

  /**
   * Get operation history (useful for debugging and undo functionality)
   */
  getOperationHistory(): VFSOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Set current folder context
   */
  setCurrentFolderId(folderId: string | null): void {
    this.currentFolderId = folderId;
  }

  getCurrentFolderId(): string | null {
    return this.currentFolderId;
  }
}

// Create and export singleton instance
export const vfsSyncService = new VFSSyncService();

// Export the class for testing
export { VFSSyncService };
