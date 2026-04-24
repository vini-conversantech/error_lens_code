import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { 
  Terminal as TerminalIcon, 
  Plus, 
  Trash2, 
  X, 
  ChevronUp, 
  ChevronDown,
  SplitSquareHorizontal,
  MoreHorizontal,
  AlertCircle,
  AlertTriangle,
  Info,
  FileText
} from 'lucide-react'

interface TerminalSession {
  id: string
  name: string
  output: string[]
  isRunning: boolean
}

interface Problem {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
  source: string
  line: number
  column: number
  file?: string
}

export default function Terminal() {
  const { terminalOpen, problemsOpen, toggleTerminal, toggleProblemsPanel, workspacePath } = useAppStore()
  const [activeTab, setActiveTab] = useState<'terminal' | 'problems'>('terminal')
  const [panelHeight, setPanelHeight] = useState(256) // Default h-64 (256px)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', name: 'Terminal 1', output: [], isRunning: false }
  ])
  const [activeSessionId, setActiveSessionId] = useState('1')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Problems state
  const [problems, setProblems] = useState<Problem[]>([])
  const [problemFilter, setProblemFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const [selectedProblem, setSelectedProblem] = useState<number | null>(null)
  
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const activeSession = sessions.find(s => s.id === activeSessionId)
  
  // Switch tabs if triggered from outside
  useEffect(() => {
    if (problemsOpen && !terminalOpen) setActiveTab('problems')
    if (terminalOpen && !problemsOpen) setActiveTab('terminal')
  }, [terminalOpen, problemsOpen])

  // Resize logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startY.current - e.clientY // Invert because dragging UP increases height
      const newHeight = Math.max(100, Math.min(800, startHeight.current + delta))
      setPanelHeight(newHeight)
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
    startY.current = e.clientY
    startHeight.current = panelHeight
    document.body.style.cursor = 'row-resize'
    e.preventDefault()
  }

  // Load mock problems
  useEffect(() => {
    setProblems([
      { id: '1', severity: 'error', message: "Expected ';' after expression", source: 'ts', line: 15, column: 10, file: 'App.tsx' },
      { id: '2', severity: 'warning', message: "Variable 'x' is declared but never used", source: 'ts', line: 10, column: 5, file: 'App.tsx' },
      { id: '3', severity: 'info', message: "Consider using 'const' instead of 'let'", source: 'ts', line: 12, column: 3, file: 'App.tsx' },
    ])
  }, [])
  
  // Auto-scroll output
  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight)
  }, [activeSession?.output])
  
  // Focus input on mount
  useEffect(() => {
    if (terminalOpen) {
      inputRef.current?.focus()
    }
  }, [terminalOpen])
  
  const addSession = () => {
    const newId = String(sessions.length + 1)
    setSessions(prev => [
      ...prev,
      { id: newId, name: `Terminal ${newId}`, output: [], isRunning: false }
    ])
    setActiveSessionId(newId)
  }
  
  const removeSession = (id: string) => {
    if (sessions.length === 1) return
    
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(sessions[0].id)
    }
  }
  
  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || !workspacePath) return
    
    const session = sessions.find(s => s.id === activeSessionId)
    if (!session) return
    
    // Add command to output
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, output: [...s.output, `$ ${cmd}`], isRunning: true }
        : s
    ))
    
    // Add to history
    setHistory(prev => [...prev, cmd])
    setHistoryIndex(-1)
    setInput('')
    
    try {
      // Execute command via IPC (would need to implement in main process)
      const result = await window.electronAPI.executeCommand(workspacePath, cmd)
      
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { 
              ...s, 
              output: [...s.output, ...(result.output || '').split('\n').filter(Boolean), result.error || ''],
              isRunning: false
            }
          : s
      ))
    } catch (error) {
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { 
              ...s, 
              output: [...s.output, `Error: ${error instanceof Error ? error.message : 'Command failed'}`],
              isRunning: false
            }
          : s
      ))
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      // Cancel current command
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, output: [...s.output, '^C'], isRunning: false }
          : s
      ))
    }
  }
  
  const clearOutput = () => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, output: [] } : s
    ))
  }
  
  const handleProblemClick = (problem: Problem, index: number) => {
    setSelectedProblem(index)
    // Navigate to the problem location in the editor would happen here
  }
  
  const closePanel = () => {
    if (terminalOpen) toggleTerminal()
    if (problemsOpen) toggleProblemsPanel()
  }
  
  if (!terminalOpen && !problemsOpen) return null
  
  const filteredProblems = problems.filter(p => problemFilter === 'all' ? true : p.severity === problemFilter)
  const errorCount = problems.filter(p => p.severity === 'error').length
  const warningCount = problems.filter(p => p.severity === 'warning').length
  const infoCount = problems.filter(p => p.severity === 'info').length
  
  return (
    <div className="relative bg-panel border-t border-border flex flex-col shrink-0" style={{ height: panelHeight }}>
      {/* Top Resizer Handle */}
      <div 
        className="absolute left-0 right-0 top-0 h-1 cursor-row-resize hover:bg-primary/50 transition-colors z-50 transform -translate-y-1/2"
        onMouseDown={handleMouseDown}
      />
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border select-none bg-panel">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('problems')}
            className={`text-xs font-medium px-2 py-1 rounded-t transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'problems' ? 'text-text bg-white/5 border-b border-primary' : 'text-muted hover:text-text'
            }`}
          >
            Problems
            {errorCount > 0 && <span className="bg-error/20 text-error px-1.5 rounded-full text-[10px] ml-1">{errorCount}</span>}
          </button>
          <button className="text-xs font-medium text-muted hover:text-text px-2 py-1 rounded transition-colors whitespace-nowrap hidden sm:block">Output</button>
          <button className="text-xs font-medium text-muted hover:text-text px-2 py-1 rounded transition-colors whitespace-nowrap hidden md:block">Debug Console</button>
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`text-xs font-medium px-2 py-1 rounded-t transition-colors whitespace-nowrap ${
              activeTab === 'terminal' ? 'text-text bg-white/5 border-b border-primary' : 'text-muted hover:text-text'
            }`}
          >
            Terminal
          </button>
          <button className="text-xs font-medium text-muted hover:text-text px-2 py-1 rounded transition-colors whitespace-nowrap hidden sm:block">Ports</button>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-2 text-muted shrink-0 pl-4">
          {activeTab === 'problems' ? (
            <div className="flex items-center gap-1 bg-card rounded-lg p-0.5">
              {(['all', 'error', 'warning', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setProblemFilter(f)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    problemFilter === f ? 'bg-primary/20 text-primary' : 'hover:text-text'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer transition-colors text-xs font-mono border border-transparent hover:border-white/10 hidden md:flex">
                <span className="font-bold">&gt;_</span>
                <span>node</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </div>
              
              <div className="w-px h-4 bg-white/10 mx-1 hidden md:block" />
              
              <button onClick={addSession} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors border border-transparent hover:border-white/10" title="New terminal">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={clearOutput} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors" title="Clear Terminal">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
          
          <button onClick={closePanel} className="p-1 hover:bg-error/20 hover:text-error rounded transition-colors" title="Close Panel">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {activeTab === 'problems' && (
        <div className="flex-1 overflow-y-auto w-full">
          {filteredProblems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              No problems {problemFilter !== 'all' ? `(${problemFilter}s)` : ''}
            </div>
          ) : (
            filteredProblems.map((problem, idx) => (
              <div
                key={problem.id}
                className={`flex items-start gap-3 px-4 py-2 cursor-pointer transition-colors ${
                  selectedProblem === idx ? 'bg-primary/10' : 'hover:bg-white/5'
                }`}
                onClick={() => handleProblemClick(problem, idx)}
              >
                {problem.severity === 'error' && <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />}
                {problem.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />}
                {problem.severity === 'info' && <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text">{problem.message}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {problem.file && <span className="mr-2">{problem.file}</span>}
                    Line {problem.line}, Column {problem.column}
                    {problem.source && <span className="ml-2">({problem.source})</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'terminal' && (
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {/* Session selector */}
          {sessions.length > 1 && (
            <div className="flex items-center px-4 py-1 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-colors ${
                      activeSessionId === session.id 
                        ? 'bg-primary/20 text-primary border border-primary/20' 
                        : 'text-muted hover:text-text hover:bg-white/5'
                    }`}
                  >
                    <TerminalIcon className="w-3 h-3" />
                    {session.name}
                    {sessions.length > 1 && (
                      <X 
                        className="w-3 h-3 hover:text-error ml-1" 
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSession(session.id)
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Output */}
          <div ref={outputRef} className="flex-1 overflow-y-auto p-2 font-mono text-sm">
            {activeSession?.output.map((line, idx) => (
              <div 
                key={idx} 
                className={`py-0.5 ${
                  line.startsWith('$ ') ? 'text-text' : 
                  line.startsWith('Error') ? 'text-error' :
                  line.startsWith('^C') ? 'text-warning' : 'text-muted'
                }`}
              >
                {line}
              </div>
            ))}
            {activeSession?.isRunning && (
              <div className="text-primary animate-pulse">Running...</div>
            )}
          </div>
          
          {/* Input */}
          <div className="p-2 border-t border-border mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-success font-mono text-sm">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={workspacePath ? `Run command in ${workspacePath}` : 'Open a folder first'}
                disabled={!workspacePath}
                className="flex-1 bg-transparent text-text placeholder:text-muted focus:outline-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}