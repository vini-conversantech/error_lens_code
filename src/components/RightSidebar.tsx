import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useChatStore, ChatMessage } from '../store/chatStore'
import { useEditorStore } from '../store/editorStore'
import { sendChatMessage } from '../lib/aiClient'
import { getProviderSettings, AIProvider } from '../lib/ai'
import { copyToClipboard } from '../lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  MessageSquare, 
  AlertCircle, 
  GitPullRequest, 
  FileText,
  Send,
  Copy,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  X,
  ChevronRight,
  Plus
} from 'lucide-react'

export default function RightSidebar() {
  const { rightSidebarTab, setRightSidebarTab, gitStatus, workspacePath } = useAppStore()
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.max(250, Math.min(800, startWidth.current + delta))
      setSidebarWidth(newWidth)
    }
    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = 'default'
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    e.preventDefault()
  }
  
  const tabs = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'errors' as const, icon: AlertCircle, label: 'Errors' },
    { id: 'changes' as const, icon: GitPullRequest, label: 'Changes' },
    { id: 'context' as const, icon: FileText, label: 'Context' },
  ]
  
  return (
    <div className="relative h-full bg-panel border-l border-border flex flex-col shrink-0" style={{ width: sidebarWidth }}>
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50 transform -translate-x-1/2" 
        onMouseDown={handleMouseDown}
      />
      
      <div className="flex border-b border-white/5 bg-[#0a0d12]/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setRightSidebarTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-all relative ${
              rightSidebarTab === tab.id 
                ? 'text-primary' 
                : 'text-muted hover:text-text'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${rightSidebarTab === tab.id ? 'stroke-[2.5]' : ''}`} />
            {rightSidebarTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary shadow-glow-primary" />
            )}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {rightSidebarTab === 'chat' && <ChatPanel />}
        {rightSidebarTab === 'errors' && <ErrorPanel />}
        {rightSidebarTab === 'changes' && <ChangesPanel />}
        {rightSidebarTab === 'context' && <ContextPanel />}
      </div>
    </div>
  )
}

function ChatPanel() {
  const { createSession, addMessage, getCurrentSession, isStreaming, setStreaming, setStreamingContent } = useChatStore()
  const { getActiveTab } = useEditorStore()
  const [input, setInput] = useState('')
  const [providerSettings, setProviderSettings] = useState<{
    provider: AIProvider
    model: string
    apiKey: string | null
  }>({ provider: 'openai', model: 'gpt-4o', apiKey: null })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    getProviderSettings().then(setProviderSettings)
  }, [])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [getCurrentSession()?.messages])
  
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return
    
    let session = getCurrentSession()
    if (!session) session = createSession()
    
    const userMessage = addMessage(session.id, {
      role: 'user',
      content: input.trim()
    })
    
    setInput('')
    setStreaming(true)
    
    try {
      const activeTab = getActiveTab()
      const messages = [
        { role: 'system' as const, content: 'You are ErrorLens Code, an AI coding assistant. Be concise, practical, and helpful.' },
        ...session.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage.content }
      ]
      
      if (activeTab) {
        messages[0] = {
          role: 'system',
          content: `You are ErrorLens Code, an AI coding assistant. The current file is ${activeTab.name} (${activeTab.language}).\n\nCurrent file content:\n\`\`\`${activeTab.language}\n${activeTab.content.slice(0, 2000)}\n\`\`\``
        }
      }
      
      await sendChatMessage(
        providerSettings.provider,
        providerSettings.model,
        messages,
        (chunk) => {
          setStreamingContent(useChatStore.getState().streamingContent + chunk.delta)
        }
      )
      
      const finalContent = useChatStore.getState().streamingContent
      addMessage(session.id, {
        role: 'assistant',
        content: finalContent
      })
      
      setStreamingContent('')
    } catch (error) {
      addMessage(session.id, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`
      })
    } finally {
      setStreaming(false)
    }
  }
  
  const session = getCurrentSession()
  const messages = session?.messages || []
  
  return (
    <div className="h-full flex flex-col bg-[#070b10]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-text uppercase tracking-widest mb-2">AI Architect</h3>
            <p className="text-xs text-muted leading-relaxed max-w-[200px] mx-auto opacity-60">
              Your intelligent partner for code generation and debugging.
            </p>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessageItem key={message.id} message={message} />
          ))
        )}
        {isStreaming && (
          <div className="flex items-center gap-3 text-primary animate-pulse pl-2 font-bold uppercase tracking-widest text-[10px]">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-white/5 bg-[#0a0d12]">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Architect your code..."
            className="w-full bg-[#070b10] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-text placeholder:text-muted/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none resize-none transition-all pr-12"
            rows={3}
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-2.5 bg-primary text-white rounded-xl shadow-glow-primary hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await copyToClipboard(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className={`group animate-in slide-in-from-right-2 duration-300 ${message.role === 'user' ? 'ml-4' : 'mr-4'}`}>
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <span className="text-[9px] font-black text-muted/40 uppercase tracking-[0.2em]">
          {message.role === 'user' ? 'Developer' : 'Antigravity AI'}
        </span>
        {message.role === 'assistant' && (
          <button onClick={handleCopy} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted" />}
          </button>
        )}
      </div>
      <div className={`p-4 rounded-2xl text-[13px] leading-relaxed border ${
        message.role === 'user' 
          ? 'bg-primary/5 border-primary/20 text-text/90' 
          : 'bg-white/[0.03] border-white/5 text-text/80 shadow-xl'
      }`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    </div>
  )
}

function ErrorPanel() {
  const { getActiveTab } = useEditorStore()
  const [errors, setErrors] = useState<any[]>([])
  const [selectedError, setSelectedError] = useState<number | null>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [providerSettings, setProviderSettings] = useState<any>({ provider: 'openai', model: 'gpt-4o', apiKey: null })
  
  useEffect(() => {
    getProviderSettings().then(setProviderSettings)
    setErrors([
      { line: 10, column: 5, message: "Variable 'x' is declared but never used", severity: 'warning' },
      { line: 15, column: 10, message: "Expected ';' after expression", severity: 'error' },
    ])
  }, [])
  
  const handleFixError = async (error: any) => {
    const activeTab = getActiveTab()
    if (!activeTab) return
    setFixLoading(true)
    try {
      // AI fix logic here...
    } finally { setFixLoading(false) }
  }
  
  return (
    <div className="h-full flex flex-col bg-[#070b10]">
      <div className="p-5 border-b border-white/5 bg-[#0a0d12]">
        <h3 className="text-[11px] font-black text-text uppercase tracking-[0.2em]">Diagnostic Console</h3>
        <p className="text-[10px] font-bold text-muted uppercase mt-1">{errors.length} active violations</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {errors.map((error, idx) => (
          <div
            key={idx}
            className={`p-4 border-b border-white/[0.03] cursor-pointer transition-all ${
              selectedError === idx ? 'bg-primary/5' : 'hover:bg-white/[0.02]'
            }`}
            onClick={() => setSelectedError(idx === selectedError ? null : idx)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                error.severity === 'error' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text/90">{error.message}</p>
                <p className="text-[10px] font-bold text-muted/50 uppercase mt-1 tracking-widest">
                  Line {error.line} • {error.severity}
                </p>
              </div>
            </div>
            {selectedError === idx && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleFixError(error) }}
                className="btn-primary w-full mt-4 h-9 text-[10px] tracking-widest font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Apply AI Fix
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ChangesPanel() {
  const { gitStatus, workspacePath, setGitStatus } = useAppStore()
  const [diff, setDiff] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')

  const handleRefresh = async () => {
    if (!workspacePath) return
    setIsRefreshing(true)
    try {
      const result = await window.electronAPI.gitStatus(workspacePath)
      if (result.success) {
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
      console.error('Git refresh failed:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 600)
    }
  }

  const handleInitRepo = async () => {
    if (!workspacePath) return
    setIsRefreshing(true)
    try {
      await window.electronAPI.executeCommand(workspacePath, 'git init')
      handleRefresh()
    } catch (error) {
       console.error('Git init failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCommit = async () => {
    if (!workspacePath || !commitMessage.trim()) return
    setLoading(true)
    try {
      await window.electronAPI.gitCommit(workspacePath, commitMessage)
      setCommitMessage('')
      handleRefresh()
    } catch (error) {
      console.error('Commit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDiff = async (filePath?: string) => {
    if (!workspacePath) return
    setLoading(true)
    try {
      const result = await window.electronAPI.gitDiff(workspacePath, filePath)
      setDiff(result.success ? result.diff || '' : '')
    } finally { setLoading(false) }
  }

  if (!gitStatus?.isRepo) {
    return (
      <div className="h-full flex items-center justify-center p-12 bg-[#070b10] text-center">
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <GitPullRequest className="w-10 h-10 text-muted/20" />
          </div>
          <h3 className="text-sm font-black text-text uppercase tracking-[0.3em] mb-3">Void Detected</h3>
          <p className="text-[11px] text-muted leading-relaxed opacity-50 px-4">This space is not being tracked by Antigravity Source Control.</p>
          <button onClick={handleInitRepo} className="btn-primary mt-10 h-11 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">
            Initialize Nexus
          </button>
        </div>
      </div>
    )
  }

  const changedFiles = [
    ...(gitStatus.staged || []).map(f => ({ file: f, status: 'staged' })),
    ...(gitStatus.created || []).map(f => ({ file: f, status: 'created' })),
    ...(gitStatus.modified || []).map(f => ({ file: f, status: 'modified' })),
    ...(gitStatus.deleted || []).map(f => ({ file: f, status: 'deleted' })),
    ...(gitStatus.not_added || []).map(f => ({ file: f, status: 'untracked' })),
  ]

  return (
    <div className="h-full flex flex-col bg-[#070b10]">
       <div className="p-5 border-b border-white/5 bg-[#0a0d12]">
        <div className="flex items-center justify-between overflow-hidden">
          <div className="flex flex-col min-w-0">
            <h3 className="text-[11px] font-black text-text uppercase tracking-[0.2em] truncate">Antigravity Core</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">{gitStatus.current || 'detached'}</span>
            </div>
          </div>
          <button onClick={handleRefresh} className={`p-2 hover:bg-white/5 rounded-xl transition-all ${isRefreshing ? 'animate-spin text-primary' : 'text-muted'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
        {changedFiles.length === 0 ? (
          <div className="p-12 text-center opacity-40">
            <div className="w-16 h-16 bg-success/5 border border-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-success" />
            </div>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Synchronization Complete</p>
          </div>
        ) : (
          <div className="space-y-4 px-4">
             <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black text-muted/40 uppercase tracking-[0.3em]">Pending Pulses</span>
                <span className="text-[10px] font-bold text-primary">{changedFiles.length}</span>
             </div>
             <div className="space-y-1">
               {changedFiles.map((item, idx) => (
                 <div key={idx} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.04] cursor-pointer transition-all border border-transparent hover:border-white/5" onClick={() => handleViewDiff(item.file)}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg ${
                        item.status === 'staged' ? 'bg-success text-white' :
                        item.status === 'created' ? 'text-success bg-success/10 border border-success/20' :
                        item.status === 'modified' ? 'text-warning bg-warning/10 border border-warning/20' :
                        'text-error bg-error/10 border border-error/20'
                      }`}>
                        {item.status.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[12px] text-text/80 group-hover:text-text truncate transition-colors font-medium">
                        {item.file.split('/').pop()}
                      </span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {diff && (
        <div className="border-t border-white/10 bg-black/60 h-[40%] flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="text-[9px] font-black text-muted/50 uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-3 h-3 text-primary" /> Visual Pulse Diff
              </span>
              <button onClick={() => setDiff('')} className="p-1 hover:bg-white/10 rounded-lg text-muted"><X className="w-4 h-4" /></button>
           </div>
           <pre className="flex-1 p-4 font-mono text-[11px] text-muted/60 overflow-auto custom-scrollbar leading-relaxed">{diff}</pre>
        </div>
      )}

      {changedFiles.length > 0 && (
        <div className="p-5 bg-[#0a0d12] border-t border-white/5">
          <textarea 
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Describe this pulse..."
            className="w-full bg-[#070b10] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-text placeholder:text-muted/20 outline-none focus:border-primary/40 transition-all mb-4 resize-none"
            rows={2}
          />
          <button onClick={handleCommit} className="w-full h-12 bg-primary text-white rounded-2xl shadow-glow-primary font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <GitPullRequest className="w-4 h-4" /> Pulse Interface
          </button>
        </div>
      )}
    </div>
  )
}

function ContextPanel() {
  const { workspacePath, files } = useAppStore()
  const { getActiveTab } = useEditorStore()
  const [context, setContext] = useState('')
  const generateContext = () => {
    const activeTab = getActiveTab()
    let ctx = `# Pulse Context\n\n`
    if (workspacePath) ctx += `## Core\n${workspacePath}\n\n`
    if (activeTab) ctx += `## Waveform\n${activeTab.name}\n\`\`\`\n${activeTab.content.slice(0, 1000)}\n\`\`\`\n\n`
    setContext(ctx)
  }
  return (
    <div className="h-full flex flex-col bg-[#070b10] p-6">
       <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-muted/20" />
          </div>
          <h3 className="text-[11px] font-black text-text uppercase tracking-[0.3em] mb-4">Context Nexus</h3>
          <button onClick={generateContext} className="btn-secondary w-full h-10 text-[9px] font-black uppercase tracking-widest">Construct Nexus</button>
       </div>
       {context && (
         <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-4 flex-1 overflow-auto custom-scrollbar">
           <pre className="text-[10px] text-muted font-mono leading-relaxed">{context}</pre>
         </div>
       )}
    </div>
  )
}