import { useEffect, useCallback } from 'react'
import { useAppStore } from './store/appStore'
import { useEditorStore } from './store/editorStore'
import Sidebar from './components/Sidebar'
import ActivityBar from './components/ActivityBar'
import Topbar from './components/Topbar'
import MonacoPane from './components/MonacoPane'
import EditorTabs from './components/EditorTabs'
import RightSidebar from './components/RightSidebar'
import Statusbar from './components/Statusbar'
import CommandPalette from './components/CommandPalette'
import SettingsModal from './components/SettingsModal'
import Terminal from './components/Terminal'
import Onboarding from './components/Onboarding'
import { ShieldAlert } from 'lucide-react'

function App() {
  const onboarded = useAppStore((state) => state.onboarded)
  const { 
    leftSidebarOpen, 
    rightSidebarOpen, 
    commandPaletteOpen, 
    settingsOpen,
    setCommandPaletteOpen,
    setSettingsOpen,
    toggleTerminal,
    workspacePath,
    trustedWorkspaces,
    trustWorkspace,
    setWorkspace,
    setFiles,
    setGitStatus
  } = useAppStore()
  
  const { tabs, activeTabId, getActiveTab } = useEditorStore()
  
  // Load workspace from storage on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      const { workspacePath: storedPath, workspaceName: storedName } = useAppStore.getState()
      if (storedPath) {
        await loadProjectFiles(storedPath)
        await loadGitStatus(storedPath)
      }
    }
    loadWorkspace()
  }, [])
  
  // Menu event listeners
  useEffect(() => {
    const cleanups: (() => void)[] = []
    
    cleanups.push(
      window.electronAPI.onMenuOpenFolder(() => {
        handleOpenFolder()
      })
    )
    
    cleanups.push(
      window.electronAPI.onMenuSave(() => {
        handleSave()
      })
    )
    
    cleanups.push(
      window.electronAPI.onMenuCommandPalette(() => {
        setCommandPaletteOpen(true)
      })
    )
    
    cleanups.push(
      window.electronAPI.onMenuAskAI(() => {
        useAppStore.getState().setRightSidebarTab('chat')
        useAppStore.getState().toggleRightSidebar()
      })
    )
    
    cleanups.push(
      window.electronAPI.onMenuToggleTerminal?.(() => {
        toggleTerminal()
      }) || (() => {})
    )
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey
      
      if (modifier && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      
      if (modifier && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      
      if (modifier && e.key === 'o') {
        e.preventDefault()
        handleOpenFolder()
      }
      
      if (modifier && e.key === '`') {
        e.preventDefault()
        toggleTerminal()
      }
    }
    
    // Refresh git status on window focus
    const handleFocus = () => {
      const { workspacePath } = useAppStore.getState()
      if (workspacePath) loadGitStatus(workspacePath)
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('keydown', handleKeyDown)
    
    cleanups.push(() => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('keydown', handleKeyDown)
    })
    
    return () => {
      cleanups.forEach(cleanup => cleanup())
    }
  }, [])
  
  const loadProjectFiles = async (path: string) => {
    try {
      const result = await window.electronAPI.listFiles(path)
      if (result.success && result.items) {
        const files = result.items.map((item: any) => ({
          name: item.name,
          path: item.path,
          isDirectory: item.isDirectory,
          children: item.isDirectory ? [] : undefined,
          isExpanded: false
        }))
        setFiles(files)
      }
    } catch (error) {
      console.error('Failed to load project files:', error)
    }
  }
  
  const loadGitStatus = async (path: string) => {
    try {
      const result = await window.electronAPI.gitStatus(path)
      if (result.success && !!result.isRepo) {
        setGitStatus({
          current: result.current || null,
          tracking: result.tracking || null,
          staged: result.staged || [],
          modified: result.modified || [],
          created: result.created || [],
          deleted: result.deleted || [],
          not_added: result.not_added || [],
          ahead: result.ahead || 0,
          behind: result.behind || 0,
          isRepo: !!result.isRepo
        })
      }
    } catch (error) {
      console.error('Failed to load git status:', error)
    }
  }
  
  const handleOpenFolder = useCallback(async () => {
    try {
      const path = await window.electronAPI.openFolder()
      if (path) {
        const name = path.split(/[/\\]/).pop() || 'Project'
        setWorkspace(path, name)
        await loadProjectFiles(path)
        await loadGitStatus(path)
        
        // Save to database
        await window.electronAPI.dbRun(
          'INSERT OR REPLACE INTO projects (name, path, last_opened) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [name, path]
        )
      }
    } catch (error) {
      console.error('Failed to open folder:', error)
    }
  }, [])
  
  const handleSave = useCallback(async () => {
    const activeTab = getActiveTab()
    const { workspacePath } = useAppStore.getState()
    if (activeTab && activeTab.isDirty) {
      try {
        await window.electronAPI.writeFile(activeTab.path, activeTab.content)
        useEditorStore.getState().updateTabDirty(activeTab.id, false)
        if (workspacePath) loadGitStatus(workspacePath)
      } catch (error) {
        console.error('Failed to save file:', error)
      }
    }
  }, [getActiveTab])
  
  const showTrustDialog = workspacePath && !trustedWorkspaces.includes(workspacePath)
  
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden selection:bg-primary/30">
      {!onboarded && <Onboarding />}
      
      {/* Workspace Trust Dialog */}
      {showTrustDialog && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-panel border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-4 text-warning mb-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-text">Workspace Trust</h2>
            </div>
            
            <p className="text-muted text-sm mb-6 leading-relaxed">
              Do you trust the authors of the files in this folder?<br/><br/>
              <span className="text-text font-medium bg-background px-2 py-1 rounded">{workspacePath}</span><br/><br/>
              Code navigation and AI features may execute code automatically. You should only trust folders from sources you recognize.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => useAppStore.getState().setWorkspace(null, null)}
                className="px-4 py-2 text-sm text-muted hover:text-text bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
              >
                No, Don't Trust
              </button>
              <button 
                onClick={() => trustWorkspace(workspacePath)}
                className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary-hover shadow-glow-primary rounded-lg transition-all"
              >
                Yes, I Trust the Authors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <Topbar onOpenFolder={handleOpenFolder} onSave={handleSave} />
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />
        
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <Sidebar onOpenFolder={handleOpenFolder} />
        )}
        
        {/* Center area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor tabs */}
          <EditorTabs />
          
          {/* Monaco Editor */}
          <div className="flex-1 relative min-h-0 min-w-0 overflow-hidden">
            <div className="absolute inset-0">
              <MonacoPane />
            </div>
          </div>
          
          {/* Bottom Panel (Terminal / Problems) */}
          {(useAppStore.getState().terminalOpen || useAppStore.getState().problemsOpen) && <Terminal />}
        </div>
        
        {/* Right Sidebar */}
        {rightSidebarOpen && <RightSidebar />}
      </div>
      
      {/* Statusbar */}
      <Statusbar />
      
      {/* Command Palette */}
      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}
      
      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}

export default App