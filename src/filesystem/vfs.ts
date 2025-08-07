/**
 * Virtual File System (VFS) for Weave OS
 * 
 * A complete in-memory file system with tree structure,
 * full CRUD operations, and persistence support.
 */

// Core file system types
export interface FileNode {
  type: 'file';
  name: string;
  extension: string;
  content: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface FolderNode {
  type: 'folder';
  name: string;
  children: VFSNode[];
  created: Date;
  modified: Date;
}

export type VFSNode = FileNode | FolderNode;

// VFS Error types
export class VFSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VFSError';
  }
}

// Main VFS Class
export class VirtualFileSystem {
  private root: FolderNode;
  private currentPath: string = '/';

  constructor() {
    this.root = this.createFolderNodeHelper('/', []);
    
    // Try to load existing file system from localStorage
    const loaded = this.load();
    
    // If no saved data exists, initialize with default structure
    if (!loaded) {
      this.initializeDefaultStructure();
    }
  }

  /**
   * Initialize the file system with default directories and files
   */
  private initializeDefaultStructure(): void {
    // Create default directory structure
    this.createFolder('/Desktop');
    this.createFolder('/Documents');
    this.createFolder('/Documents/Projects');
    this.createFolder('/Documents/Projects/src');
    this.createFolder('/Documents/Notes');
    this.createFolder('/Downloads');
    this.createFolder('/Pictures');
    this.createFolder('/Pictures/Screenshots');
    this.createFolder('/Music');
    this.createFolder('/Videos');

    // Create default files with content
    this.createFile('/Desktop/Welcome.txt', 
      'Welcome to Weave OS!\n\nThis is a browser-based operating system inspired by Ubuntu.\n\nYou can:\n- Open Terminal for command-line access\n- Browse files with the File Manager\n- Edit text files with the Text Editor\n- Customize settings in System Settings\n\nEnjoy exploring!'
    );

    this.createFile('/Desktop/Quick Guide.md',
      '# Weave OS Quick Guide\n\n## Getting Started\n\n1. **File Explorer**: Click on the Files icon to browse your virtual file system\n2. **Text Editor**: Double-click any `.txt`, `.md`, `.js`, or other text files to edit them\n3. **Terminal**: Access the command line interface\n4. **Settings**: Customize your desktop experience\n\n## Text Editor Features\n\n- ✅ Multi-file support\n- ✅ Auto-save option\n- ✅ Syntax awareness\n- ✅ Line numbers\n- ✅ Word/character count\n- ✅ Keyboard shortcuts (Ctrl+S to save)\n\nHappy coding! 🚀'
    );

    this.createFile('/Documents/resume.md',
      '# John Doe\n\n**Software Engineer**\n\n## Experience\n\n### Senior Developer at TechCorp (2020-Present)\n- Developed React applications\n- Led team of 5 developers\n- Improved performance by 40%\n\n### Junior Developer at StartupXYZ (2018-2020)\n- Built REST APIs\n- Worked with Node.js and Express\n- Collaborated with design team\n\n## Skills\n\n- JavaScript/TypeScript\n- React, Vue.js\n- Node.js, Python\n- SQL, MongoDB\n- Docker, AWS'
    );

    this.createFile('/Documents/Notes/todo.txt',
      'TODO List\n=========\n\n[ ] Finish VFS implementation\n[ ] Add file permissions\n[ ] Implement file search\n[ ] Add file compression\n[ ] Create backup system\n\n## Ideas\n- Add syntax highlighting\n- Implement file watcher\n- Create plugin system\n- Add collaborative editing'
    );

    this.createFile('/Documents/Projects/README.md',
      '# My Projects\n\nThis folder contains various development projects.\n\n## Current Projects\n\n### Weave OS\nA browser-based operating system built with React and TypeScript.\n\n**Features:**\n- Virtual file system\n- Terminal emulation\n- Text editor\n- File explorer\n- Window management\n\n**Tech Stack:**\n- React + TypeScript\n- Vite\n- Tailwind CSS\n- Framer Motion (planned)\n\n### Status\n🚧 In active development'
    );

    this.createFile('/Documents/Projects/src/index.ts',
      `import { VirtualFileSystem } from './vfs';\n\n// Initialize the virtual file system\nconst vfs = new VirtualFileSystem();\n\n// Example usage\nconsole.log('Current directory:', vfs.getCurrentPath());\nconsole.log('Files in root:', vfs.listDir('/'));\n\n// Create a test file\nvfs.createFile('/test.txt', 'Hello, World!');\nconsole.log('File content:', vfs.getFileContent('/test.txt'));\n\nexport default vfs;`
    );

    this.createFile('/Documents/Projects/src/styles.css',
      `/* Weave OS Styles */\n\nbody {\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;\n  margin: 0;\n  padding: 0;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}\n\n.window {\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(10px);\n  border-radius: 8px;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);\n}\n\n.dock {\n  background: rgba(0, 0, 0, 0.7);\n  backdrop-filter: blur(10px);\n  border-radius: 12px;\n}\n\n/* Animations */\n.fade-in {\n  animation: fadeIn 0.3s ease-in-out;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; transform: scale(0.95); }\n  to { opacity: 1; transform: scale(1); }\n}`
    );

    this.createFile('/Documents/config.json',
      `{\n  "theme": "dark",\n  "fontSize": 14,\n  "autoSave": true,\n  "showLineNumbers": true,\n  "wordWrap": true,\n  "minimap": false,\n  "terminal": {\n    "shell": "/bin/bash",\n    "fontSize": 12,\n    "cursorStyle": "block"\n  },\n  "fileExplorer": {\n    "showHiddenFiles": false,\n    "sortBy": "name",\n    "viewMode": "grid"\n  }\n}`
    );
  }

