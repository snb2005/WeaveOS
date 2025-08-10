import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { vfsSyncService } from '../services/vfsSyncService';
import { useTheme } from '../hooks/useTheme';

class EnhancedTerminalShell {
  private terminal: XTerminal;
  private currentDirectory = '/';
  private commandHistory: string[] = [];
  private historyIndex = -1;
  private currentLine = '';
  private cursorPosition = 0;
  private environment: Record<string, string> = {
    'USER': 'user',
    'HOME': '/home/user',
    'PATH': '/bin:/usr/bin:/usr/local/bin',
    'SHELL': '/bin/bash',
    'PWD': '/',
  };

  constructor(terminal: XTerminal) {
    this.terminal = terminal;
    this.showWelcome();
    this.showPrompt();
  }

  private showWelcome() {
    this.terminal.writeln('\x1b[32m$\x1b[0m weave-os ready');
    this.terminal.writeln('');
    this.showPrompt();
  }

  private showPrompt() {
    const shortPath = this.currentDirectory === '/' ? '~' : this.currentDirectory.replace('/home/user', '~');
    this.terminal.write(`\x1b[36muser@weave\x1b[0m:\x1b[34m${shortPath}\x1b[0m$ `);
  }

  private async executeCommand(commandLine: string) {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      this.terminal.writeln('');
      this.showPrompt();
      return;
    }

    // Add to history
    if (this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
      this.commandHistory.push(trimmed);
    }
    this.historyIndex = -1;

    // Parse command with proper argument handling
    const args = this.parseCommand(trimmed);
    const [command, ...params] = args;
    
    this.terminal.writeln('');
    
