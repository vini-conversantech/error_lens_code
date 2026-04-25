import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { useEditorStore } from '../store/editorStore'
import { useChatStore } from '../store/chatStore'
import { Search, File, Command, Sparkles, Bug, Settings, GitBranch } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  category: string
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { setRightSidebarTab, toggleRightSidebar, setSettingsOpen, setSettingsTab, workspacePath } = useAppStore()
  const { tabs, addTab } = useEditorStore()
  const { createSession } = useChatStore()
  
  const commands: CommandItem[] = [
    // AI Commands
    {
      id: 'ask-ai',
      label: 'Ask AI',
      icon: Sparkles,
      action: () => {
        setRightSidebarTab('chat')
        toggleRightSidebar()
        onClose()
      },
      category: 'AI'
    },
    {
      id: 'fix-error',
      label: 'Fix Current Error',
      icon: Bug,
      action: () => {
        setRightSidebarTab('errors')
        toggleRightSidebar()
        onClose()
      },
      category: 'AI'
    },
    {
      id: 'explain-code',
      label: 'Explain Selected Code',
      icon: Sparkles,
      action: () => {
        const activeTab = useEditorStore.getState().getActiveTab()
        if (activeTab) {
          const session = createSession()
          useChatStore.getState().addMessage(session.id, {
            role: 'user',
            content: `Explain this ${activeTab.language} code:\n\n\`\`\`${activeTab.language}\n${useEditorStore.getState().selectedText || activeTab.content.slice(0, 500)}\n\`\`\``
          })
          setRightSidebarTab('chat')
          toggleRightSidebar()
        }
        onClose()
      },
      category: 'AI'
    },
    
    // File Commands
    {
      id: 'open-folder',
      label: 'Open Folder',
      icon: File,
      action: async () => {
        const path = await window.electronAPI.openFolder()
        if (path) {
          const name = path.split(/[/\\]/).pop() || 'Project'
          useAppStore.getState().setWorkspace(path, name)
          const result = await window.electronAPI.listFiles(path)
          if (result.success && result.items) {
            useAppStore.getState().setFiles(result.items.map((item: any) => ({
              name: item.name,
              path: item.path,
              isDirectory: item.isDirectory,
              children: item.isDirectory ? [] : undefined,
              isExpanded: false
            })))
          }
        }
        onClose()
      },
      category: 'File'
    },
    {
      id: 'save-file',
      label: 'Save File',
      icon: File,
      action: async () => {
        const activeTab = useEditorStore.getState().getActiveTab()
        if (activeTab && activeTab.isDirty) {
          await window.electronAPI.writeFile(activeTab.path, activeTab.content)
          useEditorStore.getState().updateTabDirty(activeTab.id, false)
        }
        onClose()
      },
      category: 'File'
    },
    
    // Git Commands
    {
      id: 'git-status',
      label: 'Git Status',
      icon: GitBranch,
      action: () => {
        setRightSidebarTab('changes')
        toggleRightSidebar()
        onClose()
      },
      category: 'Git'
    },
    
    // View Commands
    {
      id: 'toggle-sidebar',
      label: 'Toggle Left Sidebar',
      icon: Command,
      action: () => {
        useAppStore.getState().toggleLeftSidebar()
        onClose()
      },
      category: 'View'
    },
    {
      id: 'toggle-chat',
      label: 'Toggle Chat Panel',
      icon: Command,
      action: () => {
        setRightSidebarTab('chat')
        toggleRightSidebar()
        onClose()
      },
      category: 'View'
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      icon: Settings,
      action: () => {
        setSettingsTab('customizations')
        setSettingsOpen(true)
        onClose()
      },
      category: 'View'
    },
  ]
  
  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )
  
  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands, selectedIndex, onClose])
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  let flatIndex = 0
  
  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Type a command or search..."
              className="w-full pl-11 pr-4 py-3 bg-transparent text-text placeholder:text-muted focus:outline-none text-lg"
            />
          </div>
        </div>
        
        {/* Commands list */}
        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-medium text-muted uppercase tracking-wider">
                {category}
              </div>
              {cmds.map((cmd) => {
                const currentIndex = flatIndex++
                return (
                  <div
                    key={cmd.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      currentIndex === selectedIndex 
                        ? 'bg-primary/20 text-primary' 
                        : 'hover:bg-white/5 text-text'
                    }`}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                  >
                    <cmd.icon className="w-4 h-4" />
                    <span className="flex-1">{cmd.label}</span>
                    {currentIndex === selectedIndex && (
                      <span className="text-xs text-muted">Enter</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="p-4 text-center text-muted">
              No commands found
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}