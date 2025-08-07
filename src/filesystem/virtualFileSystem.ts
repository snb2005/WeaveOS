// Legacy interface for backward compatibility
import { vfs, type VFSNode } from './vfs';

// Legacy FileItem interface (mapped to new VFS types)
export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
  extension?: string;
  content?: string;
  children?: FileItem[];
}

// Convert VFS node to legacy FileItem format
function vfsNodeToFileItem(node: VFSNode): FileItem {
  // Ensure dates are properly handled (convert strings back to Date objects if needed)
  const getDateString = (dateValue: Date | string): string => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString();
    }
    return dateValue.toLocaleDateString();
  };

  if (node.type === 'file') {
    return {
      name: node.name,
      type: 'file',
      size: formatFileSize(node.size),
      content: node.content,
      extension: node.extension,
      modified: getDateString(node.modified),
    };
  } else {
    return {
      name: node.name,
      type: 'folder',
      modified: getDateString(node.modified),
      children: node.children.map(vfsNodeToFileItem),
    };
  }
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Export the VFS root as legacy VIRTUAL_FILE_SYSTEM
export const VIRTUAL_FILE_SYSTEM: FileItem = vfsNodeToFileItem(vfs.getNode('/') as VFSNode);

// Legacy navigation function
export const navigateToPath = (root: FileItem, path: string[]): FileItem => {
  try {
    const pathStr = path.length === 0 ? '/' : '/' + path.join('/');
    const node = vfs.getNode(pathStr);
    return node ? vfsNodeToFileItem(node) : root;
  } catch {
    return root;
  }
};

// Legacy file operations
export const findFileByPath = (_root: FileItem, filePath: string): FileItem | null => {
  try {
    const node = vfs.getNode(filePath);
    return node ? vfsNodeToFileItem(node) : null;
  } catch {
    return null;
  }
};

export const readFile = (filePath: string): string | null => {
  try {
    return vfs.getFileContent(filePath);
  } catch {
    return null;
  }
};

export const updateFile = (filePath: string, content: string): boolean => {
  try {
    vfs.updateFile(filePath, content);
    return true;
  } catch {
    return false;
  }
};

export const getTextEditorExtensions = (): string[] => {
  return ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html', '.py', '.java', '.cpp', '.c', '.h'];
};

export const isTextEditable = (fileName: string): boolean => {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  return getTextEditorExtensions().includes(extension);
};

// Re-export VFS for direct access
export { vfs };
export default vfs;
