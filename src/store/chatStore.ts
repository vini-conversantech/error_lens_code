import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  projectId: number | null
  createdAt: number
  messages: ChatMessage[]
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  isStreaming: boolean
  streamingContent: string
  selectedModel: string
  selectedAgent: string
  
  // Actions
  createSession: (projectId?: number) => ChatSession
  setCurrentSession: (id: string) => void
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage
  updateMessage: (sessionId: string, messageId: string, content: string) => void
  deleteSession: (id: string) => void
  setStreaming: (isStreaming: boolean) => void
  setStreamingContent: (content: string) => void
  setSelectedModel: (model: string) => void
  setSelectedAgent: (agent: string) => void
  getCurrentSession: () => ChatSession | null
}

let messageIdCounter = 0
let sessionIdCounter = 0

function generateId(): string {
  return `${Date.now()}-${++messageIdCounter}-${++sessionIdCounter}`
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isStreaming: false,
  streamingContent: '',
  selectedModel: 'gpt-4o',
  selectedAgent: 'Architect',
  
  createSession: (projectId) => {
    const session: ChatSession = {
      id: generateId(),
      projectId: projectId || null,
      createdAt: Date.now(),
      messages: []
    }
    
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id
    }))
    
    return session
  },
  
  setCurrentSession: (id) => set({ currentSessionId: id }),
  
  addMessage: (sessionId, message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now()
    }
    
    set((state) => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, newMessage] }
          : s
      )
    }))
    
    return newMessage
  },
  
  updateMessage: (sessionId, messageId, content) => set((state) => ({
    sessions: state.sessions.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: s.messages.map(m => 
              m.id === messageId ? { ...m, content } : m
            )
          }
        : s
    )
  })),
  
  deleteSession: (id) => set((state) => {
    const newSessions = state.sessions.filter(s => s.id !== id)
    return {
      sessions: newSessions,
      currentSessionId: state.currentSessionId === id 
        ? (newSessions[0]?.id || null) 
        : state.currentSessionId
    }
  }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),
  
  setStreamingContent: (content) => set({ streamingContent: content }),
  
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  
  getCurrentSession: () => {
    const state = get()
    return state.sessions.find(s => s.id === state.currentSessionId) || null
  }
}))