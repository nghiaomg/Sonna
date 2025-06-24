/// <reference types="vite/client" />
/// <reference types="node" />

import type { ElectronAPI } from './types/index';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
