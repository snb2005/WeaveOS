import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

// Virtual file system for the terminal
const VIRTUAL_FS = {
  '/': {
    'Desktop': { type: 'directory' },
    'Documents': { type: 'directory' },
    'Downloads': { type: 'directory' },
    'Pictures': { type: 'directory' },
    'Music': { type: 'directory' },
    'Videos': { type: 'directory' },
    'README.md': { type: 'file', content: 'Welcome to Weave OS!' },
    'hello.txt': { type: 'file', content: 'Hello from the terminal!' },
    'package.json': { type: 'file', content: '{\n  "name": "weave-os",\n  "version": "1.0.0"\n}' },
  }
};

class TerminalShell {
  private terminal: XTerminal;
  private currentDirectory = '/';
  private commandHistory: string[] = [];
  private historyIndex = -1;
  private currentLine = '';
  private cursorPosition = 0;

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
    this.terminal.write('\x1b[36muser@weave\x1b[0m:\x1b[34m~\x1b[0m$ ');
  }

  private executeCommand(commandLine: string) {
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

    const [command, ...args] = trimmed.split(' ');
    
    this.terminal.writeln('');
    
    switch (command.toLowerCase()) {
      case 'help':
        this.terminal.writeln('\x1b[33mAvailable commands:\x1b[0m');
        this.terminal.writeln('  \x1b[32mhelp\x1b[0m     - Show this help message');
        this.terminal.writeln('  \x1b[32mls\x1b[0m       - List directory contents');
        this.terminal.writeln('  \x1b[32mpwd\x1b[0m      - Print working directory');
        this.terminal.writeln('  \x1b[32mwhoami\x1b[0m   - Print current user');
        this.terminal.writeln('  \x1b[32mdate\x1b[0m     - Show current date and time');
        this.terminal.writeln('  \x1b[32mecho\x1b[0m     - Echo the input text');
        this.terminal.writeln('  \x1b[32mcat\x1b[0m      - Display file contents');
        this.terminal.writeln('  \x1b[32muname\x1b[0m    - System information');
        this.terminal.writeln('  \x1b[32mclear\x1b[0m    - Clear terminal');
        this.terminal.writeln('  \x1b[32mexit\x1b[0m     - Exit terminal');
        break;

      case 'ls':
        const items = Object.entries((VIRTUAL_FS as any)[this.currentDirectory] || {});
        if (items.length === 0) {
          this.terminal.writeln('\x1b[90m(empty directory)\x1b[0m');
        } else {
          items.forEach(([name, info]: [string, any]) => {
            if (info.type === 'directory') {
              this.terminal.writeln(`\x1b[34m${name}/\x1b[0m`);
            } else {
              this.terminal.writeln(`\x1b[37m${name}\x1b[0m`);
            }
          });
        }
        break;

      case 'pwd':
        this.terminal.writeln(`\x1b[37m${this.currentDirectory === '/' ? '/home/user' : this.currentDirectory}\x1b[0m`);
        break;

      case 'whoami':
        this.terminal.writeln('\x1b[37muser\x1b[0m');
        break;

      case 'date':
        this.terminal.writeln(`\x1b[37m${new Date().toString()}\x1b[0m`);
        break;

      case 'echo':
        this.terminal.writeln(`\x1b[37m${args.join(' ')}\x1b[0m`);
        break;

      case 'cat':
        if (args.length === 0) {
          this.terminal.writeln('\x1b[31mcat: missing file operand\x1b[0m');
        } else {
          const filename = args[0];
          const file = (VIRTUAL_FS as any)[this.currentDirectory]?.[filename];
          if (!file) {
            this.terminal.writeln(`\x1b[31mcat: ${filename}: No such file or directory\x1b[0m`);
          } else if (file.type === 'directory') {
            this.terminal.writeln(`\x1b[31mcat: ${filename}: Is a directory\x1b[0m`);
          } else {
            this.terminal.writeln(`\x1b[37m${file.content}\x1b[0m`);
          }
        }
        break;

      case 'uname':
        if (args.includes('-a')) {
          this.terminal.writeln('\x1b[37mWeave OS 1.0.0 weave x86_64 GNU/Linux\x1b[0m');
        } else {
          this.terminal.writeln('\x1b[37mWeave OS\x1b[0m');
        }
        break;

      case 'clear':
        this.terminal.clear();
        this.showWelcome();
        this.showPrompt();
        return;

      case 'exit':
        this.terminal.writeln('\x1b[33mGoodbye!\x1b[0m');
        // Could emit an event here to close the window
        setTimeout(() => {
          this.terminal.clear();
          this.showWelcome();
          this.showPrompt();
        }, 1000);
        return;

      default:
        this.terminal.writeln(`\x1b[31m${command}: command not found\x1b[0m`);
        this.terminal.writeln('\x1b[90mType "help" for available commands\x1b[0m');
    }
    
    this.showPrompt();
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
    } else if (printable && key.length === 1) {
      this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
      this.cursorPosition++;
      this.terminal.write(key);
    }
  }

  private replaceCurrentLine(newLine: string) {
    // Clear current line more efficiently
    this.terminal.write('\r\x1b[K'); // Move to beginning and clear line
    this.terminal.write('\x1b[36muser@weave\x1b[0m:\x1b[34m~\x1b[0m$ '); // Rewrite prompt
    this.terminal.write(newLine); // Write new content
    
    this.currentLine = newLine;
    this.cursorPosition = newLine.length;
  }
}

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const shellRef = useRef<TerminalShell | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      // Initialize xterm.js terminal with better configuration
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
        fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 10000, // Increased scrollback buffer
        tabStopWidth: 4,
        allowTransparency: false,
        convertEol: true, // Convert line endings
        scrollOnUserInput: true, // Auto-scroll on input
        fastScrollModifier: 'shift', // Enable fast scroll with shift
        macOptionIsMeta: true, // Better Mac support
      });

      terminal.open(terminalRef.current);
      
      // Initialize shell
      const shell = new TerminalShell(terminal);
      
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
          
          // Calculate available space (subtract padding)
          const availableWidth = rect.width - 16; // 8px padding on each side
          const availableHeight = rect.height - 16; // 8px padding on top and bottom
          
          // Calculate terminal dimensions based on character size
          const charWidth = 9; // Approximate character width for 14px font
          const charHeight = 17; // Approximate line height for 14px font with 1.2 line height
          
          const cols = Math.floor(availableWidth / charWidth);
          const rows = Math.floor(availableHeight / charHeight);
          
          // Only resize if dimensions are valid and different
          if (cols > 0 && rows > 0 && (cols !== terminal.cols || rows !== terminal.rows)) {
            console.log('🔧 Resizing terminal:', { cols, rows, availableWidth, availableHeight });
            terminal.resize(cols, rows);
          }
        }
      };

      // Set up ResizeObserver for responsive resizing
      resizeObserverRef.current = new ResizeObserver(() => {
        // Debounce resize calls
        setTimeout(handleResize, 50);
      });

      if (terminalRef.current) {
        resizeObserverRef.current.observe(terminalRef.current);
      }

      // Initial resize
      setTimeout(handleResize, 100);

      // Focus the terminal
      terminal.focus();
    }

    // Cleanup on unmount
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

  // Handle window resize events
  useEffect(() => {
    const handleWindowResize = () => {
      if (xtermRef.current && terminalRef.current) {
        setTimeout(() => {
          const container = terminalRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const availableWidth = rect.width - 16;
            const availableHeight = rect.height - 16;
            
            const charWidth = 9;
            const charHeight = 17;
            
            const cols = Math.floor(availableWidth / charWidth);
            const rows = Math.floor(availableHeight / charHeight);
            
            if (cols > 0 && rows > 0 && xtermRef.current) {
              xtermRef.current.resize(cols, rows);
            }
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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
          overflow: 'auto', // Enable scrolling
          position: 'relative',
        }}
        className="scrollbar-thin"
      />
    </div>
  );
};

export default Terminal;