    try {
      switch (command.toLowerCase()) {
        case 'help':
          this.showHelp();
          break;

        // Directory operations
        case 'ls':
        case 'dir':
          await this.listDirectory(params);
          break;

        case 'cd':
          await this.changeDirectory(params);
          break;

        case 'pwd':
          this.printWorkingDirectory();
          break;

        case 'mkdir':
          await this.makeDirectory(params);
          break;

        case 'rmdir':
          await this.removeDirectory(params);
          break;

        // File operations
        case 'touch':
          await this.createFile(params);
          break;

        case 'cat':
          await this.displayFile(params);
          break;

        case 'echo':
          await this.echoText(params, commandLine);
          break;

        case 'cp':
          await this.copyFile(params);
          break;

        case 'mv':
          await this.moveFile(params);
          break;

        case 'rm':
          await this.removeFile(params);
          break;

        case 'find':
          await this.findFiles(params);
          break;

        case 'grep':
          await this.grepText(params);
          break;

        case 'head':
          await this.headFile(params);
          break;

        case 'tail':
          await this.tailFile(params);
          break;

        case 'wc':
          await this.wordCount(params);
          break;

        case 'du':
          await this.diskUsage(params);
          break;

        case 'tree':
          await this.showTree(params);
          break;

        // System information
        case 'whoami':
          this.terminal.writeln('\x1b[37muser\x1b[0m');
          break;

        case 'date':
          this.terminal.writeln(`\x1b[37m${new Date().toString()}\x1b[0m`);
          break;

        case 'uname':
          this.showSystemInfo(params);
          break;

        case 'env':
          this.showEnvironment();
          break;

        case 'export':
          this.setEnvironmentVariable(params);
          break;

        // File editing
        case 'nano':
        case 'vim':
        case 'edit':
          this.editFile(params);
          break;

        // Process management
        case 'ps':
          this.showProcesses();
          break;

        case 'kill':
          this.terminal.writeln('\x1b[33mProcess management not implemented in this demo\x1b[0m');
          break;

        // Network simulation
        case 'ping':
          this.pingHost(params);
          break;

        case 'wget':
        case 'curl':
          this.downloadFile(params);
          break;

        // Text processing
        case 'sort':
          await this.sortText(params);
          break;

        case 'uniq':
          await this.uniqueLines(params);
          break;

        // Archive operations
        case 'tar':
          this.tarOperation(params);
          break;

        case 'zip':
          this.zipOperation(params);
          break;

        // File permissions (simulated)
        case 'chmod':
          this.changePermissions(params);
          break;

        case 'chown':
          this.changeOwner(params);
          break;

        // Utility commands
        case 'clear':
          this.terminal.clear();
          this.showWelcome();
          return;

        case 'history':
          this.showHistory();
          break;

        case 'which':
          this.whichCommand(params);
          break;

        case 'man':
          this.showManual(params);
          break;

        case 'exit':
          this.terminal.writeln('\x1b[33mGoodbye!\x1b[0m');
          setTimeout(() => {
            this.terminal.clear();
            this.showWelcome();
          }, 1000);
          return;

        default:
          this.terminal.writeln(`\x1b[31m${command}: command not found\x1b[0m`);
          this.terminal.writeln('\x1b[90mType "help" for available commands\x1b[0m');
      }
    } catch (error) {
      this.terminal.writeln(`\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
    }
    
    this.showPrompt();
  }

  private parseCommand(input: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      args.push(current);
    }
    
    return args;
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    
    if (path === '~') {
      return '/home/user';
    }
    
    if (path.startsWith('~/')) {
      return '/home/user' + path.slice(1);
    }
    
    if (path === '.') {
      return this.currentDirectory;
    }
    
    if (path === '..') {
      const parts = this.currentDirectory.split('/').filter(p => p);
      if (parts.length > 0) {
        parts.pop();
        return '/' + parts.join('/');
      }
      return '/';
    }
    
    if (path.startsWith('../')) {
      const parent = this.resolvePath('..');
      return this.resolvePath(parent + '/' + path.slice(3));
    }
    
    if (path.startsWith('./')) {
      path = path.slice(2);
    }
    
    return this.currentDirectory === '/' ? '/' + path : this.currentDirectory + '/' + path;
  }

  private showHelp() {
    this.terminal.writeln('\x1b[33mWeave OS Terminal - Available Commands:\x1b[0m');
    this.terminal.writeln('');
    this.terminal.writeln('\x1b[36mFile Operations:\x1b[0m');
    this.terminal.writeln('  \x1b[32mls\x1b[0m, \x1b[32mdir\x1b[0m         - List directory contents');
    this.terminal.writeln('  \x1b[32mcd\x1b[0m <path>          - Change directory');
    this.terminal.writeln('  \x1b[32mpwd\x1b[0m                 - Print working directory');
    this.terminal.writeln('  \x1b[32mtouch\x1b[0m <file>        - Create empty file');
    this.terminal.writeln('  \x1b[32mmkdir\x1b[0m <dir>         - Create directory');
    this.terminal.writeln('  \x1b[32mrm\x1b[0m <file>          - Remove file');
    this.terminal.writeln('  \x1b[32mrmdir\x1b[0m <dir>        - Remove directory');
    this.terminal.writeln('  \x1b[32mcp\x1b[0m <src> <dest>    - Copy file');
    this.terminal.writeln('  \x1b[32mmv\x1b[0m <src> <dest>    - Move/rename file');
    this.terminal.writeln('  \x1b[32mcat\x1b[0m <file>         - Display file contents');
    this.terminal.writeln('  \x1b[32mfind\x1b[0m <pattern>     - Find files');
    this.terminal.writeln('  \x1b[32mgrep\x1b[0m <pattern>     - Search text in files');
    this.terminal.writeln('  \x1b[32mtree\x1b[0m               - Show directory tree');
    this.terminal.writeln('');
    this.terminal.writeln('\x1b[36mText Processing:\x1b[0m');
    this.terminal.writeln('  \x1b[32mhead\x1b[0m <file>        - Show first lines');
    this.terminal.writeln('  \x1b[32mtail\x1b[0m <file>        - Show last lines');
    this.terminal.writeln('  \x1b[32mwc\x1b[0m <file>          - Word count');
    this.terminal.writeln('  \x1b[32msort\x1b[0m <file>        - Sort lines');
    this.terminal.writeln('  \x1b[32muniq\x1b[0m <file>        - Show unique lines');
    this.terminal.writeln('  \x1b[32mecho\x1b[0m <text>        - Display text');
    this.terminal.writeln('');
    this.terminal.writeln('\x1b[36mSystem:\x1b[0m');
    this.terminal.writeln('  \x1b[32mwhoami\x1b[0m             - Current user');
    this.terminal.writeln('  \x1b[32mdate\x1b[0m               - Current date/time');
    this.terminal.writeln('  \x1b[32muname\x1b[0m              - System information');
    this.terminal.writeln('  \x1b[32menv\x1b[0m                - Environment variables');
    this.terminal.writeln('  \x1b[32mhistory\x1b[0m            - Command history');
    this.terminal.writeln('  \x1b[32mclear\x1b[0m              - Clear terminal');
    this.terminal.writeln('  \x1b[32mexit\x1b[0m               - Exit terminal');
  }

  private async listDirectory(params: string[]) {
    const flags = params.filter(p => p.startsWith('-'));
    const paths = params.filter(p => !p.startsWith('-'));
    const targetPath = paths.length > 0 ? this.resolvePath(paths[0]) : this.currentDirectory;
    
    const longFormat = flags.includes('-l') || flags.includes('-la') || flags.includes('-al');
    
    try {
      const items = await vfsSyncService.listDir(targetPath);
      
      if (items.length === 0) {
        this.terminal.writeln('\x1b[90m(empty directory)\x1b[0m');
        return;
      }

      if (longFormat) {
        this.terminal.writeln('\x1b[36mtotal ' + items.length + '\x1b[0m');
        
        items.forEach((item: any) => {
          const permissions = item.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = item.type === 'file' ? String(item.size || 0).padStart(8) : '     dir';
          const date = new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit' 
          });
          
          const color = item.type === 'folder' ? '\x1b[34m' : '\x1b[37m';
          const name = item.type === 'folder' ? item.name + '/' : item.name;
          
          this.terminal.writeln(`${permissions} 1 user user ${size} ${date} ${color}${name}\x1b[0m`);
        });
      } else {
        const columns = Math.floor(80 / 20); // Approximate column width
        let currentColumn = 0;
        
        items.forEach((item: any, index: number) => {
          const color = item.type === 'folder' ? '\x1b[34m' : '\x1b[37m';
          const name = (item.type === 'folder' ? item.name + '/' : item.name).padEnd(18);
          
          this.terminal.write(`${color}${name}\x1b[0m  `);
          currentColumn++;
          
          if (currentColumn >= columns || index === items.length - 1) {
            this.terminal.writeln('');
            currentColumn = 0;
          }
        });
      }
    } catch (error) {
      this.terminal.writeln(`\x1b[31mls: cannot access '${targetPath}': No such file or directory\x1b[0m`);
    }
  }

  private async changeDirectory(params: string[]) {
    if (params.length === 0) {
      this.currentDirectory = '/home/user';
      this.environment['PWD'] = this.currentDirectory;
      return;
    }
    
    const targetPath = this.resolvePath(params[0]);
    
    try {
      await vfsSyncService.listDir(targetPath);
      this.currentDirectory = targetPath;
      this.environment['PWD'] = this.currentDirectory;
    } catch (error) {
      this.terminal.writeln(`\x1b[31mcd: no such file or directory: ${targetPath}\x1b[0m`);
    }
  }

  private printWorkingDirectory() {
    this.terminal.writeln(`\x1b[37m${this.currentDirectory}\x1b[0m`);
  }

  private async makeDirectory(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mmkdir: missing operand\x1b[0m');
      return;
    }
    
    const dirs = params.filter(p => !p.startsWith('-'));
    
    for (const dir of dirs) {
      const targetPath = this.resolvePath(dir);
      try {
        await vfsSyncService.createFolder(targetPath, 'terminal');
        this.terminal.writeln(`\x1b[32mDirectory created: ${targetPath}\x1b[0m`);
      } catch (error) {
        this.terminal.writeln(`\x1b[31mmkdir: cannot create directory '${targetPath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      }
    }
  }

  private async removeDirectory(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mrmdir: missing operand\x1b[0m');
      return;
    }
    
    for (const dir of params) {
      const targetPath = this.resolvePath(dir);
      try {
        await vfsSyncService.deleteNode(targetPath, 'terminal');
        this.terminal.writeln(`\x1b[32mDirectory removed: ${targetPath}\x1b[0m`);
      } catch (error) {
        this.terminal.writeln(`\x1b[31mrmdir: failed to remove '${targetPath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      }
    }
  }

  private async createFile(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mtouch: missing file operand\x1b[0m');
      return;
    }
    
    for (const file of params) {
      const targetPath = this.resolvePath(file);
      try {
        // Check if file already exists
        const exists = await vfsSyncService.exists(targetPath);
        if (exists) {
          // File exists, just update modified time (simulated)
          this.terminal.writeln(`\x1b[33mFile already exists: ${targetPath}\x1b[0m`);
        } else {
          // File doesn't exist, create it
          await vfsSyncService.createFile(targetPath, '', 'terminal');
          this.terminal.writeln(`\x1b[32mFile created: ${targetPath}\x1b[0m`);
        }
      } catch (error) {
        this.terminal.writeln(`\x1b[31mtouch: cannot create '${targetPath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      }
    }
  }

  private async displayFile(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mcat: missing file operand\x1b[0m');
      return;
    }
    
    for (const file of params) {
      const targetPath = this.resolvePath(file);
      try {
        const content = await vfsSyncService.getFileContent(targetPath);
        this.terminal.writeln(`\x1b[37m${content}\x1b[0m`);
      } catch (error) {
        this.terminal.writeln(`\x1b[31mcat: ${targetPath}: No such file or directory\x1b[0m`);
      }
    }
  }

  private async echoText(_params: string[], fullCommand: string) {
    // Extract the text after 'echo'
    const echoIndex = fullCommand.toLowerCase().indexOf('echo');
    const text = fullCommand.slice(echoIndex + 4).trim();
    
    // Check for output redirection
    if (text.includes('>')) {
      const parts = text.split('>');
      const content = parts[0].trim();
      const filePath = this.resolvePath(parts[1].trim());
      
      try {
        if (text.includes('>>')) {
          // Append mode
          try {
            const existing = await vfsSyncService.getFileContent(filePath);
            await vfsSyncService.updateFile(filePath, existing + content + '\n', 'terminal');
          } catch {
            await vfsSyncService.createFile(filePath, content + '\n', 'terminal');
          }
        } else {
          // Overwrite mode
          await vfsSyncService.createFile(filePath, content + '\n', 'terminal');
        }
        this.terminal.writeln(`\x1b[32mOutput written to: ${filePath}\x1b[0m`);
      } catch (error) {
        this.terminal.writeln(`\x1b[31mecho: cannot write to '${filePath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      }
    } else {
      // Regular echo
      this.terminal.writeln(`\x1b[37m${text}\x1b[0m`);
    }
  }

  private async copyFile(params: string[]) {
    if (params.length < 2) {
      this.terminal.writeln('\x1b[31mcp: missing file operand\x1b[0m');
      this.terminal.writeln('Usage: cp <source> <destination>');
      return;
    }
    
    const sourcePath = this.resolvePath(params[0]);
    const destPath = this.resolvePath(params[1]);
    
    try {
      const content = await vfsSyncService.getFileContent(sourcePath);
      await vfsSyncService.createFile(destPath, content, 'terminal');
      this.terminal.writeln(`\x1b[32mCopied: ${sourcePath} -> ${destPath}\x1b[0m`);
    } catch (error) {
      this.terminal.writeln(`\x1b[31mcp: cannot copy '${sourcePath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
    }
  }

  private async moveFile(params: string[]) {
    if (params.length < 2) {
      this.terminal.writeln('\x1b[31mmv: missing file operand\x1b[0m');
      this.terminal.writeln('Usage: mv <source> <destination>');
      return;
    }
    
    const sourcePath = this.resolvePath(params[0]);
    const destPath = this.resolvePath(params[1]);
    
    try {
      // Copy the file first
      const content = await vfsSyncService.getFileContent(sourcePath);
      await vfsSyncService.createFile(destPath, content, 'terminal');
      
      // Then delete the original
      await vfsSyncService.deleteNode(sourcePath, 'terminal');
      
      this.terminal.writeln(`\x1b[32mMoved: ${sourcePath} -> ${destPath}\x1b[0m`);
    } catch (error) {
      this.terminal.writeln(`\x1b[31mmv: cannot move '${sourcePath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
    }
  }

  private async removeFile(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mrm: missing operand\x1b[0m');
      return;
    }
    
    const force = params.includes('-f');
    const files = params.filter(p => !p.startsWith('-'));
    
    for (const file of files) {
      const targetPath = this.resolvePath(file);
      try {
        await vfsSyncService.deleteNode(targetPath, 'terminal');
        this.terminal.writeln(`\x1b[32mRemoved: ${targetPath}\x1b[0m`);
      } catch (error) {
        if (!force) {
          this.terminal.writeln(`\x1b[31mrm: cannot remove '${targetPath}': ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
        }
      }
    }
  }

  private async findFiles(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mfind: missing search pattern\x1b[0m');
      return;
    }
    
    const pattern = params[0];
    const searchPath = params.length > 1 ? this.resolvePath(params[1]) : this.currentDirectory;
    
    this.terminal.writeln(`\x1b[33mSearching for "${pattern}" in ${searchPath}...\x1b[0m`);
    
    // Simple pattern matching (could be enhanced)
    const findInDirectory = async (path: string, level: number = 0): Promise<void> => {
      try {
        const items = await vfsSyncService.listDir(path);
        for (const item of items) {
          const fullPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
          
          if (item.name.includes(pattern)) {
            this.terminal.writeln(`\x1b[37m${fullPath}\x1b[0m`);
          }
          
          if (item.type === 'folder' && level < 10) { // Prevent infinite recursion
            await findInDirectory(fullPath, level + 1);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };
    
    await findInDirectory(searchPath);
  }

  private async grepText(params: string[]) {
    if (params.length < 2) {
      this.terminal.writeln('\x1b[31mgrep: missing pattern or file\x1b[0m');
      this.terminal.writeln('Usage: grep <pattern> <file>');
      return;
    }
    
    const pattern = params[0];
    const filePath = this.resolvePath(params[1]);
    
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const lines = content.split('\n');
      let matchCount = 0;
      
      lines.forEach((line: any, index: any) => {
        if (line.includes(pattern)) {
          this.terminal.writeln(`\x1b[33m${index + 1}:\x1b[0m \x1b[37m${line}\x1b[0m`);
          matchCount++;
        }
      });
      
      if (matchCount === 0) {
        this.terminal.writeln('\x1b[90mNo matches found\x1b[0m');
      }
    } catch (error) {
      this.terminal.writeln(`\x1b[31mgrep: ${filePath}: No such file or directory\x1b[0m`);
    }
  }

  private async headFile(params: string[]) {
    const lines = 10; // Default head lines
    const filePath = params.length > 0 ? this.resolvePath(params[0]) : '';
    
    if (!filePath) {
      this.terminal.writeln('\x1b[31mhead: missing file operand\x1b[0m');
      return;
    }
    
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const fileLines = content.split('\n');
      const displayLines = fileLines.slice(0, lines);
      
      displayLines.forEach((line: any) => {
        this.terminal.writeln(`\x1b[37m${line}\x1b[0m`);
      });
    } catch (error) {
      this.terminal.writeln(`\x1b[31mhead: ${filePath}: No such file or directory\x1b[0m`);
    }
  }

  private async tailFile(params: string[]) {
    const lines = 10; // Default tail lines
    const filePath = params.length > 0 ? this.resolvePath(params[0]) : '';
    
    if (!filePath) {
      this.terminal.writeln('\x1b[31mtail: missing file operand\x1b[0m');
      return;
    }
    
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const fileLines = content.split('\n');
      const displayLines = fileLines.slice(-lines);
      
      displayLines.forEach((line: any) => {
        this.terminal.writeln(`\x1b[37m${line}\x1b[0m`);
      });
    } catch (error) {
      this.terminal.writeln(`\x1b[31mtail: ${filePath}: No such file or directory\x1b[0m`);
    }
  }

  private async wordCount(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mwc: missing file operand\x1b[0m');
      return;
    }
    
    const filePath = this.resolvePath(params[0]);
    
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const lines = content.split('\n').length;
      const words = content.split(/\s+/).filter((w: any) => w.length > 0).length;
      const chars = content.length;
      
      this.terminal.writeln(`\x1b[37m  ${lines}  ${words}  ${chars} ${filePath}\x1b[0m`);
    } catch (error) {
      this.terminal.writeln(`\x1b[31mwc: ${filePath}: No such file or directory\x1b[0m`);
    }
  }

  private async diskUsage(params: string[]) {
    const path = params.length > 0 ? this.resolvePath(params[0]) : this.currentDirectory;
    
    try {
      const items = await vfsSyncService.listDir(path);
      let totalSize = 0;
      
      items.forEach((item: any) => {
        if (item.type === 'file') {
          totalSize += item.size || 0;
        }
      });
      
      this.terminal.writeln(`\x1b[37m${totalSize} bytes used in ${path}\x1b[0m`);
    } catch (error) {
      this.terminal.writeln(`\x1b[31mdu: cannot access '${path}': No such file or directory\x1b[0m`);
    }
  }

  private async showTree(params: string[]) {
    const startPath = params.length > 0 ? this.resolvePath(params[0]) : this.currentDirectory;
    
    const showTreeRecursive = async (path: string, prefix: string = '', isLast: boolean = true): Promise<void> => {
      try {
        const items = await vfsSyncService.listDir(path);
        
        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          const isLastItem = index === items.length - 1;
          const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          
          const color = item.type === 'folder' ? '\x1b[34m' : '\x1b[37m';
          const name = item.type === 'folder' ? item.name + '/' : item.name;
          
          this.terminal.writeln(`${currentPrefix}${color}${name}\x1b[0m`);
          
          if (item.type === 'folder') {
            const fullPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
            await showTreeRecursive(fullPath, nextPrefix, isLastItem);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };
    
    this.terminal.writeln(`\x1b[36m${startPath}\x1b[0m`);
    await showTreeRecursive(startPath);
  }

  private showSystemInfo(params: string[]) {
    if (params.includes('-a')) {
      this.terminal.writeln('\x1b[37mWeave OS 1.0.0 weave x86_64 Browser/JavaScript\x1b[0m');
    } else {
      this.terminal.writeln('\x1b[37mWeave OS\x1b[0m');
    }
  }

  private showEnvironment() {
    Object.entries(this.environment).forEach(([key, value]) => {
      this.terminal.writeln(`\x1b[33m${key}\x1b[0m=\x1b[37m${value}\x1b[0m`);
    });
  }

  private setEnvironmentVariable(params: string[]) {
    if (params.length === 0) {
      this.showEnvironment();
      return;
    }
    
    params.forEach(param => {
      const [key, ...valueParts] = param.split('=');
      if (valueParts.length > 0) {
        this.environment[key] = valueParts.join('=');
        this.terminal.writeln(`\x1b[32mSet ${key}=${valueParts.join('=')}\x1b[0m`);
      }
    });
  }

  private editFile(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mEditor: missing file operand\x1b[0m');
      return;
    }
    
    const filePath = this.resolvePath(params[0]);
    this.terminal.writeln(`\x1b[33mOpening ${filePath} in text editor...\x1b[0m`);
    this.terminal.writeln('\x1b[90m(This would open the file in the Weave OS text editor)\x1b[0m');
  }

  private showProcesses() {
    this.terminal.writeln('\x1b[36m  PID  USER     CMD\x1b[0m');
    this.terminal.writeln('\x1b[37m    1  user     /weave/os/init\x1b[0m');
    this.terminal.writeln('\x1b[37m   42  user     /weave/os/terminal\x1b[0m');
    this.terminal.writeln('\x1b[37m  123  user     /weave/os/filemanager\x1b[0m');
  }

  private pingHost(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mping: missing hostname\x1b[0m');
      return;
    }
    
    const host = params[0];
    this.terminal.writeln(`\x1b[33mPING ${host} (simulated)\x1b[0m`);
    this.terminal.writeln(`\x1b[37m64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.123 ms\x1b[0m`);
    this.terminal.writeln(`\x1b[37m64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.089 ms\x1b[0m`);
    this.terminal.writeln('\x1b[32mPing simulation complete\x1b[0m');
  }

  private downloadFile(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mwget: missing URL\x1b[0m');
      return;
    }
    
    const url = params[0];
    this.terminal.writeln(`\x1b[33mDownloading ${url}...\x1b[0m`);
    this.terminal.writeln('\x1b[90m(Simulated download - not actually downloading)\x1b[0m');
    this.terminal.writeln('\x1b[32mDownload complete\x1b[0m');
  }

  private async sortText(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31msort: missing file operand\x1b[0m');
      return;
    }
    
    const filePath = this.resolvePath(params[0]);
    
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const lines = content.split('\n').sort();
      
      lines.forEach((line: any) => {
        this.terminal.writeln(`\x1b[37m${line}\x1b[0m`);
      });
    } catch (error) {
      this.terminal.writeln(`\x1b[31msort: ${filePath}: No such file or directory\x1b[0m`);
    }
  }

  private async uniqueLines(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31muniq: missing file operand\x1b[0m');
      return;
    }
    
    const filePath = this.resolvePath(params[0]);
    
    try {
      const content = await vfsSyncService.getFileContent(filePath);
      const lines = content.split('\n');
      const uniqueLines = [...new Set(lines)];
      
      uniqueLines.forEach((line: any) => {
        this.terminal.writeln(`\x1b[37m${line}\x1b[0m`);
      });
    } catch (error) {
      this.terminal.writeln(`\x1b[31muniq: ${filePath}: No such file or directory\x1b[0m`);
    }
  }

  private tarOperation(_params: string[]) {
    this.terminal.writeln('\x1b[33mtar: Archive operations not implemented in this demo\x1b[0m');
    this.terminal.writeln('\x1b[90mWould support: tar -czf archive.tar.gz files/\x1b[0m');
  }

  private zipOperation(_params: string[]) {
    this.terminal.writeln('\x1b[33mzip: Compression operations not implemented in this demo\x1b[0m');
    this.terminal.writeln('\x1b[90mWould support: zip archive.zip files/\x1b[0m');
  }

  private changePermissions(params: string[]) {
    if (params.length < 2) {
      this.terminal.writeln('\x1b[31mchmod: missing operand\x1b[0m');
      return;
    }
    
    const mode = params[0];
    const filePath = this.resolvePath(params[1]);
    this.terminal.writeln(`\x1b[32mPermissions changed: ${mode} ${filePath}\x1b[0m`);
    this.terminal.writeln('\x1b[90m(Simulated - file permissions not fully implemented)\x1b[0m');
  }

  private changeOwner(params: string[]) {
    if (params.length < 2) {
      this.terminal.writeln('\x1b[31mchown: missing operand\x1b[0m');
      return;
    }
    
    const owner = params[0];
    const filePath = this.resolvePath(params[1]);
    this.terminal.writeln(`\x1b[32mOwnership changed: ${owner} ${filePath}\x1b[0m`);
    this.terminal.writeln('\x1b[90m(Simulated - file ownership not fully implemented)\x1b[0m');
  }

  private showHistory() {
    this.commandHistory.forEach((cmd, index) => {
      this.terminal.writeln(`\x1b[33m${(index + 1).toString().padStart(4)}\x1b[0m  \x1b[37m${cmd}\x1b[0m`);
    });
  }

  private whichCommand(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mwhich: missing command\x1b[0m');
      return;
    }
    
    const command = params[0];
    const builtinCommands = [
      'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'touch', 'cat', 'echo', 'cp', 'mv', 'rm',
      'find', 'grep', 'head', 'tail', 'wc', 'du', 'tree', 'sort', 'uniq', 'help'
    ];
    
    if (builtinCommands.includes(command)) {
      this.terminal.writeln(`\x1b[37m/bin/${command}\x1b[0m`);
    } else {
      this.terminal.writeln(`\x1b[31mwhich: no ${command} in (/bin:/usr/bin)\x1b[0m`);
    }
  }

  private showManual(params: string[]) {
    if (params.length === 0) {
      this.terminal.writeln('\x1b[31mman: missing command\x1b[0m');
      return;
    }
    
    const command = params[0];
    this.terminal.writeln(`\x1b[33mNAME\x1b[0m`);
    this.terminal.writeln(`     ${command} - Weave OS command`);
    this.terminal.writeln('');
    this.terminal.writeln('\x1b[33mDESCRIPTION\x1b[0m');
    this.terminal.writeln(`     Manual page for ${command} command in Weave OS.`);
    this.terminal.writeln('     Type "help" for a list of all available commands.');
  }

  handleKey(key: string, domEvent: KeyboardEvent) {
    const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

    if (domEvent.key === 'Enter') {
      this.executeCommand(this.currentLine);
      this.currentLine = '';
      this.cursorPosition = 0;
    } else if (domEvent.key === 'Backspace') {
      if (this.cursorPosition > 0) {
        this.currentLine = this.currentLine.slice(0, this.cursorPosition - 1) + this.currentLine.slice(this.cursorPosition);
        this.cursorPosition--;
        this.terminal.write('\b \b');
      }
    } else if (domEvent.key === 'ArrowUp') {
      if (this.commandHistory.length > 0) {
        if (this.historyIndex === -1) {
          this.historyIndex = this.commandHistory.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex--;
        }
        this.replaceCurrentLine(this.commandHistory[this.historyIndex]);
      }
    } else if (domEvent.key === 'ArrowDown') {
      if (this.historyIndex !== -1) {
        this.historyIndex++;
        if (this.historyIndex >= this.commandHistory.length) {
          this.historyIndex = -1;
          this.replaceCurrentLine('');
        } else {
          this.replaceCurrentLine(this.commandHistory[this.historyIndex]);
        }
      }
    } else if (domEvent.key === 'ArrowLeft') {
      if (this.cursorPosition > 0) {
        this.cursorPosition--;
        this.terminal.write('\x1b[D');
      }
    } else if (domEvent.key === 'ArrowRight') {
      if (this.cursorPosition < this.currentLine.length) {
        this.cursorPosition++;
        this.terminal.write('\x1b[C');
      }
    } else if (domEvent.key === 'Home') {
      while (this.cursorPosition > 0) {
        this.cursorPosition--;
        this.terminal.write('\x1b[D');
      }
    } else if (domEvent.key === 'End') {
      while (this.cursorPosition < this.currentLine.length) {
        this.cursorPosition++;
        this.terminal.write('\x1b[C');
      }
    } else if (domEvent.key === 'Tab') {
      // Simple tab completion
      domEvent.preventDefault();
      this.handleTabCompletion();
    } else if (printable && key.length === 1) {
      this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
      this.cursorPosition++;
      this.terminal.write(key);
    }
  }

  private async handleTabCompletion() {
    const words = this.currentLine.split(' ');
    const currentWord = words[words.length - 1];
    
    if (words.length === 1) {
      // Complete command
      const commands = [
        'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'touch', 'cat', 'echo', 'cp', 'mv', 'rm',
        'find', 'grep', 'head', 'tail', 'wc', 'du', 'tree', 'sort', 'uniq', 'help',
        'whoami', 'date', 'uname', 'env', 'export', 'history', 'which', 'man', 'clear', 'exit'
      ];
      
      const matches = commands.filter(cmd => cmd.startsWith(currentWord));
      if (matches.length === 1) {
        const completion = matches[0].slice(currentWord.length);
        this.currentLine += completion + ' ';
        this.cursorPosition = this.currentLine.length;
        this.terminal.write(completion + ' ');
      }
    } else {
      // Complete file/directory names
      try {
        const items = await vfsSyncService.listDir(this.currentDirectory);
        const matches = items.filter((item: any) => item.name.startsWith(currentWord));
        
        if (matches.length === 1) {
          const completion = matches[0].name.slice(currentWord.length);
          const suffix = matches[0].type === 'folder' ? '/' : ' ';
          this.currentLine += completion + suffix;
          this.cursorPosition = this.currentLine.length;
          this.terminal.write(completion + suffix);
        }
      } catch (error) {
        // Ignore completion errors
      }
    }
  }

  private replaceCurrentLine(newLine: string) {
    // Clear current line more efficiently
    this.terminal.write('\r\x1b[K'); // Move to beginning and clear line
    this.showPrompt(); // Rewrite prompt
    this.terminal.write(newLine); // Write new content
    
    this.currentLine = newLine;
    this.cursorPosition = newLine.length;
  }
}

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const shellRef = useRef<EnhancedTerminalShell | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { isLight } = useTheme();

  // Define theme colors based on current theme
  const getTerminalTheme = (isLight: boolean) => ({
    background: isLight ? '#ffffff' : '#000000',
    foreground: isLight ? '#000000' : '#ffffff',
    cursor: isLight ? '#000000' : '#ffffff',
    cursorAccent: isLight ? '#ffffff' : '#000000',
    selectionBackground: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
    black: isLight ? '#000000' : '#000000',
    red: isLight ? '#dc2626' : '#ff6b6b',
    green: isLight ? '#16a34a' : '#51cf66',
    yellow: isLight ? '#ca8a04' : '#ffd93d',
    blue: isLight ? '#2563eb' : '#74c0fc',
    magenta: isLight ? '#dc2626' : '#f06292',
    cyan: isLight ? '#0891b2' : '#4dd0e1',
    white: isLight ? '#6b7280' : '#ffffff',
    brightBlack: isLight ? '#374151' : '#6c757d',
    brightRed: isLight ? '#ef4444' : '#ff8a80',
    brightGreen: isLight ? '#22c55e' : '#69f0ae',
    brightYellow: isLight ? '#eab308' : '#ffff8d',
    brightBlue: isLight ? '#3b82f6' : '#82b1ff',
    brightMagenta: isLight ? '#ef4444' : '#ff80ab',
    brightCyan: isLight ? '#06b6d4' : '#84ffff',
    brightWhite: isLight ? '#000000' : '#ffffff',
  });

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      // Initialize xterm.js terminal with enhanced configuration
      const terminal = new XTerminal({
        theme: getTerminalTheme(isLight),
        fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 10000,
        tabStopWidth: 4,
        allowTransparency: false,
        convertEol: true,
        scrollOnUserInput: true,
        fastScrollModifier: 'shift',
        macOptionIsMeta: true,
      });

      terminal.open(terminalRef.current);
      
      // Initialize enhanced shell with VFS integration
      const shell = new EnhancedTerminalShell(terminal);
      
      // Handle key input
      terminal.onKey(({ key, domEvent }) => {
        shell.handleKey(key, domEvent);
      });

      xtermRef.current = terminal;
      shellRef.current = shell;

      // Set up resize observer to handle window size changes
      const handleResize = () => {
        if (terminalRef.current && xtermRef.current) {
          const container = terminalRef.current;
          const rect = container.getBoundingClientRect();
          
          const availableWidth = rect.width - 16;
          const availableHeight = rect.height - 16;
          
          const charWidth = 9;
          const charHeight = 17;
          
          const cols = Math.floor(availableWidth / charWidth);
          const rows = Math.floor(availableHeight / charHeight);
          
          if (cols > 0 && rows > 0 && (cols !== terminal.cols || rows !== terminal.rows)) {
            terminal.resize(cols, rows);
          }
        }
      };

      resizeObserverRef.current = new ResizeObserver(() => {
        setTimeout(handleResize, 50);
      });

      if (terminalRef.current) {
        resizeObserverRef.current.observe(terminalRef.current);
      }

      setTimeout(handleResize, 100);
      terminal.focus();
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        shellRef.current = null;
      }
    };
  }, [isLight]);

  // Update terminal theme when theme changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(isLight);
    }
  }, [isLight, getTerminalTheme]);

  useEffect(() => {
    const handleFocus = () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: isLight ? '#ffffff' : '#000000',
        overflow: 'hidden',
      }}
      className="scrollbar-thin"
    >
      <div 
        ref={terminalRef}
        style={{
          width: '100%',
          height: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          overflow: 'auto',
          position: 'relative',
        }}
        className="scrollbar-thin"
      />
    </div>
  );
};

export default Terminal;
