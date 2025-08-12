/**
 * Simple Git-like interface for the Code Editor
 * This provides basic version control functionality without the complexity of full Git
 */

export interface SimpleGitConfig {
  name: string;
  email: string;
}

export interface SimpleCommit {
  id: string;
  message: string;
  author: SimpleGitConfig;
  timestamp: number;
  files: Record<string, string>; // filepath -> content
}

export interface SimpleGitState {
  initialized: boolean;
  commits: SimpleCommit[];
  currentBranch: string;
  stagedFiles: Record<string, string>;
  workingDirectory: Record<string, string>;
}

class SimpleGit {
  private state: SimpleGitState = {
    initialized: false,
    commits: [],
    currentBranch: 'main',
    stagedFiles: {},
    workingDirectory: {}
  };

  private storageKey = 'weave-simple-git';

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load git state:', error);
    }
  }

  private saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save git state:', error);
    }
  }

  init(): void {
    this.state.initialized = true;
    this.state.commits = [];
    this.state.currentBranch = 'main';
    this.state.stagedFiles = {};
    this.state.workingDirectory = {};
    this.saveState();
  }

  isInitialized(): boolean {
    return this.state.initialized;
  }

  add(filepath: string, content: string): void {
    if (!this.state.initialized) {
      throw new Error('Repository not initialized');
    }
    this.state.stagedFiles[filepath] = content;
    this.saveState();
  }

  addAll(files: Record<string, string>): void {
    if (!this.state.initialized) {
      throw new Error('Repository not initialized');
    }
    this.state.stagedFiles = { ...this.state.stagedFiles, ...files };
    this.saveState();
  }

  commit(message: string, author: SimpleGitConfig): string {
    if (!this.state.initialized) {
      throw new Error('Repository not initialized');
    }

    if (Object.keys(this.state.stagedFiles).length === 0) {
      throw new Error('No files staged for commit');
    }

    const commitId = this.generateCommitId();
    const commit: SimpleCommit = {
      id: commitId,
      message,
      author,
      timestamp: Date.now(),
      files: { ...this.state.stagedFiles }
    };

    this.state.commits.push(commit);
    this.state.workingDirectory = { ...this.state.workingDirectory, ...this.state.stagedFiles };
    this.state.stagedFiles = {};
    this.saveState();

    return commitId;
  }

  getCommits(): SimpleCommit[] {
    return [...this.state.commits].reverse(); // Most recent first
  }

  getStatus(): {
    staged: string[];
    modified: string[];
    untracked: string[];
  } {
    const staged = Object.keys(this.state.stagedFiles);
    const modified: string[] = [];
    const untracked: string[] = [];

    // For simplicity, we'll just return staged files
    // In a real implementation, we'd compare working directory with last commit
    return { staged, modified, untracked };
  }

  getCurrentBranch(): string {
    return this.state.currentBranch;
  }

  getLastCommit(): SimpleCommit | null {
    return this.state.commits.length > 0 
      ? this.state.commits[this.state.commits.length - 1] 
      : null;
  }

  private generateCommitId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  reset(): void {
    this.state = {
      initialized: false,
      commits: [],
      currentBranch: 'main',
      stagedFiles: {},
      workingDirectory: {}
    };
    this.saveState();
  }
}

export const simpleGit = new SimpleGit();