  /**
   * Utility functions
   */
  
  private createFolderNodeHelper(name: string, children: VFSNode[] = []): FolderNode {
    const now = new Date();
    return {
      type: 'folder',
      name,
      children,
      created: now,
      modified: now
    };
  }

  private createFileNode(name: string, content: string = ''): FileNode {
    const extension = name.includes('.') ? name.split('.').pop() || '' : '';
    const now = new Date();
    return {
      type: 'file',
      name,
      extension,
      content,
      size: content.length,
      created: now,
      modified: now
    };
  }

  /**
   * Path utilities
   */
  
  normalizePath(path: string): string {
    // Handle empty or root paths
    if (!path || path === '/') return '/';
    
    // Ensure path starts with /
    if (!path.startsWith('/')) path = '/' + path;
    
    // Split into parts and filter empty segments
    const parts = path.split('/').filter(part => part !== '');
    const normalized: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        // Go up one level (unless at root)
        if (normalized.length > 0) {
          normalized.pop();
        }
      } else if (part !== '.') {
        // Add segment (ignore current directory references)
        normalized.push(part);
      }
    }
    
    return normalized.length === 0 ? '/' : '/' + normalized.join('/');
  }

  resolvePath(path: string, currentDir: string): string {
    if (path.startsWith('/')) {
      // Absolute path
      return this.normalizePath(path);
    } else {
      // Relative path
      const basePath = currentDir === '/' ? '' : currentDir;
      return this.normalizePath(basePath + '/' + path);
    }
  }

  /**
   * Core file system operations
   */

  getNode(path: string): VFSNode | undefined {
    const normalizedPath = this.normalizePath(path);
    
    if (normalizedPath === '/') {
      return this.root;
    }

    const parts = normalizedPath.split('/').filter(part => part !== '');
    let current: VFSNode = this.root;

    for (const part of parts) {
      if (current.type !== 'folder') {
        return undefined;
      }
      
      const foundChild: VFSNode | undefined = current.children.find((childNode: VFSNode) => childNode.name === part);
      if (!foundChild) {
        return undefined;
      }
      
      current = foundChild;
    }

    return current;
  }

  listDir(path: string): VFSNode[] {
    const node = this.getNode(path);
    
    if (!node) {
      throw new VFSError(`Directory not found: ${path}`);
    }
    
    if (node.type !== 'folder') {
      throw new VFSError(`Not a directory: ${path}`);
    }
    
    return node.children;
  }

  createFile(path: string, content: string = ''): void {
    const normalizedPath = this.normalizePath(path);
    const parentPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';
    const fileName = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);

    if (!fileName) {
      throw new VFSError('Invalid file name');
    }

    const parentNode = this.getNode(parentPath);
    
    if (!parentNode) {
      throw new VFSError(`Parent directory not found: ${parentPath}`);
    }
    
    if (parentNode.type !== 'folder') {
      throw new VFSError(`Parent is not a directory: ${parentPath}`);
    }

    // Check if file already exists
    if (parentNode.children.some(child => child.name === fileName)) {
      throw new VFSError(`File already exists: ${path}`);
    }

    const newFile = this.createFileNode(fileName, content);
    parentNode.children.push(newFile);
    parentNode.modified = new Date();
    
    // Auto-save after creating file
    this.save();
  }

  updateFile(path: string, newContent: string): void {
    const node = this.getNode(path);
    
    if (!node) {
      throw new VFSError(`File not found: ${path}`);
    }
    
    if (node.type !== 'file') {
      throw new VFSError(`Not a file: ${path}`);
    }

    node.content = newContent;
    node.size = newContent.length;
    node.modified = new Date();
    
    // Auto-save after updating file
    this.save();
  }

  createFolder(path: string): void {
    const normalizedPath = this.normalizePath(path);
    
    if (normalizedPath === '/') {
      return; // Root already exists
    }

    const parentPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';
    const folderName = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);

    if (!folderName) {
      throw new VFSError('Invalid folder name');
    }

    const parentNode = this.getNode(parentPath);
    
    if (!parentNode) {
      throw new VFSError(`Parent directory not found: ${parentPath}`);
    }
    
    if (parentNode.type !== 'folder') {
      throw new VFSError(`Parent is not a directory: ${parentPath}`);
    }

    // Check if folder already exists
    if (parentNode.children.some(child => child.name === folderName)) {
      throw new VFSError(`Folder already exists: ${path}`);
    }

    const newFolder = this.createFolderNodeHelper(folderName);
    parentNode.children.push(newFolder);
    parentNode.modified = new Date();
    
    // Auto-save after creating folder
    this.save();
  }

  deleteNode(path: string): void {
    const normalizedPath = this.normalizePath(path);
    
    if (normalizedPath === '/') {
      throw new VFSError('Cannot delete root directory');
    }

    const parentPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';
    const nodeName = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);

    const parentNode = this.getNode(parentPath);
    
    if (!parentNode) {
      throw new VFSError(`Parent directory not found: ${parentPath}`);
    }
    
    if (parentNode.type !== 'folder') {
      throw new VFSError(`Parent is not a directory: ${parentPath}`);
    }

    const nodeIndex = parentNode.children.findIndex(child => child.name === nodeName);
    
    if (nodeIndex === -1) {
      throw new VFSError(`File or directory not found: ${path}`);
    }

    parentNode.children.splice(nodeIndex, 1);
    parentNode.modified = new Date();
    
    // Auto-save after deleting node
    this.save();
  }

  moveNode(oldPath: string, newPath: string): void {
    const oldNormalizedPath = this.normalizePath(oldPath);
    const newNormalizedPath = this.normalizePath(newPath);
    
    if (oldNormalizedPath === newNormalizedPath) {
      return; // Same path, nothing to do
    }

    if (oldNormalizedPath === '/') {
      throw new VFSError('Cannot move root directory');
    }

    // Get the node to move
    const nodeToMove = this.getNode(oldNormalizedPath);
    if (!nodeToMove) {
      throw new VFSError(`Source not found: ${oldPath}`);
    }

    // Check if destination already exists
    if (this.getNode(newNormalizedPath)) {
      throw new VFSError(`Destination already exists: ${newPath}`);
    }

    // Get parent directories
    const oldParentPath = oldNormalizedPath.substring(0, oldNormalizedPath.lastIndexOf('/')) || '/';
    const newParentPath = newNormalizedPath.substring(0, newNormalizedPath.lastIndexOf('/')) || '/';
    const newName = newNormalizedPath.substring(newNormalizedPath.lastIndexOf('/') + 1);

    const oldParent = this.getNode(oldParentPath) as FolderNode;
    const newParent = this.getNode(newParentPath) as FolderNode;

    if (!newParent || newParent.type !== 'folder') {
      throw new VFSError(`Destination parent directory not found: ${newParentPath}`);
    }

    // Remove from old parent
    const oldIndex = oldParent.children.findIndex(child => child.name === nodeToMove.name);
    oldParent.children.splice(oldIndex, 1);
    oldParent.modified = new Date();

    // Update name and add to new parent
    nodeToMove.name = newName;
    newParent.children.push(nodeToMove);
    newParent.modified = new Date();
    
    // Auto-save after moving node
    this.save();
  }

  /**
   * Utility methods
   */

  pathExists(path: string): boolean {
    return this.getNode(path) !== undefined;
  }

  isFolder(path: string): boolean {
    const node = this.getNode(path);
    return node?.type === 'folder';
  }

  isFile(path: string): boolean {
    const node = this.getNode(path);
    return node?.type === 'file';
  }

  getFileContent(path: string): string {
    const node = this.getNode(path);
    
    if (!node) {
      throw new VFSError(`File not found: ${path}`);
    }
    
    if (node.type !== 'file') {
      throw new VFSError(`Not a file: ${path}`);
    }
    
    return node.content;
  }

  getFileSize(path: string): number {
    const node = this.getNode(path);
    
    if (!node) {
      throw new VFSError(`File not found: ${path}`);
    }
    
    if (node.type !== 'file') {
      throw new VFSError(`Not a file: ${path}`);
    }
    
    return node.size;
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  setCurrentPath(path: string): void {
    const normalizedPath = this.normalizePath(path);
    
    if (!this.pathExists(normalizedPath)) {
      throw new VFSError(`Directory not found: ${path}`);
    }
    
    if (!this.isFolder(normalizedPath)) {
      throw new VFSError(`Not a directory: ${path}`);
    }
    
    this.currentPath = normalizedPath;
  }

  /**
   * Persistence methods (localStorage for now)
   */

  save(): void {
    try {
      const data = JSON.stringify(this.root, null, 2);
      localStorage.setItem('weave-vfs', data);
      localStorage.setItem('weave-vfs-timestamp', new Date().toISOString());
    } catch (error) {
      throw new VFSError('Failed to save file system');
    }
  }

  load(): boolean {
    try {
      const data = localStorage.getItem('weave-vfs');
      if (data) {
        const parsed = JSON.parse(data);
        // Recursively convert date strings back to Date objects
        const restoredRoot = this.restoreDateObjects(parsed);
        if (restoredRoot.type === 'folder') {
          this.root = restoredRoot as FolderNode;
          return true;
        }
      }
      return false;
    } catch (error) {
      throw new VFSError('Failed to load file system');
    }
  }

  private restoreDateObjects(node: any): FolderNode | FileNode {
    if (node.type === 'file') {
      return {
        ...node,
        created: new Date(node.created),
        modified: new Date(node.modified)
      } as FileNode;
    } else {
      return {
        ...node,
        created: new Date(node.created),
        modified: new Date(node.modified),
        children: node.children.map((child: any) => this.restoreDateObjects(child))
      } as FolderNode;
    }
  }

  /**
   * Search and utility methods
   */

  findFiles(pattern: string, path: string = '/'): string[] {
    const results: string[] = [];
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    
    const search = (node: VFSNode, currentPath: string) => {
      if (node.type === 'file' && regex.test(node.name)) {
        results.push(currentPath);
      }
      
      if (node.type === 'folder') {
        for (const child of node.children) {
          const childPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
          search(child, childPath);
        }
      }
    };
    
    const startNode = this.getNode(path);
    if (startNode) {
      search(startNode, path);
    }
    
    return results;
  }

  getStats(): { files: number; folders: number; totalSize: number } {
    let files = 0;
    let folders = 0;
    let totalSize = 0;
    
    const traverse = (node: VFSNode) => {
      if (node.type === 'file') {
        files++;
        totalSize += node.size;
      } else {
        folders++;
        for (const child of node.children) {
          traverse(child);
        }
      }
    };
    
    traverse(this.root);
    
    return { files, folders, totalSize };
  }
}

// Create and export a singleton instance
export const vfs = new VirtualFileSystem();

export default vfs;
