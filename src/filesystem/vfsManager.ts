/**
 * VFS CRUD Operations Guide and Enhanced Features
 * 
 * This module provides comprehensive CRUD operations and advanced file system features
 * to make the VFS more like a real operating system.
 */

import { vfs } from './vfs';
import { TerminalShell } from './terminalShell';

export class VFSManager {
  private terminal: TerminalShell;

  constructor() {
    this.terminal = new TerminalShell();
  }

  /**
   * ===========================
   * BASIC CRUD OPERATIONS
   * ===========================
   */

  // CREATE Operations
  createFile(path: string, content: string = ''): void {
    console.log(`📝 Creating file: ${path}`);
    vfs.createFile(path, content);
    console.log(`✅ File created successfully`);
  }

  createFolder(path: string): void {
    console.log(`📁 Creating folder: ${path}`);
    vfs.createFolder(path);
    console.log(`✅ Folder created successfully`);
  }

  // READ Operations
  readFile(path: string): string {
    console.log(`📖 Reading file: ${path}`);
    const content = vfs.getFileContent(path);
    console.log(`✅ File read successfully (${content.length} characters)`);
    return content;
  }

  listDirectory(path: string = '/'): any[] {
    console.log(`📂 Listing directory: ${path}`);
    const contents = vfs.listDir(path);
    console.log(`✅ Found ${contents.length} items`);
    return contents;
  }

  // UPDATE Operations
  updateFile(path: string, newContent: string): void {
    console.log(`✏️  Updating file: ${path}`);
    vfs.updateFile(path, newContent);
    console.log(`✅ File updated successfully`);
  }

  appendToFile(path: string, content: string): void {
    console.log(`➕ Appending to file: ${path}`);
    const currentContent = vfs.getFileContent(path);
    vfs.updateFile(path, currentContent + content);
    console.log(`✅ Content appended successfully`);
  }

  // DELETE Operations
  deleteFile(path: string): void {
    console.log(`🗑️  Deleting file: ${path}`);
    vfs.deleteNode(path);
    console.log(`✅ File deleted successfully`);
  }

  deleteFolder(path: string): void {
    console.log(`🗑️  Deleting folder: ${path}`);
    vfs.deleteNode(path);
    console.log(`✅ Folder deleted successfully`);
  }

  // MOVE Operations
  moveItem(oldPath: string, newPath: string): void {
    console.log(`🔄 Moving ${oldPath} to ${newPath}`);
    vfs.moveNode(oldPath, newPath);
    console.log(`✅ Item moved successfully`);
  }

  renameItem(path: string, newName: string): void {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
    this.moveItem(path, newPath);
  }

  /**
   * ===========================
   * ADVANCED FILE OPERATIONS
   * ===========================
   */

  // Copy operations
  copyFile(sourcePath: string, destPath: string): void {
    console.log(`📋 Copying file from ${sourcePath} to ${destPath}`);
    const content = vfs.getFileContent(sourcePath);
    vfs.createFile(destPath, content);
    console.log(`✅ File copied successfully`);
  }

  copyFolder(sourcePath: string, destPath: string): void {
    console.log(`📋 Copying folder from ${sourcePath} to ${destPath}`);
    
    const sourceNode = vfs.getNode(sourcePath);
    if (!sourceNode || sourceNode.type !== 'folder') {
      throw new Error('Source is not a folder');
    }

    // Create destination folder
    vfs.createFolder(destPath);

    // Recursively copy children
    sourceNode.children.forEach(child => {
      const childSourcePath = sourcePath === '/' ? `/${child.name}` : `${sourcePath}/${child.name}`;
      const childDestPath = destPath === '/' ? `/${child.name}` : `${destPath}/${child.name}`;
      
      if (child.type === 'file') {
        this.copyFile(childSourcePath, childDestPath);
      } else {
        this.copyFolder(childSourcePath, childDestPath);
      }
    });

    console.log(`✅ Folder copied successfully`);
  }

