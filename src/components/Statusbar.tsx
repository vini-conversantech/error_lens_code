import { useAppStore } from '../store/appStore'
import { useEditorStore } from '../store/editorStore'
import { useChatStore } from '../store/chatStore'
import { checkOllamaConnection } from '../lib/aiClient'
import { useEffect, useState } from 'react'
import { GitBranch, Circle, Sparkles, Bell, AlertCircle, AlertTriangle } from 'lucide-react'

export default function Statusbar() {
  const { gitStatus, workspacePath } = useAppStore()
  const { tabs, activeTabId, cursorPosition } = useEditorStore()
  const { isStreaming } = useChatStore()
  const [ollamaConnected, setOllamaConnected] = useState(false)
  
  const activeTab = tabs.find(t => t.id === activeTabId)
  
  // Check Ollama connection on mount
  useEffect(() => {
    checkOllamaConnection().then(setOllamaConnected)
  }, [])

  // Derive language display name
  const getLanguageDisplay = (lang: string) => {
    const displayMap: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      typescriptreact: 'TypeScript JSX',
      javascriptreact: 'JavaScript JSX',
      tsx: 'TypeScript JSX',
      jsx: 'JavaScript JSX',
      python: 'Python',
      dart: 'Dart',
      rust: 'Rust',
      go: 'Go',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      csharp: 'C#',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
      shell: 'Shell Script',
      sql: 'SQL',
      xml: 'XML',
      plaintext: 'Plain Text',
    }
    return displayMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
  }
  
  return (
    <div className="h-[22px] bg-[#0D1117] border-t border-border flex items-center px-3 text-[10px] text-muted select-none">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Git branch */}
        {gitStatus?.isRepo && (
          <div className="flex items-center gap-1 hover:text-text cursor-pointer transition-colors">
            <GitBranch className="w-3 h-3" />
            <span>{gitStatus.current}</span>
            {gitStatus.ahead > 0 && (
              <span className="text-success">↑{gitStatus.ahead}</span>
            )}
            {gitStatus.behind > 0 && (
              <span className="text-warning">↓{gitStatus.behind}</span>
            )}
          </div>
        )}
        
        {/* Errors/Warnings count */}
        <div className="flex items-center gap-2 hover:text-text cursor-pointer transition-colors">
          <div className="flex items-center gap-0.5">
            <AlertCircle className="w-3 h-3" />
            <span>1</span>
          </div>
          <div className="flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>1</span>
          </div>
        </div>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Cursor position */}
        {activeTab && (
          <span className="hover:text-text cursor-pointer transition-colors">
            Ln {cursorPosition?.line || 1}, Col {cursorPosition?.column || 1}
          </span>
        )}
        
        {/* Indentation */}
        {activeTab && (
          <span className="hover:text-text cursor-pointer transition-colors">
            Spaces: 2
          </span>
        )}
        
        {/* Encoding */}
        {activeTab && (
          <span className="hover:text-text cursor-pointer transition-colors">
            UTF-8
          </span>
        )}
        
        {/* Line ending */}
        {activeTab && (
          <span className="hover:text-text cursor-pointer transition-colors">
            LF
          </span>
        )}
        
        {/* Language */}
        {activeTab && (
          <span className="hover:text-text cursor-pointer transition-colors">
            {'{}'} {getLanguageDisplay(activeTab.language)}
          </span>
        )}

        {/* Divider */}
        <div className="w-px h-3 bg-white/10" />

        {/* AI Status */}
        <div className="flex items-center gap-1 hover:text-text cursor-pointer transition-colors">
          <Sparkles className={`w-3 h-3 ${isStreaming ? 'text-primary animate-pulse' : ''}`} />
          <span>{isStreaming ? 'AI Thinking...' : 'Antigravity'}</span>
        </div>

        {/* Settings shortcut */}
        <span className="hover:text-text cursor-pointer transition-colors" onClick={() => useAppStore.getState().setSettingsOpen(true)}>
          Settings
        </span>
        
        {/* Ollama status */}
        <div className="flex items-center gap-1">
          <Circle className={`w-2 h-2 ${ollamaConnected ? 'fill-success text-success' : 'fill-muted text-muted'}`} />
          <span>{ollamaConnected ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notification bell */}
        <Bell className="w-3 h-3 hover:text-text cursor-pointer transition-colors" />
      </div>
    </div>
  )
}