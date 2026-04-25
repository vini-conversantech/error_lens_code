import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { getProviderSettings, setProviderSettings, AIProvider, AIProviderConfig } from '../lib/ai'
import {
  X, Key, Check, AlertCircle, ExternalLink,
  User, Globe, Workflow, Puzzle, ShieldCheck,
  Settings, Bell, Cpu, MousePointer2, Monitor,
  MessageSquare, Layers, Code2, Type, Paintbrush,
  AppWindow, MousePointer, Command, Save, Mail,
  Send
} from 'lucide-react'

type SettingsTab = 'agent' | 'notifications' | 'customizations' | 'browser' | 'tab' | 'editor' | 'account' | 'legal' | 'feedback'

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settingsOpen, setSettingsOpen, workspaceName, settings, updateSettings, activeSettingsTab, setSettingsTab } = useAppStore()
  const [providerConfigs, setProviderConfigs] = useState<Record<AIProvider, AIProviderConfig>>({
    openai: { apiKey: '', model: 'gpt-4o' },
    anthropic: { apiKey: '', model: 'claude-3-5-sonnet-20241022' },
    gemini: { apiKey: '', model: 'gemini-1.5-pro' },
    ollama: { apiUrl: 'http://localhost:11434', model: 'llama2', apiKey: '' }
  })
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifSettings, setNotifSettings] = useState({
    aiResponses: true,
    systemUpdates: false,
    errorDetection: true,
    soundEffects: true,
    desktopPush: false
  })

  // Feedback Form State
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' })
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  useEffect(() => {
    if (settingsOpen) {
      getProviderSettings().then(settings => {
        setProviderConfigs(prev => ({
          ...prev,
          [settings.provider]: {
            ...prev[settings.provider],
            apiKey: settings.apiKey || '',
            model: settings.model
          }
        }))
        setSelectedProvider(settings.provider)
      })
    }
  }, [settingsOpen])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setProviderSettings(selectedProvider, providerConfigs[selectedProvider].model || '', providerConfigs[selectedProvider].apiKey || '')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setSettingsOpen(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    setSendingFeedback(true)
    // Simulate API call
    setTimeout(() => {
      setSendingFeedback(false)
      setFeedbackSent(true)
      setFeedback({ name: '', email: '', message: '' })
      setTimeout(() => setFeedbackSent(false), 3000)
    }, 1500)
  }

  if (!settingsOpen) return null

  const sections = [
    {
      title: 'Account',
      items: [
        { id: 'account', label: 'User Profile', icon: User }
      ]
    },
    {
      title: 'Environment',
      items: [
        { id: 'customizations', label: 'Appearance', icon: Paintbrush },
        { id: 'editor', label: 'Text Editor', icon: Code2 },
        { id: 'tab', label: 'Tab Control', icon: AppWindow },
        { id: 'browser', label: 'Browser', icon: Globe },
      ]
    },
    {
      title: 'AI & System',
      items: [
        { id: 'agent', label: 'AI Agent', icon: Cpu },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      title: 'Workspace',
      items: [
        { id: 'current', label: workspaceName || 'Current Project', icon: Workflow, isProject: true }
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'legal', label: 'Privacy & Terms', icon: ShieldCheck },
        { id: 'feedback', label: 'Provide Feedback', icon: MessageSquare }
      ]
    }
  ]

  const providers: { id: AIProvider; name: string; description: string }[] = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-4o, GPT-4o mini' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet, Opus' },
    { id: 'gemini', name: 'Google Gemini', description: 'Gemini 1.5 Pro, Flash' },
    { id: 'ollama', name: 'Ollama', description: 'Local models (Llama, Mistral, etc.)' }
  ]

  return (
    <div className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setSettingsOpen(false)}>
      <div
        className="w-full h-full max-w-6xl max-h-[800px] bg-[#070B10] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-panel/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text">Preferences</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-all group active:scale-95"
            title="Close Settings"
          >
            <X className="w-6 h-6 text-muted group-hover:text-text" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Detailed Sidebar */}
          <div className="w-64 border-r border-white/5 flex flex-col shrink-0 px-3 py-4 gap-6 bg-panel/30 overflow-y-auto no-scrollbar">
            {sections.map(section => (
              <div key={section.title}>
                <h3 className="px-3 mb-2 text-[10px] font-bold text-muted uppercase tracking-widest">{section.title}</h3>
                <div className="space-y-[2px]">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSettingsTab(item.id as SettingsTab)}
                      className={`w-full py-2 px-3 flex items-center gap-2.5 text-[12px] font-medium rounded-lg transition-all text-left group ${activeSettingsTab === item.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted hover:text-text hover:bg-white/5'
                        }`}
                    >
                      <item.icon className={`w-4 h-4 ${activeSettingsTab === item.id ? 'text-white' : 'text-muted/60 group-hover:text-text'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Settings Content Area */}
          <div className="flex-1 p-10 overflow-y-auto bg-background/50 no-scrollbar">
            <div className="max-w-3xl mx-auto">
              {activeSettingsTab === 'customizations' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">Customizations</h1>
                    <p className="text-muted">Personalize the visual environment of ErrorLens Code.</p>
                  </header>

                  <div className="space-y-6">
                    <section>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-4">Color Theme</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'errorlens-dark', name: 'ErrorLens Dark', color: '#0E131A' },
                          { id: 'vs-dark', name: 'Visual Studio Dark', color: '#1E1E1E' },
                          { id: 'amoled', name: 'Amoled Black', color: '#000000' },
                          { id: 'horizon', name: 'Horizon', color: '#1C1E26' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => updateSettings({ theme: t.id })}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${settings.theme === t.id
                              ? 'border-primary bg-primary/10'
                              : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                          >
                            <div className="w-6 h-6 rounded-md shadow-inner" style={{ backgroundColor: t.color }} />
                            <span className="text-sm font-medium text-text">{t.name}</span>
                            {settings.theme === t.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Type className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text">Font Size</div>
                            <div className="text-xs text-muted">Adjust the global editor font size</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateSettings({ fontSize: Math.max(8, settings.fontSize - 1) })}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-md text-text"
                          >-</button>
                          <span className="text-sm font-mono font-bold w-6 text-center">{settings.fontSize}</span>
                          <button
                            onClick={() => updateSettings({ fontSize: Math.min(32, settings.fontSize + 1) })}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-md text-text"
                          >+</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Monitor className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text">Smooth Caret</div>
                            <div className="text-xs text-muted">Enable fluid cursor animations</div>
                          </div>
                        </div>
                        <Toggle
                          enabled={settings.cursorSmoothCaretAnimation === 'on'}
                          onChange={() => updateSettings({ cursorSmoothCaretAnimation: settings.cursorSmoothCaretAnimation === 'on' ? 'off' : 'on' })}
                        />
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'editor' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">Text Editor</h1>
                    <p className="text-muted">Fine-tune the coding experience.</p>
                  </header>

                  <div className="grid gap-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-text">Font Family</div>
                          <div className="text-xs text-muted">Default monospace fonts for editing</div>
                        </div>
                        <select
                          value={settings.fontFamily}
                          onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                          className="bg-panel border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text outline-none focus:border-primary"
                        >
                          <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                          <option value="'Fira Code', monospace">Fira Code</option>
                          <option value="'Source Code Pro', monospace">Source Code Pro</option>
                          <option value="'Menlo', monospace">Menlo</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-5">
                        <div>
                          <div className="text-sm font-semibold text-text">Tab Size</div>
                          <div className="text-xs text-muted">Number of spaces per indentation level</div>
                        </div>
                        <div className="flex bg-panel rounded-lg p-1 border border-white/10">
                          {[2, 4, 8].map(size => (
                            <button
                              key={size}
                              onClick={() => updateSettings({ tabSize: size })}
                              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${settings.tabSize === size ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-text'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-5">
                        <div>
                          <div className="text-sm font-semibold text-text">Minimap</div>
                          <div className="text-xs text-muted">Show a high-level overview of the file</div>
                        </div>
                        <Toggle
                          enabled={settings.minimap}
                          onChange={() => updateSettings({ minimap: !settings.minimap })}
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-5">
                        <div>
                          <div className="text-sm font-semibold text-text">Word Wrap</div>
                          <div className="text-xs text-muted">Wrap lines that exceed the editor width</div>
                        </div>
                        <Toggle
                          enabled={settings.wordWrap === 'on'}
                          onChange={() => updateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'tab' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">Tab Control</h1>
                    <p className="text-muted">Manage how tabs and files are handled.</p>
                  </header>

                  <div className="bg-panel/50 border border-white/5 rounded-2xl p-6 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                          <Save className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text">Auto Save</div>
                          <div className="text-xs text-muted">Save changes automatically after a delay</div>
                        </div>
                      </div>
                      <Toggle
                        enabled={settings.autoSave}
                        onChange={() => updateSettings({ autoSave: !settings.autoSave })}
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <Command className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text">Format on Save</div>
                          <div className="text-xs text-muted">Automatically format code when saving</div>
                        </div>
                      </div>
                      <Toggle
                        enabled={settings.formatOnSave}
                        onChange={() => updateSettings({ formatOnSave: !settings.formatOnSave })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'feedback' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">Send Feedback</h1>
                    <p className="text-muted">Help us improve ErrorLens Code. We read every message.</p>
                  </header>

                  {feedbackSent ? (
                    <div className="py-20 flex flex-col items-center text-center animate-in zoom-in duration-300">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <Check className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-text mb-2">Message Sent!</h2>
                      <p className="text-muted">Thank you for your feedback. We'll get back to you soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendFeedback} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Your Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                            <input
                              type="text"
                              required
                              value={feedback.name}
                              onChange={e => setFeedback({ ...feedback, name: e.target.value })}
                              placeholder="Alex Smith"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-text outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                            <input
                              type="email"
                              required
                              value={feedback.email}
                              onChange={e => setFeedback({ ...feedback, email: e.target.value })}
                              placeholder="alex@example.com"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-text outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Message</label>
                        <textarea
                          rows={6}
                          required
                          value={feedback.message}
                          onChange={e => setFeedback({ ...feedback, message: e.target.value })}
                          placeholder="What would you like us to know? Bugs, feature requests, or praise..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary/50 focus:bg-white/10 transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingFeedback}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                      >
                        {sendingFeedback ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {activeSettingsTab === 'agent' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">AI Agent</h1>
                    <p className="text-muted">Configure how the AI interacts with your projects.</p>
                  </header>

                  <div className="space-y-6">
                    {/* Provider selection */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-4">Select Provider</label>
                      <div className="grid grid-cols-2 gap-4">
                        {providers.map(provider => (
                          <button
                            key={provider.id}
                            onClick={() => setSelectedProvider(provider.id)}
                            className={`p-5 rounded-2xl border text-left transition-all ${selectedProvider === provider.id
                              ? 'border-primary bg-primary/10 shadow-[0_0_30px_-10px_rgba(79,140,255,0.3)]'
                              : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                              }`}
                          >
                            <div className="font-bold text-text mb-1">{provider.name}</div>
                            <div className="text-xs text-muted leading-tight">{provider.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* API Key / Configuration */}
                    <div className="space-y-4">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                        {selectedProvider === 'ollama' ? 'Local Connection' : 'Authentication'}
                      </label>

                      {selectedProvider === 'ollama' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-xs text-muted ml-1">Endpoint URL</span>
                            <input
                              type="text"
                              value={providerConfigs.ollama.apiUrl}
                              onChange={(e) => setProviderConfigs(prev => ({
                                ...prev,
                                ollama: { ...prev.ollama, apiUrl: e.target.value }
                              }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <span className="text-xs text-muted ml-1">Model Name</span>
                            <input
                              type="text"
                              value={providerConfigs.ollama.model}
                              onChange={(e) => setProviderConfigs(prev => ({
                                ...prev,
                                ollama: { ...prev.ollama, model: e.target.value }
                              }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                              type="password"
                              value={providerConfigs[selectedProvider].apiKey || ''}
                              onChange={(e) => setProviderConfigs(prev => ({
                                ...prev,
                                [selectedProvider]: { ...prev[selectedProvider], apiKey: e.target.value }
                              }))}
                              placeholder={selectedProvider === 'openai' ? 'sk-...' : selectedProvider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-text outline-none focus:border-primary/50 transition-all font-mono"
                            />
                          </div>
                          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-xs text-muted leading-relaxed">
                              Your API key is stored securely on your local filesystem. It is never uploaded to our servers, only to the selected provider when you make requests.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'notifications' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">Notifications</h1>
                    <p className="text-muted">Manage system alerts and auditory feedback.</p>
                  </header>

                  <div className="bg-panel/50 border border-white/5 rounded-2xl divide-y divide-white/5">
                    {[
                      { id: 'aiResponses', label: 'AI Synthesis Alerts', desc: 'Notify when reasoning tasks complete' },
                      { id: 'errorDetection', label: 'Real-time Error Detection', desc: 'Visual markers for linting errors' },
                      { id: 'soundEffects', label: 'Contextual Sounds', desc: 'Audio cues for system actions' },
                      { id: 'desktopPush', label: 'Desktop Notifications', desc: 'Show OS alerts when app is backgrounded' },
                    ].map(item => (
                      <div key={item.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-sm font-semibold text-text">{item.label}</div>
                            <div className="text-xs text-muted">{item.desc}</div>
                          </div>
                        </div>
                        <Toggle
                          enabled={(notifSettings as any)[item.id]}
                          onChange={() => setNotifSettings(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSettingsTab === 'legal' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">Privacy & Legal</h1>
                    <p className="text-muted">Security and terms of service information.</p>
                  </header>

                  <div className="space-y-4">
                    <div className="p-8 bg-panel border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-6 h-6 text-green-400" />
                        <h3 className="text-lg font-bold text-text">Local-First Privacy</h3>
                      </div>
                      <p className="text-sm text-muted leading-relaxed mb-6">
                        ErrorLens Code operates entirely on your machine. Your code, workspace history, and reasoning logs never leave your device unless you explicitly interact with a third-party AI provider.
                      </p>
                      <ul className="space-y-2">
                        {['No telemetry collection', 'No cloud sync (unless configured)', 'Encrypted local storage'].map(item => (
                          <li key={item} className="flex items-center gap-2 text-xs text-muted">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'account' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h1 className="text-3xl font-bold text-text mb-2">User Profile</h1>
                    <p className="text-muted">Manage your local identity and credentials.</p>
                  </header>

                  <div className="bg-panel border border-white/5 rounded-2xl p-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-6 shadow-2xl">
                      <User className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-1">Local Developer</h3>
                    <p className="text-sm text-muted mb-8">Offline Account</p>
                    <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-text transition-all">
                      Sync Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-8 py-5 border-t border-white/10 flex items-center justify-between shrink-0 bg-panel/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] text-muted font-mono uppercase tracking-widest font-bold">System Optimized</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSettingsOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-muted hover:text-text transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-10 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 flex items-center gap-2 active:scale-95"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              {saving ? 'Saving...' : saved ? 'Changes Applied' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${enabled ? 'bg-primary' : 'bg-white/10'
        }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all cubic-bezier(0.4, 0, 0.2, 1) duration-300 ${enabled ? 'left-7 shadow-[0_0_12px_rgba(255,255,255,0.6)]' : 'left-1'
          }`}
      />
    </button>
  )
}