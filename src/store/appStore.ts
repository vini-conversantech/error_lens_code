import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileItem[]
  isExpanded?: boolean
}

export interface Tab {
  id: string
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
  type: 'text' | 'image' | 'video'
}

export interface GitStatus {
  current: string | null
  tracking: string | null
  staged: string[]
  modified: string[]
  created: string[]
  deleted: string[]
  not_added: string[]
  ahead: number
  behind: number
  isRepo: boolean
}

interface AppState {
  // Workspace
  workspacePath: string | null
  workspaceName: string | null
  files: FileItem[]
  
  // UI State
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  rightSidebarTab: 'chat' | 'errors' | 'changes' | 'context'
  terminalOpen: boolean
  problemsOpen: boolean
  commandPaletteOpen: boolean
  settingsOpen: boolean
  onboarded: boolean
  trustedWorkspaces: string[]
  
  // Git
  gitStatus: GitStatus | null
  
  // Actions
  setWorkspace: (path: string | null, name: string | null) => void
  setFiles: (files: FileItem[] | ((files: FileItem[]) => FileItem[])) => void
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setRightSidebarTab: (tab: 'chat' | 'errors' | 'changes' | 'context') => void
  toggleTerminal: () => void
  toggleProblemsPanel: () => void
  setProblemsOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setOnboarded: (onboarded: boolean) => void
  trustWorkspace: (path: string) => void
  setGitStatus: (status: GitStatus | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      workspacePath: null,
      workspaceName: null,
      files: [],
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      rightSidebarTab: 'chat',
      terminalOpen: false,
      problemsOpen: true,
      commandPaletteOpen: false,
      settingsOpen: false,
      onboarded: false,
      trustedWorkspaces: [],
      gitStatus: null,
      
      // Actions
      setWorkspace: (path, name) => set({ workspacePath: path, workspaceName: name }),
      setFiles: (files) => set((state) => ({ 
        files: typeof files === 'function' ? files(state.files) : files 
      })),
      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
      toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
      toggleProblemsPanel: () => set((state) => ({ problemsOpen: !state.problemsOpen })),
      setProblemsOpen: (open) => set({ problemsOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setOnboarded: (onboarded) => set({ onboarded }),
      trustWorkspace: (path) => set((state) => ({ 
        trustedWorkspaces: state.trustedWorkspaces.includes(path) 
          ? state.trustedWorkspaces 
          : [...state.trustedWorkspaces, path] 
      })),
      setGitStatus: (status) => set({ gitStatus: status }),
    }),
    {
      name: 'errorlens-app-storage',
      partialize: (state) => ({
        workspacePath: state.workspacePath,
        workspaceName: state.workspaceName,
        onboarded: state.onboarded,
        trustedWorkspaces: state.trustedWorkspaces,
      }),
    }
  )
)