  // Search operations
  findFiles(pattern: string, searchPath: string = '/'): string[] {
    console.log(`🔍 Searching for files matching "${pattern}" in ${searchPath}`);
    const results = vfs.findFiles(pattern, searchPath);
    console.log(`✅ Found ${results.length} matching files`);
    return results;
  }

  searchFileContent(searchTerm: string, searchPath: string = '/'): Array<{path: string, matches: number}> {
    console.log(`🔍 Searching for content "${searchTerm}" in files under ${searchPath}`);
    const results: Array<{path: string, matches: number}> = [];
    
    const searchInNode = (node: any, currentPath: string) => {
      if (node.type === 'file' && node.content) {
        const matches = (node.content.match(new RegExp(searchTerm, 'gi')) || []).length;
        if (matches > 0) {
          results.push({ path: currentPath, matches });
        }
      } else if (node.type === 'folder') {
        node.children.forEach((child: any) => {
          const childPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
          searchInNode(child, childPath);
        });
      }
    };

    const startNode = vfs.getNode(searchPath);
    if (startNode) {
      searchInNode(startNode, searchPath);
    }

    console.log(`✅ Found ${results.length} files with content matches`);
    return results;
  }

  // File system analysis
  analyzeDirectory(path: string = '/'): any {
    console.log(`📊 Analyzing directory: ${path}`);
    
    const analysis = {
      totalFiles: 0,
      totalFolders: 0,
      totalSize: 0,
      fileTypes: {} as Record<string, number>,
      largestFiles: [] as Array<{path: string, size: number}>,
      oldestFiles: [] as Array<{path: string, created: Date}>,
      newestFiles: [] as Array<{path: string, modified: Date}>
    };

    const analyzeNode = (node: any, currentPath: string) => {
      if (node.type === 'file') {
        analysis.totalFiles++;
        analysis.totalSize += node.size;
        
        // Track file types
        const ext = node.extension || 'no-extension';
        analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
        
        // Track largest files
        analysis.largestFiles.push({path: currentPath, size: node.size});
        
        // Track file ages
        analysis.oldestFiles.push({path: currentPath, created: new Date(node.created)});
        analysis.newestFiles.push({path: currentPath, modified: new Date(node.modified)});
        
      } else if (node.type === 'folder') {
        analysis.totalFolders++;
        node.children.forEach((child: any) => {
          const childPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
          analyzeNode(child, childPath);
        });
      }
    };

    const startNode = vfs.getNode(path);
    if (startNode) {
      analyzeNode(startNode, path);
    }

    // Sort results
    analysis.largestFiles.sort((a, b) => b.size - a.size).splice(10); // Top 10
    analysis.oldestFiles.sort((a, b) => a.created.getTime() - b.created.getTime()).splice(10);
    analysis.newestFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime()).splice(10);

