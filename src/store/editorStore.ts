import { create } from 'zustand'
import { Tab } from './appStore'

interface EditorState {
  tabs: Tab[]
  activeTabId: string | null
  selectedText: string
  cursorPosition: { line: number; column: number }
  
  // Actions
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  updateTabDirty: (id: string, isDirty: boolean) => void
  setSelectedText: (text: string) => void
  setCursorPosition: (line: number, column: number) => void
  getActiveTab: () => Tab | null
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  selectedText: '',
  cursorPosition: { line: 1, column: 1 },
  
  addTab: (tab) => set((state) => {
    const existing = state.tabs.find(t => t.path === tab.path)
    if (existing) {
      return { activeTabId: existing.id }
    }
    return {
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }
  }),
  
  removeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== id)
    let newActiveId = state.activeTabId
    
    if (state.activeTabId === id) {
      const idx = state.tabs.findIndex(t => t.id === id)
      newActiveId = newTabs[idx]?.id || newTabs[idx - 1]?.id || null
    }
    
    return { tabs: newTabs, activeTabId: newActiveId }
  }),
  
  setActiveTab: (id) => set({ activeTabId: id }),
  
  updateTabContent: (id, content) => set((state) => ({
    tabs: state.tabs.map(t => 
      t.id === id ? { ...t, content, isDirty: true } : t
    )
  })),
  
  updateTabDirty: (id, isDirty) => set((state) => ({
    tabs: state.tabs.map(t => 
      t.id === id ? { ...t, isDirty } : t
    )
  })),
  
  setSelectedText: (text) => set({ selectedText: text }),
  
  setCursorPosition: (line, column) => set({ cursorPosition: { line, column } }),
  
  getActiveTab: () => {
    const state = get()
    return state.tabs.find(t => t.id === state.activeTabId) || null
  }
}))

// Language detection based on file extension
export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'markdown': 'markdown',
    'py': 'python',
    'rb': 'ruby',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'dart': 'dart',
    'groovy': 'groovy',
    'gradle': 'groovy',
    'properties': 'properties',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'svg': 'xml',
    'toml': 'toml',
    'ini': 'ini',
    'conf': 'ini',
    'dockerfile': 'dockerfile',
    'graphql': 'graphql',
    'vue': 'vue',
    'svelte': 'svelte',
  }
  
  return languageMap[ext] || 'plaintext'
}