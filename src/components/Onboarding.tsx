import React, { useState } from 'react'
import { Check, Shield, Zap, Sparkles, Code2, Rocket, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const setOnboarded = useAppStore((state) => state.setOnboarded)

  const handleComplete = () => {
    setOnboarded(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070B10] text-[#EAF2FF] overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" />

      <div className="relative w-full max-w-2xl px-6">
        <div className="glass p-8 md:p-12 rounded-[32px] border-white/10 shadow-2xl">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-violet-600 rounded-2xl flex items-center justify-center mb-6 glow-primary">
              <Code2 size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              Welcome to <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">ErrorLens Code</span>
            </h1>
            <p className="text-muted text-lg max-w-md">
              The AI-first IDE designed for speed, intelligence, and a seamless developer experience.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-muted mb-1 block">Email</label>
                      <input 
                        type="email" 
                        placeholder="admin@gmail.com" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1 block">Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (email === 'admin@gmail.com' && password === 'Admin@123') {
                              setStep(2)
                              setLoginError('')
                            } else {
                              setLoginError('Invalid credentials.')
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  {loginError && <p className="text-red-400 text-xs glow-red">{loginError}</p>}
                </div>

                <button
                  onClick={() => {
                    if (email === 'admin@gmail.com' && password === 'Admin@123') {
                      setStep(2)
                      setLoginError('')
                    } else {
                      setLoginError('Invalid credentials.')
                    }
                  }}
                  className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bg-primary text-white shadow-glow-primary hover:scale-[1.01] active:scale-[0.99]"
                >
                  Login <ArrowRight size={20} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                    <div>
                      <h3 className="font-semibold">Open a Project</h3>
                      <p className="text-sm text-muted">Click the folder icon to start coding.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">2</div>
                    <div>
                      <h3 className="font-semibold">Ask AI Anything</h3>
                      <p className="text-sm text-muted">Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 text-xs font-mono">⌘ K</kbd> to talk to the AI assistant.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">3</div>
                    <div>
                      <h3 className="font-semibold">Automatic Fixes</h3>
                      <p className="text-sm text-muted">Hover over errors to get instant AI suggestions.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-4 bg-gradient-to-r from-primary to-violet-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  Launch Editor <Rocket size={20} />
                </button>
                
                <button 
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-muted text-sm hover:text-text transition-colors"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-1.5 mt-8">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${step === 1 ? 'w-4 bg-primary' : 'bg-white/20'}`} />
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${step === 2 ? 'w-4 bg-primary' : 'bg-white/20'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