    console.log(`✅ Analysis complete: ${analysis.totalFiles} files, ${analysis.totalFolders} folders`);
    return analysis;
  }

  // Batch operations
  createMultipleFiles(files: Array<{path: string, content: string}>): void {
    console.log(`📝 Creating ${files.length} files in batch`);
    files.forEach(({path, content}) => {
      vfs.createFile(path, content);
    });
    console.log(`✅ All files created successfully`);
  }

  deleteMultipleItems(paths: string[]): void {
    console.log(`🗑️  Deleting ${paths.length} items in batch`);
    paths.forEach(path => {
      vfs.deleteNode(path);
    });
    console.log(`✅ All items deleted successfully`);
  }

  /**
   * ===========================
   * FILE SYSTEM UTILITIES
   * ===========================
   */

  // Path utilities
  getParentPath(path: string): string {
    return path.substring(0, path.lastIndexOf('/')) || '/';
  }

  getFileName(path: string): string {
    return path.substring(path.lastIndexOf('/') + 1);
  }

  getFileExtension(path: string): string {
    const fileName = this.getFileName(path);
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.substring(dotIndex + 1) : '';
  }

  // File type checking
  isTextFile(path: string): boolean {
    const ext = this.getFileExtension(path).toLowerCase();
    const textExtensions = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 'xml', 'csv', 'log'];
    return textExtensions.includes(ext);
  }

  isImageFile(path: string): boolean {
    const ext = this.getFileExtension(path).toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return imageExtensions.includes(ext);
  }

  // File system validation
  validatePath(path: string): boolean {
    return vfs.pathExists(path);
  }

  getFileStats(path: string): any {
    const node = vfs.getNode(path);
    if (!node) return null;

    return {
      name: node.name,
      type: node.type,
      size: node.type === 'file' ? node.size : undefined,
      created: node.created,
      modified: node.modified,
      extension: node.type === 'file' ? (node as any).extension : undefined,
      isReadable: true,
      isWritable: true,
      isExecutable: node.type === 'file' && ['js', 'ts', 'sh', 'py'].includes((node as any).extension)
    };
  }

  /**
   * ===========================
   * DEMONSTRATION METHODS
   * ===========================
   */

  runCRUDDemo(): void {
    console.log('\n🎬 Starting CRUD Operations Demo...\n');

    try {
      // CREATE operations
      console.log('1️⃣ CREATE OPERATIONS:');
      this.createFolder('/demo');
      this.createFolder('/demo/projects');
      this.createFile('/demo/readme.txt', 'This is a demo file system');
      this.createFile('/demo/projects/app.js', 'console.log("Hello World!");');

      // READ operations
      console.log('\n2️⃣ READ OPERATIONS:');
      const readmeContent = this.readFile('/demo/readme.txt');
      console.log(`File content: "${readmeContent}"`);
      const demoContents = this.listDirectory('/demo');
      console.log('Demo folder contents:', demoContents.map(item => `${item.name} (${item.type})`));

      // UPDATE operations
      console.log('\n3️⃣ UPDATE OPERATIONS:');
      this.updateFile('/demo/readme.txt', 'This is an updated demo file');
      this.appendToFile('/demo/readme.txt', '\nAppended content!');

      // Advanced operations
      console.log('\n4️⃣ ADVANCED OPERATIONS:');
      this.copyFile('/demo/readme.txt', '/demo/readme-backup.txt');
      this.copyFolder('/demo/projects', '/demo/projects-backup');
      this.renameItem('/demo/projects-backup', 'projects-renamed');

      // Search operations
      console.log('\n5️⃣ SEARCH OPERATIONS:');
      const txtFiles = this.findFiles('*.txt', '/demo');
      console.log('Text files found:', txtFiles);
      
      const contentMatches = this.searchFileContent('demo', '/demo');
      console.log('Files containing "demo":', contentMatches);

      // Analysis
      console.log('\n6️⃣ ANALYSIS:');
      const analysis = this.analyzeDirectory('/demo');
      console.log('Directory analysis:', {
        files: analysis.totalFiles,
        folders: analysis.totalFolders,
        size: analysis.totalSize,
        fileTypes: analysis.fileTypes
      });

      // DELETE operations (cleanup)
      console.log('\n7️⃣ CLEANUP:');
      this.deleteFile('/demo/readme-backup.txt');
      this.deleteFolder('/demo/projects-renamed');
      
      console.log('\n✅ CRUD Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  runTerminalIntegrationDemo(): void {
    console.log('\n🖥️  Running Terminal Integration Demo...\n');

    const commands = [
      'pwd',
      'ls -la',
      'mkdir /terminal-demo',
      'cd /terminal-demo',
      'touch sample.txt',
      'echo "Hello from terminal" > sample.txt',
      'cat sample.txt',
      'ls',
      'tree',
      'find *.txt',
      'cd /',
      'rm -rf /terminal-demo'
    ];

    commands.forEach(cmd => {
      console.log(`$ ${cmd}`);
      try {
        const output = this.terminal.executeCommand(cmd);
        if (output) {
          console.log(output);
        }
      } catch (error) {
        console.log(`Error: ${error}`);
      }
      console.log(''); // Empty line
    });

    console.log('✅ Terminal integration demo completed!');
  }
}

// Export singleton instance
export const vfsManager = new VFSManager();
export default vfsManager;
