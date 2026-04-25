// AI Provider Types and Abstraction

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  maxTokens: number
  supportsStreaming: boolean
}

export interface AIProviderConfig {
  provider?: AIProvider
  apiKey: string | null
  model?: string
  apiUrl?: string
}

export interface AIRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AIResponse {
  id: string
  model: string
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
}

export interface AIStreamChunk {
  id: string
  delta: string
  finishReason?: string
}

// Available models
export const AI_MODELS: AIModel[] = [
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', maxTokens: 128000, supportsStreaming: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, supportsStreaming: true },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385, supportsStreaming: true },
  
  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true },
  
  // Gemini
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', maxTokens: 2000000, supportsStreaming: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', maxTokens: 1000000, supportsStreaming: true },
  
  // Ollama (local)
  { id: 'llama2', name: 'Llama 2', provider: 'ollama', maxTokens: 4096, supportsStreaming: true },
  { id: 'codellama', name: 'Code Llama', provider: 'ollama', maxTokens: 16384, supportsStreaming: true },
  { id: 'mistral', name: 'Mistral', provider: 'ollama', maxTokens: 8192, supportsStreaming: true },
  
  // OpenRouter
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'openrouter', maxTokens: 128000, supportsStreaming: true },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'openrouter', maxTokens: 128000, supportsStreaming: true },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'openrouter', maxTokens: 128000, supportsStreaming: true },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', provider: 'openrouter', maxTokens: 128000, supportsStreaming: true },
  { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', provider: 'openrouter', maxTokens: 128000, supportsStreaming: true },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OR)', provider: 'openrouter', maxTokens: 4096, supportsStreaming: true },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OR)', provider: 'openrouter', maxTokens: 128000, supportsStreaming: true },
]

export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter(m => m.provider === provider)
}

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id)
}

// API Key storage keys
const API_KEYS = {
  openai: 'ai_provider_openai_key',
  anthropic: 'ai_provider_anthropic_key',
  gemini: 'ai_provider_gemini_key',
  ollama: 'ai_provider_ollama_endpoint',
  openrouter: 'ai_provider_openrouter_key',
}

export async function getAPIKey(provider: AIProvider): Promise<string | null> {
  try {
    const result = await window.electronAPI.getSetting(API_KEYS[provider])
    return result.success ? result.value || null : null
  } catch {
    return null
  }
}

export async function setAPIKey(provider: AIProvider, value: string): Promise<boolean> {
  try {
    const result = await window.electronAPI.setSetting(API_KEYS[provider], value)
    return result.success
  } catch {
    return false
  }
}

// Get current provider settings
export async function getProviderSettings(): Promise<{
  provider: AIProvider
  model: string
  apiKey: string | null
}> {
  try {
    const providerResult = await window.electronAPI.getSetting('ai_provider')
    const modelResult = await window.electronAPI.getSetting('ai_model')
    
    const provider = (providerResult.value || 'openai') as AIProvider
    const model = modelResult.value || 'gpt-4o'
    const apiKey = await getAPIKey(provider)
    
    return { provider, model, apiKey }
  } catch {
    return { provider: 'openai', model: 'gpt-4o', apiKey: null }
  }
}

export async function setProviderSettings(
  provider: AIProvider, 
  model: string, 
  apiKey?: string
): Promise<boolean> {
  try {
    await window.electronAPI.setSetting('ai_provider', provider)
    await window.electronAPI.setSetting('ai_model', model)
    
    if (apiKey) {
      await setAPIKey(provider, apiKey)
    }
    
    return true
  } catch {
    return false
  }
}