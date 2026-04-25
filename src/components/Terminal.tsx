import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { 
  Terminal as TerminalIcon, 
  Plus, 
  Trash2, 
  X, 
  SplitSquareHorizontal,
  AlertCircle,
  AlertTriangle,
  Info,
  FileText,
  RefreshCw
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
  const { terminalOpen, problemsOpen, toggleTerminal, toggleProblemsPanel, workspacePath, workspaceName } = useAppStore()
  const [activeTab, setActiveTab] = useState<'terminal' | 'problems' | 'output' | 'debug' | 'ports'>('terminal')
  const [panelHeight, setPanelHeight] = useState(280)
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
  
  // Panels state
  const [problems, setProblems] = useState<Problem[]>([])
  const [outputLines, setOutputLines] = useState<string[]>(['[info] ErrorLens Code extension activated', '[info] Workspace indexed: 24 files found'])
  const [debugLines, setDebugLines] = useState<string[]>(['Debugger attached.', 'Waiting for connections...'])
  const [ports, setPorts] = useState<{port: number, process: string, address: string}[]>([
    { port: 3000, process: 'node', address: 'localhost:3000' }
  ])
  const [problemFilter, setProblemFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const [selectedProblem, setSelectedProblem] = useState<number | null>(null)
  
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const activeSession = sessions.find(s => s.id === activeSessionId)
  
  // Switch tabs if triggered from outside
  useEffect(() => {
    if (problemsOpen && activeTab !== 'problems') setActiveTab('problems')
    if (terminalOpen && activeTab !== 'terminal') setActiveTab('terminal')
  }, [terminalOpen, problemsOpen])

  // Mock prompt info
  const user = "0nlymac"
  const machine = "0nlys-MacBook-Pro"
  const currentFolder = workspaceName || "home"

  // Resize logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startY.current - e.clientY
      const newHeight = Math.max(150, Math.min(800, startHeight.current + delta))
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
  
  const addSession = () => {
    const newId = String(Date.now())
    setSessions(prev => [
      ...prev,
      { id: newId, name: `Terminal ${prev.length + 1}`, output: [], isRunning: false }
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

    const cleanCmd = cmd.trim().toLowerCase()
    if (cleanCmd === 'clear' || cleanCmd === 'cls') {
      clearOutput()
      setInput('')
      return
    }
    
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, output: [...s.output, `prompt:${cmd}`], isRunning: true }
        : s
    ))
    
    setHistory(prev => [...prev, cmd])
    setHistoryIndex(-1)
    setInput('')
    
    try {
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
    }
  }
  
  const clearOutput = () => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, output: [] } : s
    ))
  }
  
  const handleProblemClick = (problem: Problem, index: number) => {
    setSelectedProblem(index)
  }
  
  const closePanel = () => {
    if (terminalOpen) toggleTerminal()
    if (problemsOpen) toggleProblemsPanel()
  }
  
  if (!terminalOpen && !problemsOpen) return null
  
  const filteredProblems = problems.filter(p => problemFilter === 'all' ? true : p.severity === problemFilter)
  const errorCount = problems.filter(p => p.severity === 'error').length
  const warningCount = problems.filter(p => p.severity === 'warning').length

  return (
    <div className="relative bg-panel border-t border-white/5 flex flex-col shrink-0" style={{ height: panelHeight }}>
      <div 
        className="absolute left-0 right-0 top-0 h-1 cursor-row-resize hover:bg-primary/50 transition-colors z-50 transform -translate-y-1/2"
        onMouseDown={handleMouseDown}
      />
      
      <div className="flex items-center justify-between px-4 h-9 border-b border-white/5 select-none bg-[#0a0d12]">
        <div className="flex items-center h-full gap-0.5">
          {[
            { id: 'problems', label: 'Problems', count: errorCount + warningCount },
            { id: 'output', label: 'Output' },
            { id: 'debug', label: 'Debug Console' },
            { id: 'terminal', label: 'Terminal' },
            { id: 'ports', label: 'Ports' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-[11px] font-bold uppercase tracking-wider h-full px-3 transition-all relative flex items-center gap-1.5 ${
                activeTab === tab.id ? 'text-primary' : 'text-muted hover:text-text'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  errorCount > 0 ? 'bg-error text-white' : 'bg-warning text-black'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(79,140,255,0.5)]" />
              )}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-muted">
          {activeTab === 'terminal' && (
            <>
              <button onClick={addSession} className="p-1 hover:bg-white/5 hover:text-text rounded transition-all">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={clearOutput} className="p-1 hover:bg-white/5 hover:text-text rounded transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <div className="w-px h-3 bg-white/10 mx-1" />
          <button onClick={closePanel} className="p-1 hover:bg-error/20 hover:text-error rounded transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'problems' && (
          <div className="h-full overflow-y-auto w-full bg-[#0a0d12]/50">
             {filteredProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted/40 space-y-3">
                <AlertCircle className="w-12 h-12 stroke-[1.5]" />
                <span className="text-sm font-medium tracking-wide">No problems found in the workspace</span>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {filteredProblems.map((problem, idx) => (
                  <div
                    key={problem.id}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-all ${
                      selectedProblem === idx ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/[0.05] border-l-2 border-transparent'
                    }`}
                    onClick={() => handleProblemClick(problem, idx)}
                  >
                    {problem.severity === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
                    ) : problem.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-text/90 font-medium leading-relaxed">{problem.message}</div>
                      <div className="text-[11px] text-muted/60 mt-1.5 flex items-center gap-3">
                        <span className="text-primary/60 font-mono">{problem.file}:{problem.line}:{problem.column}</span>
                        <span className="opacity-20">|</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">{problem.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full overflow-y-auto p-6 font-mono text-[13px] bg-[#070b10] leading-relaxed">
            <div className="flex items-center gap-3 mb-4 text-xs font-bold text-muted/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
              <FileText className="w-3 h-3" />
              <span>System Output Log</span>
            </div>
            {outputLines.map((line, i) => (
              <div key={i} className="py-1 group flex gap-4">
                <span className="text-muted/20 w-6 text-right select-none">{i + 1}</span>
                <span className={line.includes('[error]') ? 'text-error/80' : 'text-muted/70 group-hover:text-text transition-colors'}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="h-full overflow-y-auto p-6 font-mono text-[13px] bg-[#070b10] leading-relaxed">
            <div className="flex items-center gap-3 mb-4 text-xs font-bold text-muted/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
              <RefreshCw className="w-3 h-3" />
              <span>Debug Console (v1.0.2)</span>
            </div>
             {debugLines.map((line, i) => (
              <div key={i} className="py-1 flex gap-4">
                <span className="text-primary/50">❯</span>
                <span className="text-primary/90">{line}</span>
              </div>
            ))}
            <div className="mt-4 flex items-center gap-3 opacity-30 italic pl-6 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>Listening for debug events...</span>
            </div>
          </div>
        )}

        {activeTab === 'ports' && (
          <div className="h-full p-8 bg-[#070b10] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text uppercase tracking-widest">Forwarded Ports</h3>
                <p className="text-xs text-muted mt-1">Manage active network services in your workspace</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ports.map((p, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-primary/40 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <SplitSquareHorizontal className="w-8 h-8" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                       <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                  <div className="text-3xl font-mono font-bold text-white mb-1">{p.port}</div>
                  <div className="text-xs text-primary/70 font-mono mb-6">{p.address}</div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-muted uppercase">{p.process}</span>
                    <button className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">Stop</button>
                  </div>
                </div>
              ))}
              <button className="border-2 border-dashed border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-muted hover:text-text hover:border-white/10 transition-all group">
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Forward Port</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col bg-[#070b10]">
            {sessions.length > 1 && (
              <div className="flex items-center px-4 py-1.5 bg-black/40 gap-1 border-b border-white/5">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                      activeSessionId === session.id 
                        ? 'bg-primary text-white' 
                        : 'text-muted hover:text-text hover:bg-white/5'
                    }`}
                  >
                    <TerminalIcon className="w-3 h-3" />
                    {session.name}
                    <X className="w-3 h-3 hover:text-white" onClick={(e) => { e.stopPropagation(); removeSession(session.id); }} />
                  </button>
                ))}
              </div>
            )}
            
            <div ref={outputRef} className="flex-1 overflow-y-auto p-4 font-mono text-[13px] scrollbar-thin">
              {activeSession?.output.map((line, idx) => (
                <div key={idx} className="py-0.5 break-all">
                  {line.startsWith('prompt:') ? (
                    <div className="flex items-center gap-2 mb-1 mt-2">
                       <span className="text-success font-bold">{user}@{machine}</span>
                       <span className="text-primary">{currentFolder}</span>
                       <span className="text-muted">%</span>
                       <span className="text-text">{line.replace('prompt:', '')}</span>
                    </div>
                  ) : (
                    <span className={line.includes('Error') ? 'text-error' : 'text-muted'}>{line}</span>
                  )}
                </div>
              ))}
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-success font-bold">{user}@{machine}</span>
                  <span className="text-primary">{currentFolder}</span>
                  <span className="text-muted">%</span>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-text outline-none caret-primary"
                  autoFocus
                />
              </div>
              {activeSession?.isRunning && (
                <div className="flex items-center gap-2 text-primary mt-2 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Executing Process...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}