import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { getProviderSettings, setProviderSettings, AIProvider, AIProviderConfig } from '../lib/ai'
import {
  X, Key, Check, AlertCircle, ExternalLink,
  User, Globe, Workflow, Puzzle, ShieldCheck,
  Settings, Bell, Cpu, MousePointer2, Monitor,
  MessageSquare, Layers, Code2
} from 'lucide-react'

type SettingsTab = 'agent' | 'notifications' | 'models' | 'customizations' | 'browser' | 'tab' | 'editor' | 'account' | 'legal'

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settingsOpen, setSettingsOpen, workspaceName } = useAppStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('agent')
  const [providerConfigs, setProviderConfigs] = useState<Record<AIProvider, AIProviderConfig>>({
    openai: { apiKey: '', model: 'gpt-4o' },
    anthropic: { apiKey: '', model: 'claude-3-5-sonnet-20241022' },
    gemini: { apiKey: '', model: 'gemini-1.5-pro' },
    ollama: { apiUrl: 'http://localhost:11434', model: 'llama2', apiKey: '' }
  })
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
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
      title: 'Global',
      items: [
        { id: 'agent', label: 'AI Agent', icon: Cpu },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'models', label: 'AI Models', icon: Layers },
        { id: 'customizations', label: 'Customizations', icon: MousePointer2 },
        { id: 'browser', label: 'Browser', icon: Globe },
        { id: 'tab', label: 'Tab Control', icon: Monitor },
        { id: 'editor', label: 'Text Editor', icon: Code2 }
      ]
    },
    {
      title: 'Workspaces',
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
    <div className="absolute inset-0 z-[100] bg-[#070B10] flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
      <div className="flex-1 flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-panel shrink-0">
          <div className="flex items-center gap-3 pt-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text">Preferences</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Detailed Sidebar */}
          <div className="w-64 border-r border-white/5 flex flex-col shrink-0 px-3 py-4 gap-6 bg-panel overflow-y-auto no-scrollbar">
            {sections.map(section => (
              <div key={section.title}>
                <h3 className="px-3 mb-2 text-[10px] font-bold text-muted uppercase tracking-widest">{section.title}</h3>
                <div className="space-y-[2px]">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as SettingsTab)}
                      className={`w-full py-1.5 px-3 flex items-center gap-2.5 text-[12px] font-medium rounded-md transition-all text-left group ${activeTab === item.id
                        ? 'bg-primary/20 text-text ring-1 ring-primary/30'
                        : 'text-muted hover:text-text hover:bg-white/5'
                        }`}
                    >
                      <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-primary' : 'text-muted/60 group-hover:text-text'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Settings Content Area */}
          <div className="flex-1 p-8 overflow-y-auto bg-background/30 no-scrollbar">
            <div className="max-w-3xl">
              {(activeTab === 'agent' || activeTab === 'models') && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h1 className="text-2xl font-bold text-text mb-2">AI Capabilities</h1>
                    <p className="text-sm text-muted">Configure how the AntiGravity agent interacts with your codebase.</p>
                  </header>

                  <div className="space-y-6">
                    {/* Provider selection */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-3">AI Provider</label>
                      <div className="grid grid-cols-2 gap-3">
                        {providers.map(provider => (
                          <button
                            key={provider.id}
                            onClick={() => setSelectedProvider(provider.id)}
                            className={`p-4 rounded-xl border text-left transition-all ${selectedProvider === provider.id
                              ? 'border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(79,140,255,0.2)]'
                              : 'border-white/5 bg-white/20 hover:border-white/20 hover:bg-white/5'
                              }`}
                          >
                            <div className="font-semibold text-text text-sm">{provider.name}</div>
                            <div className="text-[11px] text-muted mt-1 leading-tight">{provider.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* API Key / Configuration */}
                    <div className="space-y-4">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                        {selectedProvider === 'ollama' ? 'Ollama Configuration' : 'Connection Details'}
                      </label>

                      {selectedProvider === 'ollama' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <span className="text-[11px] text-muted">Endpoint URL</span>
                            <input
                              type="text"
                              value={providerConfigs.ollama.apiUrl}
                              onChange={(e) => setProviderConfigs(prev => ({
                                ...prev,
                                ollama: { ...prev.ollama, apiUrl: e.target.value }
                              }))}
                              className="w-full bg-panel border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[11px] text-muted">Model ID</span>
                            <input
                              type="text"
                              value={providerConfigs.ollama.model}
                              onChange={(e) => setProviderConfigs(prev => ({
                                ...prev,
                                ollama: { ...prev.ollama, model: e.target.value }
                              }))}
                              className="w-full bg-panel border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                              type="password"
                              value={providerConfigs[selectedProvider].apiKey || ''}
                              onChange={(e) => setProviderConfigs(prev => ({
                                ...prev,
                                [selectedProvider]: { ...prev[selectedProvider], apiKey: e.target.value }
                              }))}
                              placeholder={selectedProvider === 'openai' ? 'sk-...' : selectedProvider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                              className="w-full bg-panel border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all font-mono"
                            />
                          </div>
                          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex gap-3 italic">
                            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-[11px] text-muted leading-snug">
                              Your API key is stored locally on this machine. It is only sent to the {selectedProvider} servers when making requests.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <a
                      href={selectedProvider === 'openai' ? 'https://platform.openai.com/api-keys' :
                        selectedProvider === 'anthropic' ? 'https://console.anthropic.com/' :
                          'https://aistudio.google.com/app/apikey'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      Get {selectedProvider} API Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'legal' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h1 className="text-2xl font-bold text-text mb-2">Legal & Trust</h1>
                    <p className="text-sm text-muted">Important information about data usage and your rights.</p>
                  </header>

                  <div className="bg-panel border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                      <h3 className="font-semibold text-text mb-2">Privacy Commitment</h3>
                      <p className="text-sm text-muted leading-relaxed">
                        ErrorLens Code is built on a "Local-First" philosophy. We do not collect analytics, crash reports, or your source code. Everything stays in your encrypted workspace database.
                      </p>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-text mb-2">Terms of Service</h3>
                      <p className="text-sm text-muted leading-relaxed italic">
                        The software is provided "as is", without warranty of any kind. You are responsible for any costs incurred through third-party AI APIs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!['agent', 'models', 'legal'].includes(activeTab) && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-text mb-1">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
                  <p className="text-sm text-muted max-w-xs">These configuration options will be available in a future version of ErrorLens Code.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between shrink-0 bg-panel">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] text-muted font-mono uppercase tracking-widest">System Online</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsOpen(false)}
              className="px-5 py-2 text-[12px] font-medium text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-8 py-2 rounded-lg text-[12px] font-semibold transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              {saving ? 'Saving...' : saved ? 'Preferences Saved' : 'Save & Reload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}