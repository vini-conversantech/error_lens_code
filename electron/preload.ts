import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File System
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  readMedia: (filePath: string) => ipcRenderer.invoke('fs:readMedia', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  listFiles: (dirPath: string) => ipcRenderer.invoke('fs:listFiles', dirPath),
  createFile: (filePath: string) => ipcRenderer.invoke('fs:createFile', filePath),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('fs:createDirectory', dirPath),
  delete: (targetPath: string) => ipcRenderer.invoke('fs:delete', targetPath),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  exists: (targetPath: string) => ipcRenderer.invoke('fs:exists', targetPath),
  stat: (targetPath: string) => ipcRenderer.invoke('fs:stat', targetPath),

  // Git
  gitStatus: (repoPath: string) => ipcRenderer.invoke('git:status', repoPath),
  gitBranch: (repoPath: string) => ipcRenderer.invoke('git:branch', repoPath),
  gitDiff: (repoPath: string, filePath?: string) => ipcRenderer.invoke('git:diff', repoPath, filePath),
  gitCommit: (repoPath: string, message: string) => ipcRenderer.invoke('git:commit', repoPath, message),
  gitLog: (repoPath: string, maxCount?: number) => ipcRenderer.invoke('git:log', repoPath, maxCount),

  // Database
  dbQuery: (query: string, params?: any[]) => ipcRenderer.invoke('db:query', query, params),
  dbRun: (query: string, params?: any[]) => ipcRenderer.invoke('db:run', query, params),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  executeCommand: (cwd: string, command: string) => ipcRenderer.invoke('terminal:execute', cwd, command),

  // App
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Window
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Menu events
  onMenuOpenFolder: (callback: () => void) => {
    ipcRenderer.on('menu:open-folder', callback)
    return () => ipcRenderer.removeListener('menu:open-folder', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu:save', callback)
    return () => ipcRenderer.removeListener('menu:save', callback)
  },
  onMenuAskAI: (callback: () => void) => {
    ipcRenderer.on('menu:ask-ai', callback)
    return () => ipcRenderer.removeListener('menu:ask-ai', callback)
  },
  onMenuFixError: (callback: () => void) => {
    ipcRenderer.on('menu:fix-error', callback)
    return () => ipcRenderer.removeListener('menu:fix-error', callback)
  },
  onMenuCommandPalette: (callback: () => void) => {
    ipcRenderer.on('menu:command-palette', callback)
    return () => ipcRenderer.removeListener('menu:command-palette', callback)
  },
  onMenuQuickOpen: (callback: () => void) => {
    ipcRenderer.on('menu:quick-open', callback)
    return () => ipcRenderer.removeListener('menu:quick-open', callback)
  },
  onMenuToggleTerminal: (callback: () => void) => {
    ipcRenderer.on('menu:toggle-terminal', callback)
    return () => ipcRenderer.removeListener('menu:toggle-terminal', callback)
  }
})

// Type definitions for the exposed API
export interface ElectronAPI {
  // File System
  openFolder: () => Promise<string | null>
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  readMedia: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  listFiles: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean }>; error?: string }>
  createFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>
  delete: (targetPath: string) => Promise<{ success: boolean; error?: string }>
  rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>
  exists: (targetPath: string) => Promise<boolean>
  stat: (targetPath: string) => Promise<{ success: boolean; isDirectory?: boolean; size?: number; mtime?: string; error?: string }>

  // Git
  gitStatus: (repoPath: string) => Promise<{
    success: boolean
    isRepo?: boolean
    current?: string
    tracking?: string
    staged?: string[]
    modified?: string[]
    created?: string[]
    deleted?: string[]
    not_added?: string[]
    ahead?: number
    behind?: number
    error?: string
  }>
  gitBranch: (repoPath: string) => Promise<{ success: boolean; current?: string; all?: string[]; error?: string }>
  gitDiff: (repoPath: string, filePath?: string) => Promise<{ success: boolean; diff?: string; error?: string }>
  gitCommit: (repoPath: string, message: string) => Promise<{ success: boolean; result?: any; error?: string }>
  gitLog: (repoPath: string, maxCount?: number) => Promise<{ success: boolean; log?: any[]; error?: string }>

  // Database
  dbQuery: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>
  dbRun: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>

  // Settings
  getSetting: (key: string) => Promise<{ success: boolean; value?: string; error?: string }>
  setSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>

  // Shell
  openExternal: (url: string) => Promise<void>
  showItemInFolder: (filePath: string) => Promise<void>
  executeCommand: (cwd: string, command: string) => Promise<{ success: boolean; output?: string; error?: string }>

  // App
  getPath: (name: string) => Promise<string>
  getVersion: () => Promise<string>

  // Window
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>

  // Menu events
  onMenuOpenFolder: (callback: () => void) => () => void
  onMenuSave: (callback: () => void) => () => void
  onMenuAskAI: (callback: () => void) => () => void
  onMenuFixError: (callback: () => void) => () => void
  onMenuCommandPalette: (callback: () => void) => () => void
  onMenuQuickOpen: (callback: () => void) => () => void
  onMenuToggleTerminal: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}