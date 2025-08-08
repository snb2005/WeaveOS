/**
 * VFS Synchronization Service
 * 
 * This service ensures that all file system operations are synchronized
 * between different components (Terminal, File Manager, Text Editor, etc.)
 */

import { vfs } from './vfs';

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

class VFSSyncService {
  private listeners: VFSEventListener[] = [];
  private operationHistory: VFSOperation[] = [];
  private maxHistorySize = 1000;

  /**
   * Register a component to listen for VFS changes
   */
  addListener(listener: VFSEventListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove all listeners (useful for cleanup)
   */
  clearListeners(): void {
    this.listeners = [];
  }

  /**
   * Log an operation and notify all listeners
   */
  private logOperation(operation: VFSOperation): void {
    this.operationHistory.push(operation);
    
    // Keep history size manageable
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(-this.maxHistorySize);
    }
    
    // Notify listeners
    this.notifyListeners(operation);
  }

  /**
   * Notify all registered listeners about a VFS operation
   */
  private notifyListeners(operation: VFSOperation): void {
    this.listeners.forEach(listener => {
      try {
        switch (operation.type) {
          case 'create':
            if (operation.content !== undefined) {
              listener.onFileCreated?.(operation.path, operation.content, operation.source);
            } else {
              listener.onFolderCreated?.(operation.path, operation.source);
            }
            break;
          
          case 'update':
            if (operation.content !== undefined) {
              listener.onFileUpdated?.(operation.path, operation.content, operation.source);
            }
            break;
          
          case 'delete':
            try {
              // Try to determine if it was a file or folder based on VFS
              // List directory to refresh (result not used directly)
              vfs.listDir(operation.path);
              listener.onFolderDeleted?.(operation.path, operation.source);
            } catch {
              listener.onFileDeleted?.(operation.path, operation.source);
            }
            break;
          
          case 'move':
            if (operation.newPath) {
              listener.onFileMoved?.(operation.path, operation.newPath, operation.source);
            }
            break;
          
          case 'copy':
            if (operation.newPath) {
              listener.onFileCopied?.(operation.path, operation.newPath, operation.source);
            }
            break;
        }
      } catch (error) {
        console.warn('Error notifying VFS listener:', error);
      }
    });
  }

  /**
   * Synchronized file operations that automatically notify all components
   */

  createFile(path: string, content: string = '', source: string = 'unknown'): void {
    try {
      vfs.createFile(path, content);
      this.logOperation({
        type: 'create',
        path,
        content,
        timestamp: Date.now(),
        source
      });
    } catch (error) {
      console.error('VFS Sync - Create file failed:', error);
      throw error;
    }
  }

  createFolder(path: string, source: string = 'unknown'): void {
    try {
      vfs.createFolder(path);
      this.logOperation({
        type: 'create',
        path,
        timestamp: Date.now(),
        source
      });
    } catch (error) {
      console.error('VFS Sync - Create folder failed:', error);
      throw error;
    }
  }

  updateFile(path: string, content: string, source: string = 'unknown'): void {
    try {
      vfs.updateFile(path, content);
      this.logOperation({
        type: 'update',
        path,
        content,
        timestamp: Date.now(),
        source
      });
    } catch (error) {
      console.error('VFS Sync - Update file failed:', error);
      throw error;
    }
  }

  deleteNode(path: string, source: string = 'unknown'): void {
    try {
      vfs.deleteNode(path);
      this.logOperation({
        type: 'delete',
        path,
        timestamp: Date.now(),
        source
      });
    } catch (error) {
      console.error('VFS Sync - Delete node failed:', error);
      throw error;
    }
  }

  moveNode(oldPath: string, newPath: string, source: string = 'unknown'): void {
    try {
      vfs.moveNode(oldPath, newPath);
      this.logOperation({
        type: 'move',
        path: oldPath,
        newPath,
        timestamp: Date.now(),
        source
      });
    } catch (error) {
      console.error('VFS Sync - Move node failed:', error);
      throw error;
    }
  }

  copyFile(sourcePath: string, destPath: string, source: string = 'unknown'): void {
    try {
      const content = vfs.getFileContent(sourcePath);
      vfs.createFile(destPath, content);
      this.logOperation({
        type: 'copy',
        path: sourcePath,
        newPath: destPath,
        timestamp: Date.now(),
        source
      });
    } catch (error) {
      console.error('VFS Sync - Copy file failed:', error);
      throw error;
    }
  }

  /**
   * Read operations (these don't need synchronization but are provided for completeness)
   */

  getFileContent(path: string): string {
    return vfs.getFileContent(path);
  }

  listDir(path: string): any[] {
    return vfs.listDir(path);
  }

  exists(path: string): boolean {
    try {
      vfs.getFileContent(path);
      return true;
    } catch {
      try {
        vfs.listDir(path);
        return true;
      } catch {
        return false;
      }
    }
  }

  isFile(path: string): boolean {
    try {
      vfs.getFileContent(path);
      return true;
    } catch {
      return false;
    }
  }

  isFolder(path: string): boolean {
    try {
      vfs.listDir(path);
      return true;
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
   * Get recent operations by source
   */
  getOperationsBySource(source: string, limit: number = 10): VFSOperation[] {
    return this.operationHistory
      .filter(op => op.source === source)
      .slice(-limit);
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
  }

  /**
   * Export VFS state for backup/debugging
   */
  exportState(): any {
    return {
      vfsStructure: this.getVFSStructure(),
      operationHistory: this.operationHistory,
      timestamp: Date.now()
    };
  }

  /**
   * Get a complete snapshot of the VFS structure
   */
  private getVFSStructure(): any {
    const traverse = (path: string): any => {
      try {
        const items = vfs.listDir(path);
        const result: any = {};
        
        items.forEach(item => {
          const fullPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
          
          if (item.type === 'folder') {
            result[item.name] = {
              type: 'folder',
              children: traverse(fullPath)
            };
          } else {
            result[item.name] = {
              type: 'file',
              content: vfs.getFileContent(fullPath),
              size: item.size || 0
            };
          }
        });
        
        return result;
      } catch (error) {
        return {};
      }
    };
    
    return traverse('/');
  }

  /**
   * Validate VFS integrity
   */
  validateIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Test basic operations
      const rootItems = vfs.listDir('/');
      
      // Check for common directories
      const requiredDirs = ['Desktop', 'Documents', 'Downloads'];
      requiredDirs.forEach(dir => {
        const found = rootItems.some(item => item.name === dir && item.type === 'folder');
        if (!found) {
          errors.push(`Missing required directory: /${dir}`);
        }
      });
      
      // Test file operations
      const testPath = '/._test_' + Date.now();
      try {
        vfs.createFile(testPath, 'test');
        const content = vfs.getFileContent(testPath);
        if (content !== 'test') {
          errors.push('File content mismatch during test');
        }
        vfs.deleteNode(testPath);
      } catch (error) {
        errors.push(`File operation test failed: ${error}`);
      }
      
    } catch (error) {
      errors.push(`VFS root access failed: ${error}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
export const vfsSyncService = new VFSSyncService();

// Export the class for testing
export { VFSSyncService };
