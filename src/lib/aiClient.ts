import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  getModelById,
  getAPIKey
} from './ai'

// Base AI Client class
abstract class BaseAIClient {
  protected provider: AIProvider

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  abstract chat(request: AIRequest): Promise<AIResponse>
  abstract chatStream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse>
}

// OpenAI Client
class OpenAIClient extends BaseAIClient {
  constructor() {
    super('openai')
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const apiKey = await getAPIKey('openai')
    if (!apiKey) throw new Error('OpenAI API key not configured')

    console.log('OpenAI Chat Request:', { model: request.model, hasApiKey: !!apiKey, hasElectronAPI: !!window.electronAPI?.aiChatRequest })

    const options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens
      }
    }

    if (typeof window.electronAPI?.aiChatRequest === 'function') {
      const result = await window.electronAPI.aiChatRequest('https://api.openai.com/v1/chat/completions', options)
      if (!result.success) throw new Error(result.error)
      const data = result.data
      return {
        id: data.id,
        model: data.model,
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        finishReason: data.choices[0]?.finish_reason || 'stop'
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(options.body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    return {
      id: data.id,
      model: data.model,
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      finishReason: data.choices[0]?.finish_reason || 'stop'
    }
  }

  async chatStream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse> {
    const apiKey = await getAPIKey('openai')
    if (!apiKey) throw new Error('OpenAI API key not configured')


    if (typeof window.electronAPI?.aiChatRequest === 'function') {
      const result = await this.chat(request)
      onChunk({ id: result.id, delta: result.content, finishReason: 'stop' })
      return result
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Failed to read response stream')

    const decoder = new TextDecoder()
    let fullContent = ''
    let responseId = ''
    let finishReason = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            finishReason = 'stop'
            continue
          }

          try {
            const parsed = JSON.parse(data)
            responseId = parsed.id || ''
            const delta = parsed.choices[0]?.delta?.content || ''
            finishReason = parsed.choices[0]?.finish_reason || ''

            if (delta) {
              fullContent += delta
              onChunk({
                id: responseId,
                delta,
                finishReason
              })
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    return {
      id: responseId,
      model: request.model,
      content: fullContent,
      finishReason
    }
  }
}

// Anthropic Client
class AnthropicClient extends BaseAIClient {
  constructor() {
    super('anthropic')
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const apiKey = await getAPIKey('anthropic')
    if (!apiKey) throw new Error('Anthropic API key not configured')

    // Convert messages to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')

    const options = {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: {
        model: request.model,
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        system: systemMessage?.content,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4096
      }
    }

    if (typeof window.electronAPI?.aiChatRequest === 'function') {
      const result = await window.electronAPI.aiChatRequest('https://api.anthropic.com/v1/messages', options)
      if (!result.success) throw new Error(result.error)
      const data = result.data
      return {
        id: data.id,
        model: data.model,
        content: data.content[0]?.text || '',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        finishReason: data.stop_reason || 'stop'
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(options.body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Anthropic API error')
    }

    const data = await response.json()
    return {
      id: data.id,
      model: data.model,
      content: data.content[0]?.text || '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      finishReason: data.stop_reason || 'stop'
    }
  }

  async chatStream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse> {
    const apiKey = await getAPIKey('anthropic')
    if (!apiKey) throw new Error('Anthropic API key not configured')

    const systemMessage = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')

    if (typeof window.electronAPI?.aiChatRequest === 'function') {
      const result = await this.chat(request)
      onChunk({ id: result.id, delta: result.content, finishReason: 'stop' })
      return result
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        system: systemMessage?.content,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4096,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Anthropic API error')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Failed to read response stream')

    const decoder = new TextDecoder()
    let fullContent = ''
    let responseId = ''
    let finishReason = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'message_start') {
              responseId = parsed.message.id
            } else if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text || ''
              fullContent += delta
              onChunk({ id: responseId, delta })
            } else if (parsed.type === 'message_stop') {
              finishReason = 'stop'
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    return {
      id: responseId,
      model: request.model,
      content: fullContent,
      finishReason
    }
  }
}

// Gemini Client
class GeminiClient extends BaseAIClient {
  constructor() {
    super('gemini')
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const apiKey = await getAPIKey('gemini')
    if (!apiKey) throw new Error('Gemini API key not configured')

    // Convert messages to Gemini format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

    const systemInstruction = request.messages.find(m => m.role === 'system')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.maxTokens
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Gemini API error')
    }

    const data = await response.json()
    return {
      id: data.promptFeedback?.safetyRatings ? 'safety-blocked' : 'gemini-' + Date.now(),
      model: request.model,
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      finishReason: data.candidates?.[0]?.finishReason || 'stop'
    }
  }

  async chatStream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse> {
    const apiKey = await getAPIKey('gemini')
    if (!apiKey) throw new Error('Gemini API key not configured')

    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

    const systemInstruction = request.messages.find(m => m.role === 'system')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:streamGenerateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.maxTokens
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Gemini API error')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Failed to read response stream')

    const decoder = new TextDecoder()
    let fullContent = ''
    let responseId = 'gemini-' + Date.now()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (delta) {
              fullContent += delta
              onChunk({ id: responseId, delta })
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    return {
      id: responseId,
      model: request.model,
      content: fullContent,
      finishReason: 'stop'
    }
  }
}

// Ollama Client (Local)
class OllamaClient extends BaseAIClient {
  constructor() {
    super('ollama')
  }

  private getEndpoint(): string {
    return 'http://localhost:11434'
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const endpoint = await getAPIKey('ollama') || this.getEndpoint()

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      id: 'ollama-' + Date.now(),
      model: data.model || request.model,
      content: data.message?.content || '',
      finishReason: data.done ? 'stop' : 'length'
    }
  }

  async chatStream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse> {
    const endpoint = await getAPIKey('ollama') || this.getEndpoint()

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Failed to read response stream')

    const decoder = new TextDecoder()
    let fullContent = ''
    let responseId = 'ollama-' + Date.now()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          const delta = parsed.message?.content || ''
          if (delta) {
            fullContent += delta
            onChunk({ id: responseId, delta })
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    return {
      id: responseId,
      model: request.model,
      content: fullContent,
      finishReason: 'stop'
    }
  }
}

class OpenRouterClient extends BaseAIClient {
  constructor() {
    super('openrouter')
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    let apiKey = await getAPIKey('openrouter')
    if (!apiKey) apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    const options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/vini-conversantech/error_lens_code',
        'X-Title': 'ErrorLens Code'
      },
      body: {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens
      }
    }

    if (typeof window.electronAPI?.aiChatRequest === 'function') {
      const result = await window.electronAPI.aiChatRequest('https://openrouter.ai/api/v1/chat/completions', options)
      if (!result.success) throw new Error(result.error)
      const data = result.data
      return {
        id: data.id,
        model: data.model,
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        finishReason: data.choices[0]?.finish_reason || 'stop'
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(options.body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenRouter API error')
    }

    const data = await response.json()
    return {
      id: data.id,
      model: data.model,
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      finishReason: data.choices[0]?.finish_reason || 'stop'
    }
  }

  async chatStream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse> {
    let apiKey = await getAPIKey('openrouter')
    if (!apiKey) apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;


    if (typeof window.electronAPI?.aiChatRequest === 'function') {
      const result = await this.chat(request)
      onChunk({ id: result.id, delta: result.content, finishReason: 'stop' })
      return result
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/vini-conversantech/error_lens_code',
        'X-Title': 'ErrorLens Code'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenRouter API error')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Failed to read response stream')

    const decoder = new TextDecoder()
    let fullContent = ''
    let responseId = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            responseId = parsed.id || ''
            const delta = parsed.choices[0]?.delta?.content || ''

            if (delta) {
              fullContent += delta
              onChunk({ id: responseId, delta })
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    return {
      id: responseId,
      model: request.model,
      content: fullContent,
      finishReason: 'stop'
    }
  }
}

// Client factory
function getClient(provider: AIProvider): BaseAIClient {
  switch (provider) {
    case 'openai':
      return new OpenAIClient()
    case 'anthropic':
      return new AnthropicClient()
    case 'gemini':
      return new GeminiClient()
    case 'ollama':
      return new OllamaClient()
    case 'openrouter':
      return new OpenRouterClient()
    default:
      return new OpenAIClient()
  }
}

// Main AI chat function
export async function sendChatMessage(
  provider: AIProvider,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onStream?: (chunk: AIStreamChunk) => void
): Promise<AIResponse> {
  const client = getClient(provider)
  const modelInfo = getModelById(model)

  const request: AIRequest = {
    model,
    messages,
    temperature: 0.7,
    maxTokens: modelInfo?.maxTokens ? Math.min(modelInfo.maxTokens, 8192) : 4096,
    stream: !!onStream
  }

  if (onStream) {
    return client.chatStream(request, onStream)
  }

  return client.chat(request)
}

// Check if Ollama is running
export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const endpoint = await getAPIKey('ollama') || 'http://localhost:11434'
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return false
  }
}