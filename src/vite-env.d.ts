import { ElectronAPI } from '../electron/preload'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
  interface ImportMetaEnv {
    readonly VITE_OPENROUTER_API_KEY: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
