/**
 * VFS Demo and Testing Utility
 * 
 * Demonstrates the Virtual File System capabilities
 */

import { vfs } from './vfs';

export class VFSDemo {
  static runDemo(): void {
    console.log('🌳 Virtual File System Demo');
    console.log('==============================');

    try {
      // Basic navigation
      console.log('\n📁 Directory Listing:');
      console.log('Root contents:', vfs.listDir('/').map(n => n.name));
      
      // File operations
      console.log('\n📝 File Operations:');
      
      // Create a test file
      vfs.createFile('/test-file.txt', 'Hello from VFS!\nThis is a test file.');
      console.log('✓ Created test-file.txt');
      
      // Read file content
      const content = vfs.getFileContent('/test-file.txt');
      console.log('📖 File content:', content);
      
      // Update file
      vfs.updateFile('/test-file.txt', content + '\n\nUpdated content!');
      console.log('✓ Updated test-file.txt');
      
      // Create directory
      vfs.createFolder('/TestDirectory');
      console.log('✓ Created TestDirectory');
      
      // Create nested structure
      vfs.createFolder('/TestDirectory/SubFolder');
      vfs.createFile('/TestDirectory/SubFolder/nested.md', '# Nested File\n\nThis file is in a subdirectory.');
      console.log('✓ Created nested structure');
      
      // Path operations
      console.log('\n🔍 Path Operations:');
      console.log('Normalized path "../Documents":', vfs.normalizePath('../Documents'));
      console.log('Resolved relative path:', vfs.resolvePath('Documents', '/'));
      
      // Search
      console.log('\n🔎 Search Operations:');
      const txtFiles = vfs.findFiles('*.txt');
      console.log('Found .txt files:', txtFiles);
      
      const mdFiles = vfs.findFiles('*.md');
      console.log('Found .md files:', mdFiles.slice(0, 3), '...');
      
      // Statistics
      console.log('\n📊 File System Statistics:');
      const stats = vfs.getStats();
      console.log(`Files: ${stats.files}, Folders: ${stats.folders}, Total Size: ${this.formatBytes(stats.totalSize)}`);
      
      // Move operation
      console.log('\n↔️ Move Operations:');
      vfs.moveNode('/test-file.txt', '/TestDirectory/moved-file.txt');
      console.log('✓ Moved test-file.txt to TestDirectory');
      
      // Cleanup
      vfs.deleteNode('/TestDirectory');
      console.log('✓ Cleaned up test directory');
      
      console.log('\n✅ VFS Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ VFS Demo failed:', error);
    }
  }

  static testTerminalCommands(): void {
    console.log('\n🖥️ Terminal Commands Test');
    console.log('===========================');

    // This would normally be imported from terminalShell
    // For now, just demonstrate VFS operations that terminal would use
    
    try {
      // Simulate terminal operations
      console.log('Current directory:', vfs.getCurrentPath());
      
      // ls command simulation
      const files = vfs.listDir('/').map(node => ({
        name: node.name,
        type: node.type,
        size: node.type === 'file' ? node.size : 'DIR'
      }));
      console.log('Directory listing:', files.slice(0, 5));
      
      // cd command simulation
      vfs.setCurrentPath('/Documents');
      console.log('Changed directory to:', vfs.getCurrentPath());
      
      // pwd command
      console.log('Current working directory:', vfs.getCurrentPath());
      
      // Reset
      vfs.setCurrentPath('/');
      
      console.log('✅ Terminal commands test completed!');
      
    } catch (error) {
      console.error('❌ Terminal commands test failed:', error);
    }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  }
}

// Auto-run demo in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Run demo after a short delay
  setTimeout(() => {
    VFSDemo.runDemo();
    VFSDemo.testTerminalCommands();
  }, 1000);
}

export default VFSDemo;
