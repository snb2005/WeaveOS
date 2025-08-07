/**
 * Terminal Shell Integration with VFS
 * 
 * Provides shell commands that interact with the Virtual File System
 */

import { vfs, VFSError } from './vfs';

export class TerminalShell {
  private currentPath: string = '/';
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    // Initialize with VFS current path
    this.currentPath = vfs.getCurrentPath();
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  getHistoryItem(index: number): string | undefined {
    return this.history[index];
  }

  addToHistory(command: string): void {
    if (command.trim() && (this.history.length === 0 || this.history[this.history.length - 1] !== command.trim())) {
      this.history.push(command.trim());
    }
    this.historyIndex = -1; // Reset history navigation
  }

  navigateHistory(direction: 'up' | 'down'): string {
    if (this.history.length === 0) return '';

    if (direction === 'up') {
      if (this.historyIndex === -1) {
        this.historyIndex = this.history.length - 1;
      } else if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    } else { // down
      if (this.historyIndex === -1) {
        return '';
      } else if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
      } else {
        this.historyIndex = -1;
        return '';
      }
    }

    return this.historyIndex === -1 ? '' : this.history[this.historyIndex];
  }

  executeCommand(command: string): string {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return '';

    // Add to history
    this.history.push(trimmedCommand);

    const [cmd, ...args] = trimmedCommand.split(' ');

    try {
      switch (cmd.toLowerCase()) {
        case 'pwd':
          return this.pwd();
        case 'ls':
          return this.ls(args[0]);
        case 'cd':
          return this.cd(args[0] || '/');
        case 'cat':
          return this.cat(args[0]);
        case 'mkdir':
          return this.mkdir(args[0]);
        case 'touch':
          return this.touch(args[0]);
        case 'rm':
          return this.rm(args[0]);
        case 'mv':
          return this.mv(args[0], args[1]);
        case 'cp':
          return this.cp(args[0], args[1]);
        case 'find':
          return this.find(args[0] || '*');
        case 'echo':
          return this.echo(args.join(' '));
        case 'tree':
          return this.tree(args[0] || this.currentPath);
        case 'du':
          return this.du();
        case 'help':
          return this.help();
        case 'clear':
          return 'CLEAR_SCREEN';
        case 'history':
          return this.showHistory();
        default:
          return `Command not found: ${cmd}. Type 'help' for available commands.`;
      }
    } catch (error) {
      return `Error: ${error instanceof VFSError ? error.message : 'Unknown error'}`;
    }
  }

  private pwd(): string {
    return this.currentPath;
  }

  private ls(path?: string): string {
    try {
      const args = path ? path.split(' ') : [];
      const options = args.filter(arg => arg.startsWith('-'));
      const targetPath = args.find(arg => !arg.startsWith('-')) || this.currentPath;
      
      const resolvedPath = vfs.resolvePath(targetPath, this.currentPath);
      const nodes = vfs.listDir(resolvedPath);
      
      if (nodes.length === 0) {
        return '';
      }

      const isLongFormat = options.includes('-l') || options.includes('-la') || options.includes('-al');
      const showAll = options.includes('-a') || options.includes('-la') || options.includes('-al');

      // Add current and parent directory entries if showing all
      let displayNodes = [...nodes];
      if (showAll && resolvedPath !== '/') {
        displayNodes.unshift(
          { name: '.', type: 'folder' as const, children: [], modified: new Date(), created: new Date() },
          { name: '..', type: 'folder' as const, children: [], modified: new Date(), created: new Date() }
        );
      }

      if (isLongFormat) {
        // Long format similar to `ls -l`
        const formatted = displayNodes.map(node => {
          const prefix = node.type === 'folder' ? 'd' : '-';
          const permissions = 'rwxr-xr-x';
          const size = node.type === 'file' ? (node as any).size.toString().padStart(8) : '     DIR';
          const date = new Date(node.modified);
          const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const name = node.type === 'folder' ? `\x1b[34m${node.name}\x1b[0m` : node.name;
          
          return `${prefix}${permissions} 1 user user ${size} ${dateStr} ${name}`;
        });

        const totalSize = displayNodes.reduce((sum, node) => 
          sum + (node.type === 'file' ? (node as any).size : 0), 0);
        return `total ${Math.ceil(totalSize / 1024)}\n${formatted.join('\n')}`;
      } else {
        // Simple format - display in columns like Ubuntu
        const folders = displayNodes.filter(node => node.type === 'folder');
        const files = displayNodes.filter(node => node.type === 'file');
        const sortedNodes = [...folders.sort((a, b) => a.name.localeCompare(b.name)), 
                            ...files.sort((a, b) => a.name.localeCompare(b.name))];
        
        const maxNameLength = Math.max(...sortedNodes.map(node => node.name.length));
        const terminalWidth = 80;
        const columnWidth = Math.min(20, Math.max(12, maxNameLength + 3));
        const columnsPerLine = Math.floor(terminalWidth / columnWidth);
        
        let result = '';
        for (let i = 0; i < sortedNodes.length; i += columnsPerLine) {
          const lineNodes = sortedNodes.slice(i, i + columnsPerLine);
          const line = lineNodes.map(node => {
            const displayName = node.type === 'folder' ? `${node.name}/` : node.name;
            const coloredName = node.type === 'folder' 
              ? `\x1b[34m${displayName}\x1b[0m` 
              : displayName;
            // Pad considering ANSI color codes don't count toward display width
            const actualDisplayLength = displayName.length;
            const padding = columnWidth - actualDisplayLength;
            return coloredName + ' '.repeat(Math.max(0, padding));
          }).join('');
          result += line.trimEnd() + '\n';
        }
        return result.trimEnd();
      }
    } catch (error) {
      throw new VFSError(`ls: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private cd(path: string): string {
    try {
      const targetPath = vfs.resolvePath(path, this.currentPath);
      
      if (!vfs.pathExists(targetPath)) {
        throw new VFSError(`no such file or directory: ${path}`);
      }
      
      if (!vfs.isFolder(targetPath)) {
        throw new VFSError(`not a directory: ${path}`);
      }
      
      this.currentPath = targetPath;
      vfs.setCurrentPath(targetPath);
      return '';
    } catch (error) {
      throw new VFSError(`cd: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private cat(filename: string): string {
    if (!filename) {
      throw new VFSError('cat: missing file operand');
    }

    try {
      const filePath = vfs.resolvePath(filename, this.currentPath);
      
      if (!vfs.pathExists(filePath)) {
        throw new VFSError(`no such file or directory: ${filename}`);
      }
      
      if (!vfs.isFile(filePath)) {
        throw new VFSError(`is a directory: ${filename}`);
      }
      
      return vfs.getFileContent(filePath);
    } catch (error) {
      throw new VFSError(`cat: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private mkdir(dirname: string): string {
    if (!dirname) {
      throw new VFSError('mkdir: missing operand');
    }

    try {
      const dirPath = vfs.resolvePath(dirname, this.currentPath);
      vfs.createFolder(dirPath);
      return '';
    } catch (error) {
      throw new VFSError(`mkdir: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private touch(filename: string): string {
    if (!filename) {
      throw new VFSError('touch: missing file operand');
    }

    try {
      const filePath = vfs.resolvePath(filename, this.currentPath);
      
      if (vfs.pathExists(filePath)) {
        // File exists, just update timestamp (simulated)
        const content = vfs.getFileContent(filePath);
        vfs.updateFile(filePath, content);
      } else {
        // Create new empty file
        vfs.createFile(filePath, '');
      }
      return '';
    } catch (error) {
      throw new VFSError(`touch: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private rm(filename: string): string {
    if (!filename) {
      throw new VFSError('rm: missing operand');
    }

    try {
      const filePath = vfs.resolvePath(filename, this.currentPath);
      vfs.deleteNode(filePath);
      return '';
    } catch (error) {
      throw new VFSError(`rm: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private mv(source: string, destination: string): string {
    if (!source || !destination) {
      throw new VFSError('mv: missing operand');
    }

    try {
      const sourcePath = vfs.resolvePath(source, this.currentPath);
      const destPath = vfs.resolvePath(destination, this.currentPath);
      vfs.moveNode(sourcePath, destPath);
      return '';
    } catch (error) {
      throw new VFSError(`mv: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private cp(source: string, destination: string): string {
    if (!source || !destination) {
      throw new VFSError('cp: missing operand');
    }

    try {
      const sourcePath = vfs.resolvePath(source, this.currentPath);
      const destPath = vfs.resolvePath(destination, this.currentPath);
      
      if (!vfs.pathExists(sourcePath)) {
        throw new VFSError(`no such file or directory: ${source}`);
      }
      
      if (!vfs.isFile(sourcePath)) {
        throw new VFSError('cp: directory copying not implemented yet');
      }
      
      const content = vfs.getFileContent(sourcePath);
      vfs.createFile(destPath, content);
      return '';
    } catch (error) {
      throw new VFSError(`cp: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private find(pattern: string): string {
    try {
      const results = vfs.findFiles(pattern, this.currentPath);
      return results.length > 0 ? results.join('\n') : '';
    } catch (error) {
      throw new VFSError(`find: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private echo(text: string): string {
    return text;
  }

  private tree(path: string): string {
    try {
      const targetPath = vfs.resolvePath(path, this.currentPath);
      const node = vfs.getNode(targetPath);
      
      if (!node) {
        throw new VFSError(`no such file or directory: ${path}`);
      }
      
      if (node.type !== 'folder') {
        return node.name;
      }
      
      const buildTree = (node: any, prefix: string = '', isLast: boolean = true): string => {
        const connector = isLast ? '└── ' : '├── ';
        const name = node.type === 'folder' ? `\x1b[34m${node.name}/\x1b[0m` : node.name;
        let result = prefix + connector + name + '\n';
        
        if (node.type === 'folder' && node.children) {
          const childPrefix = prefix + (isLast ? '    ' : '│   ');
          node.children.forEach((child: any, index: number) => {
            const isLastChild = index === node.children.length - 1;
            result += buildTree(child, childPrefix, isLastChild);
          });
        }
        
        return result;
      };
      
      return buildTree(node).trim();
    } catch (error) {
      throw new VFSError(`tree: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private du(): string {
    try {
      const stats = vfs.getStats();
      return `Directory: ${this.currentPath}\nFiles: ${stats.files}\nFolders: ${stats.folders}\nTotal size: ${this.formatBytes(stats.totalSize)}`;
    } catch (error) {
      throw new VFSError(`du: ${error instanceof VFSError ? error.message : 'Unknown error'}`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private showHistory(): string {
    return this.history.map((cmd, index) => `${index + 1}  ${cmd}`).join('\n');
  }

  private help(): string {
    return `Available commands:

File Operations:
  ls [dir]          List directory contents
  cd <dir>          Change directory
  pwd               Print working directory
  cat <file>        Display file contents
  touch <file>      Create empty file or update timestamp
  mkdir <dir>       Create directory
  rm <file>         Remove file or directory
  mv <src> <dst>    Move/rename file or directory
  cp <src> <dst>    Copy file
  
Search & Info:
  find <pattern>    Find files matching pattern (* wildcards)
  tree [dir]        Display directory tree
  du                Show disk usage statistics
  
Utility:
  echo <text>       Display text
  history           Show command history
  clear             Clear screen
  help              Show this help message

Examples:
  ls                List current directory
  cd Documents      Change to Documents folder
  cat README.md     Display contents of README.md
  find "*.txt"      Find all .txt files
  tree              Show directory tree structure`;
  }
}

export default TerminalShell;
