import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useChatStore, ChatMessage } from '../store/chatStore'
import { useEditorStore } from '../store/editorStore'
import { sendChatMessage } from '../lib/aiClient'
import { getProviderSettings, AIProvider } from '../lib/ai'
import { generateExplainErrorPrompt, generateFixErrorPrompt, parseError } from '../lib/prompts'
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
  ChevronRight
} from 'lucide-react'

export default function RightSidebar() {
  const { rightSidebarTab, setRightSidebarTab, gitStatus, workspacePath } = useAppStore()
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default w-80
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX // Invert since dragging left increases width
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
      {/* Resizer */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50 transform -translate-x-1/2" 
        onMouseDown={handleMouseDown}
      />
      
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setRightSidebarTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
              rightSidebarTab === tab.id 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted hover:text-text'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden xl:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab content */}
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
    if (!session) {
      session = createSession()
    }
    
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
      
      // Add file context if available
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
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/50" />
            <h3 className="text-lg font-medium text-text mb-2">AI Assistant</h3>
            <p className="text-sm text-muted">
              Ask me anything about your code.<br />
              I can help you write, debug, and understand code.
            </p>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessageItem key={message.id} message={message} />
          ))
        )}
        {isStreaming && (
          <div className="chat-ai p-4">
            <div className="flex items-center gap-2 text-muted">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask AI..."
            className="input-field pr-12 resize-none"
            rows={3}
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-2 bg-primary rounded-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
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
    <div className={`p-4 ${message.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted uppercase">
          {message.role === 'user' ? 'You' : 'AI'}
        </span>
        {message.role === 'assistant' && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted" />}
          </button>
        )}
      </div>
      <div className="markdown-content text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

function ErrorPanel() {
  const { getActiveTab } = useEditorStore()
  const [errors, setErrors] = useState<Array<{
    line: number
    column: number
    message: string
    severity: 'error' | 'warning' | 'info'
  }>>([])
  const [selectedError, setSelectedError] = useState<number | null>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [providerSettings, setProviderSettings] = useState<{
    provider: AIProvider
    model: string
    apiKey: string | null
  }>({ provider: 'openai', model: 'gpt-4o', apiKey: null })
  
  useEffect(() => {
    getProviderSettings().then(setProviderSettings)
  }, [])
  
  // Simulate getting errors from Monaco
  useEffect(() => {
    // This would be connected to Monaco's markers in a real implementation
    setErrors([
      { line: 10, column: 5, message: "Variable 'x' is declared but never used", severity: 'warning' },
      { line: 15, column: 10, message: "Expected ';' after expression", severity: 'error' },
    ])
  }, [])
  
  const handleFixError = async (error: typeof errors[0]) => {
    const activeTab = getActiveTab()
    if (!activeTab) return
    
    setFixLoading(true)
    
    try {
      const prompt = generateFixErrorPrompt({
        fileName: activeTab.name,
        code: activeTab.content,
        error: error.message,
        language: activeTab.language
      })
      
      const messages = [
        { role: 'system' as const, content: 'You are ErrorLens Code, a bug-fixing assistant. Provide fixes with code blocks.' },
        { role: 'user' as const, content: prompt }
      ]
      
      let fixContent = ''
      await sendChatMessage(
        providerSettings.provider,
        providerSettings.model,
        messages,
        (chunk) => {
          fixContent += chunk.delta
        }
      )
      
      // Extract code block from response
      const codeMatch = fixContent.match(/```(?:\w+)?\n([\s\S]*?)```/)
      if (codeMatch) {
        // Apply fix (simplified - would need proper diff application)
        console.log('Fix:', codeMatch[1])
      }
    } catch (error) {
      console.error('Failed to fix error:', error)
    } finally {
      setFixLoading(false)
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-text">Problems</h3>
        <p className="text-sm text-muted">{errors.length} issues found</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="p-4 text-center">
            <Check className="w-12 h-12 mx-auto mb-4 text-success/50" />
            <p className="text-muted">No problems detected</p>
          </div>
        ) : (
          errors.map((error, idx) => (
            <div
              key={idx}
              className={`p-4 border-b border-border cursor-pointer transition-colors ${
                selectedError === idx ? 'bg-primary/10' : 'hover:bg-white/5'
              }`}
              onClick={() => setSelectedError(idx)}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-4 h-4 mt-0.5 ${
                  error.severity === 'error' ? 'text-error' : 
                  error.severity === 'warning' ? 'text-warning' : 'text-info'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text">{error.message}</p>
                  <p className="text-xs text-muted mt-1">
                    Line {error.line}, Column {error.column}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </div>
              
              {selectedError === idx && (
                <div className="mt-3 flex gap-2 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFixError(error)
                    }}
                    disabled={fixLoading}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {fixLoading ? 'Fixing...' : 'AI Fix'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ChangesPanel() {
  const { gitStatus, workspacePath } = useAppStore()
  const [diff, setDiff] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const handleViewDiff = async (filePath?: string) => {
    if (!workspacePath) return
    setLoading(true)
    try {
      const result = await window.electronAPI.gitDiff(workspacePath, filePath)
      if (result.success) {
        setDiff(result.diff || '')
      }
    } catch (error) {
      console.error('Failed to get diff:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCommit = async () => {
    if (!workspacePath || !gitStatus) return
    
    const message = prompt('Enter commit message:')
    if (message) {
      await window.electronAPI.gitCommit(workspacePath, message)
      // Refresh status
      const result = await window.electronAPI.gitStatus(workspacePath)
      if (result.success) {
        useAppStore.getState().setGitStatus({
          current: result.current || null,
          tracking: result.tracking || null,
          staged: result.staged || [],
          modified: result.modified || [],
          created: result.created || [],
          deleted: result.deleted || [],
          not_added: result.not_added || [],
          ahead: result.ahead || 0,
          behind: result.behind || 0,
          isRepo: result.isRepo !== false
        })
      }
    }
  }
  
  if (!gitStatus?.isRepo) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <GitPullRequest className="w-12 h-12 mx-auto mb-4 text-muted/50" />
          <p className="text-muted">Not a git repository</p>
        </div>
      </div>
    )
  }
  
  const changedFiles = [
    ...(gitStatus.created || []).map(f => ({ file: f, status: 'created' })),
    ...(gitStatus.modified || []).map(f => ({ file: f, status: 'modified' })),
    ...(gitStatus.deleted || []).map(f => ({ file: f, status: 'deleted' })),
    ...(gitStatus.not_added || []).map(f => ({ file: f, status: 'untracked' })),
  ]
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-text">Changes</h3>
          <span className="text-sm text-muted">{changedFiles.length} files</span>
        </div>
        {gitStatus.current && (
          <p className="text-xs text-muted">Branch: {gitStatus.current}</p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {changedFiles.length === 0 ? (
          <div className="p-4 text-center">
            <Check className="w-12 h-12 mx-auto mb-4 text-success/50" />
            <p className="text-muted">Working tree clean</p>
          </div>
        ) : (
          changedFiles.map((item, idx) => (
            <div
              key={idx}
              className="p-3 border-b border-border hover:bg-white/5 cursor-pointer"
              onClick={() => handleViewDiff(item.file)}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.status === 'created' ? 'bg-success/20 text-success' :
                  item.status === 'modified' ? 'bg-warning/20 text-warning' :
                  item.status === 'deleted' ? 'bg-error/20 text-error' :
                  'bg-muted/20 text-muted'
                }`}>
                  {item.status === 'created' ? 'A' :
                   item.status === 'modified' ? 'M' :
                   item.status === 'deleted' ? 'D' : '?'}
                </span>
                <span className="text-sm text-text truncate">{item.file}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Diff view */}
      {diff && (
        <div className="border-t border-border max-h-40 overflow-y-auto p-2 bg-card">
          <pre className="text-xs text-muted whitespace-pre-wrap">{diff}</pre>
        </div>
      )}
      
      {/* Commit button */}
      {changedFiles.length > 0 && (
        <div className="p-4 border-t border-border">
          <button
            onClick={handleCommit}
            className="btn-primary w-full"
            disabled={loading}
          >
            Commit Changes
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
    let ctx = '# Project Context\n\n'
    
    if (workspacePath) {
      ctx += `## Workspace\n${workspacePath}\n\n`
    }
    
    if (activeTab) {
      ctx += `## Current File\n${activeTab.name}\n\`\`\`${activeTab.language}\n${activeTab.content.slice(0, 1000)}\n\`\`\`\n\n`
    }
    
    // Add file tree (limited)
    const fileTree = files.slice(0, 20).map(f => f.name).join('\n')
    ctx += `## Project Files (first 20)\n\`\`\`\n${fileTree}\n\`\`\``
    
    setContext(ctx)
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-text">Context</h3>
        <p className="text-sm text-muted">Project information for AI</p>
      </div>
      
      <div className="p-4">
        <button onClick={generateContext} className="btn-secondary w-full mb-4">
          Generate Context
        </button>
        
        {context && (
          <div className="bg-card rounded-xl p-3 max-h-96 overflow-y-auto">
            <pre className="text-xs text-muted whitespace-pre-wrap">{context}</pre>
          </div>
        )}
      </div>
    </div>
  )
}