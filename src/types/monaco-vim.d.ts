declare module 'monaco-vim' {
  export function initVimMode(editor: any, statusbarNode?: HTMLElement): {
    dispose(): void;
  };
}
