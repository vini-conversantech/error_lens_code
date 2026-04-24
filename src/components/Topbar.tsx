import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useEditorStore } from '../store/editorStore'
import { useChatStore } from '../store/chatStore'
import { sendChatMessage } from '../lib/aiClient'
import { getProviderSettings, AI_MODELS, AIProvider } from '../lib/ai'
import {
  FolderOpen,
  Save,
  Play,
  GitBranch,
  Sparkles,
  Bug,
  ChevronDown,
  Search,
  Settings,
  User,
  PanelLeft,
  PanelBottom,
  PanelRight,
  MonitorPlay,
  X
} from 'lucide-react'

interface TopbarProps {
  onOpenFolder: () => void
  onSave: () => void
}

export default function Topbar({ onOpenFolder, onSave }: TopbarProps) {
  const { workspaceName, setRightSidebarTab, toggleRightSidebar, leftSidebarOpen, rightSidebarOpen, terminalOpen, problemsOpen, gitStatus } = useAppStore()
  const { getActiveTab } = useEditorStore()
  const { createSession, addMessage, setStreaming, setStreamingContent, isStreaming } = useChatStore()
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [providerSettings, setProviderSettings] = useState<{
    provider: AIProvider
    model: string
    apiKey: string | null
  }>({ provider: 'openai', model: 'gpt-4o', apiKey: null })

  // Load provider settings on mount
  useState(() => {
    getProviderSettings().then(setProviderSettings)
  })

  const handleRun = () => {
    // TODO: Implement run command
    console.log('Run clicked')
  }

  const handleCommit = async () => {
    if (!gitStatus?.isRepo) return

    const message = prompt('Enter commit message:')
    if (message) {
      const workspacePath = useAppStore.getState().workspacePath
      if (workspacePath) {
        await window.electronAPI.gitCommit(workspacePath, message)
      }
    }
  }

  const handleAskAI = async () => {
    const activeTab = getActiveTab()
    if (!activeTab) {
      setRightSidebarTab('chat')
      toggleRightSidebar()
      return
    }

    // Create or get session
    let session = useChatStore.getState().getCurrentSession()
    if (!session) {
      session = createSession()
    }

    // Add user message
    const userMessage = addMessage(session.id, {
      role: 'user',
      content: `Help me with this ${activeTab.language} code:\n\n\`\`\`${activeTab.language}\n${activeTab.content}\n\`\`\``
    })

    setStreaming(true)
    setRightSidebarTab('chat')
    toggleRightSidebar()

    try {
      const messages = [
        { role: 'system' as const, content: 'You are ErrorLens Code, an AI coding assistant.' },
        { role: 'user' as const, content: userMessage.content }
      ]

      await sendChatMessage(
        providerSettings.provider,
        providerSettings.model,
        messages,
        (chunk) => {
          setStreamingContent(useChatStore.getState().streamingContent + chunk.delta)
        }
      )

      // Add AI response
      const finalContent = useChatStore.getState().streamingContent
      addMessage(session.id, {
        role: 'assistant',
        content: finalContent
      })

      setStreamingContent('')
    } catch (error) {
      console.error('AI error:', error)
      addMessage(session.id, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleFixError = () => {
    setRightSidebarTab('errors')
    toggleRightSidebar()
  }

  const currentModel = AI_MODELS.find(m => m.id === providerSettings.model)

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className={`h-12 bg-panel border-b border-border flex items-center px-4 gap-2 select-none`} style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Mac Traffic Light Spacer */}
      {isMac && <div className="w-16 h-full" />}

      {/* Left section */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={onOpenFolder}
          className="btn-ghost flex items-center gap-2"
          title="Open Folder (Ctrl+O)"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm">{workspaceName || 'Open Folder'}</span>
        </button>
      </div>

      {/* Center section - Search / Title (can be added later) */}
      <div className="flex-1 flex items-center justify-center gap-2" style={{ WebkitAppRegion: 'drag' } as any}>
        {/* Blank space for dragging or title */}
      </div>

      {/* Right section - App controls */}
      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>


        <div className="flex items-center gap-1.5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => useAppStore.getState().toggleLeftSidebar()}
            className={`p-1 hover:bg-white/10 rounded transition-colors ${leftSidebarOpen ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            <PanelLeft className="w-[1.1rem] h-[1.1rem]" />
          </button>
          <button
            onClick={() => {
              if (problemsOpen || terminalOpen) {
                if (problemsOpen) useAppStore.getState().toggleProblemsPanel()
                if (terminalOpen) useAppStore.getState().toggleTerminal()
              } else {
                useAppStore.getState().toggleTerminal()
              }
            }}
            className={`p-1 hover:bg-white/10 rounded transition-colors ${(problemsOpen || terminalOpen) ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            <PanelBottom className="w-[1.1rem] h-[1.1rem]" />
          </button>
          <button
            onClick={() => useAppStore.getState().toggleRightSidebar()}
            className={`p-1 hover:bg-white/10 rounded transition-colors ${rightSidebarOpen ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            <PanelRight className="w-[1.1rem] h-[1.1rem]" />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-3">
          <button
            onClick={() => useAppStore.getState().setCommandPaletteOpen(true)}
            className="text-muted hover:text-white transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button className="text-muted hover:text-white transition-colors">
            <MonitorPlay className="w-4 h-4" />
          </button>
          <button
            onClick={() => useAppStore.getState().setSettingsOpen(true)}
            className="text-muted hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User profile bubble */}
          <button className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ml-1 object-cover overflow-hidden">
            <span className="text-xs text-white font-bold leading-none">R</span>
          </button>
        </div>
      </div>


    </div>
  )
}