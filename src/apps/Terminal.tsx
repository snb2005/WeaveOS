import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { TerminalShell } from '../filesystem/terminalShell';
import { vfs } from '../filesystem/vfs';
import '@xterm/xterm/css/xterm.css';

// XTerm wrapper class to handle terminal UI integration
class XTermWrapper {
  private terminal: XTerminal;
  private shell: TerminalShell;
  private currentLine = '';
  private cursorPosition = 0;

  constructor(terminal: XTerminal) {
    this.terminal = terminal;
    this.shell = new TerminalShell();
    this.showWelcome();
    this.showPrompt();
  }

  private showWelcome() {
    this.terminal.writeln('\x1b[32m┌─────────────────────────────────────┐\x1b[0m');
    this.terminal.writeln('\x1b[32m│        Weave OS Terminal            │\x1b[0m');
    this.terminal.writeln('\x1b[32m│   Virtual File System Enabled      │\x1b[0m');
    this.terminal.writeln('\x1b[32m└─────────────────────────────────────┘\x1b[0m');
    this.terminal.writeln('\x1b[90mType "help" to see available commands\x1b[0m');
    this.terminal.writeln('');
  }

  private showPrompt() {
    const currentPath = this.shell.getCurrentPath();
    const displayPath = currentPath === '/' ? '~' : currentPath.replace('/home/user', '~');
    this.terminal.write(`\x1b[36muser@weave\x1b[0m:\x1b[34m${displayPath}\x1b[0m$ `);
  }

  private executeCommand(commandLine: string) {
    const trimmedCommand = commandLine.trim();
    this.terminal.writeln('');
    
    if (!trimmedCommand) {
      this.showPrompt();
      return;
    }

    // Add to shell history
    this.shell.addToHistory(trimmedCommand);

    try {
      const output = this.shell.executeCommand(trimmedCommand);
      
      // Handle special commands
      if (output === 'CLEAR_SCREEN') {
        this.terminal.clear();
        this.showWelcome();
        this.showPrompt();
        return;
      }
      
      if (output) {
        // Process output with colors for better readability
        const coloredOutput = this.colorizeOutput(output);
        this.terminal.writeln(coloredOutput);
      }
    } catch (error) {
      this.terminal.writeln(`\x1b[31m${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
    }
    
    this.showPrompt();
  }

  private colorizeOutput(output: string): string {
    // Add colors to common patterns in output
    return output
      .replace(/^(total \d+)$/gm, '\x1b[90m$1\x1b[0m') // Gray for totals
      .replace(/^(d.+)$/gm, '\x1b[34m$1\x1b[0m') // Blue for directories in ls -l
      .replace(/^(-rw.+)$/gm, '\x1b[37m$1\x1b[0m') // White for files in ls -l
      .replace(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/g, '\x1b[36m$1\x1b[0m') // Cyan for dates
      .replace(/(\/[^\s]*)/g, '\x1b[33m$1\x1b[0m'); // Yellow for paths
  }

  private replaceCurrentLine(newLine: string) {
    // Clear current line by moving cursor back and overwriting
    const lineLength = this.currentLine.length;
    for (let i = 0; i < lineLength; i++) {
      this.terminal.write('\b \b');
    }
    
    this.currentLine = newLine;
    this.cursorPosition = newLine.length;
    this.terminal.write(newLine);
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
      // Navigate command history
      const historyCommand = this.shell.navigateHistory('up');
      if (historyCommand) {
        this.replaceCurrentLine(historyCommand);
      }
      domEvent.preventDefault();
    } else if (domEvent.key === 'ArrowDown') {
      // Navigate command history
      const historyCommand = this.shell.navigateHistory('down');
      this.replaceCurrentLine(historyCommand);
      domEvent.preventDefault();
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
      // Tab completion (basic implementation)
      this.handleTabCompletion();
      domEvent.preventDefault();
    } else if (printable && key.length === 1) {
      this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
      this.cursorPosition++;
      this.terminal.write(key);
    }
  }

  private handleTabCompletion() {
    const parts = this.currentLine.split(' ');
    const lastPart = parts[parts.length - 1];
    
    if (parts.length === 1) {
      // Command completion
      const commands = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'mv', 'cp', 'find', 'tree', 'echo', 'help', 'clear', 'history'];
      const matches = commands.filter(cmd => cmd.startsWith(lastPart));
      
      if (matches.length === 1) {
        const completion = matches[0].slice(lastPart.length);
        this.currentLine += completion + ' ';
        this.cursorPosition = this.currentLine.length;
        this.terminal.write(completion + ' ');
      } else if (matches.length > 1) {
        this.terminal.writeln('');
        this.terminal.writeln(matches.join('  '));
        this.showPrompt();
        this.terminal.write(this.currentLine);
      }
    } else {
      // File/directory completion
      try {
        const currentDir = this.shell.getCurrentPath();
        const nodes = vfs.listDir(currentDir);
        const matches = nodes.filter((node: any) => node.name.startsWith(lastPart));
        
        if (matches.length === 1) {
          const completion = matches[0].name.slice(lastPart.length);
          const suffix = matches[0].type === 'folder' ? '/' : ' ';
          this.currentLine += completion + suffix;
          this.cursorPosition = this.currentLine.length;
          this.terminal.write(completion + suffix);
        } else if (matches.length > 1) {
          this.terminal.writeln('');
          const formatted = matches.map((node: any) => 
            node.type === 'folder' ? `\x1b[34m${node.name}/\x1b[0m` : node.name
          ).join('  ');
          this.terminal.writeln(formatted);
          this.showPrompt();
          this.terminal.write(this.currentLine);
        }
      } catch (error) {
        // Ignore tab completion errors
      }
    }
  }
}

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const shellRef = useRef<XTermWrapper | null>(null);

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      // Initialize xterm.js terminal
      const terminal = new XTerminal({
        theme: {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#ffffff',
          cursorAccent: '#000000',
          selectionBackground: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#ff6b6b',
          green: '#51cf66',
          yellow: '#ffd93d',
          blue: '#74c0fc',
          magenta: '#f06292',
          cyan: '#4dd0e1',
          white: '#ffffff',
          brightBlack: '#6c757d',
          brightRed: '#ff8a80',
          brightGreen: '#69f0ae',
          brightYellow: '#ffff8d',
          brightBlue: '#82b1ff',
          brightMagenta: '#ff80ab',
          brightCyan: '#84ffff',
          brightWhite: '#ffffff',
        },
        fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        tabStopWidth: 4,
      });

      terminal.open(terminalRef.current);
      
      // Initialize shell wrapper with VFS integration
      const shell = new XTermWrapper(terminal);
      
      // Handle key input
      terminal.onKey(({ key, domEvent }) => {
        shell.handleKey(key, domEvent);
      });

      xtermRef.current = terminal;
      shellRef.current = shell;

      // Focus the terminal
      terminal.focus();
    }

    // Cleanup on unmount
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        shellRef.current = null;
      }
    };
  }, []);

  // Focus terminal when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    };

    // Focus on mount and when window becomes active
    handleFocus();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-black">
      <div 
        ref={terminalRef}
        className="h-full w-full"
        style={{ padding: '8px' }}
      />
    </div>
  );
};

export default Terminal;
