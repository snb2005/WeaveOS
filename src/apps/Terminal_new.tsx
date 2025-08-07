import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { TerminalShell } from '../filesystem/terminalShell';
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
    const trimmed = commandLine.trim();
    this.terminal.writeln('');
    
    if (!trimmed) {
      this.showPrompt();
      return;
    }

    try {
      const output = this.shell.executeCommand(trimmed);
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
      .replace(/^(d.+)$/gm, '\x1b[34m$1\x1b[0m') // Blue for directories
      .replace(/^(-rw.+)$/gm, '\x1b[37m$1\x1b[0m') // White for files
      .replace(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/g, '\x1b[36m$1\x1b[0m') // Cyan for dates
      .replace(/(\/[^\s]*)/g, '\x1b[33m$1\x1b[0m'); // Yellow for paths
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
      // Simple tab completion could be added here
      domEvent.preventDefault();
    } else if (printable && key.length === 1) {
      this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
      this.cursorPosition++;
      this.terminal.write(key);
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
