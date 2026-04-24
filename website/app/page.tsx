'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Cpu, Code2, Zap, ShieldCheck,
  Github, Twitter, MessageSquare, ChevronRight,
  Globe, Layout, Sparkles, Terminal
} from 'lucide-react'

export default function LandingPage() {
  const [platform, setPlatform] = useState<'mac' | 'win' | 'linux'>('mac')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) setPlatform('win')
    else if (userAgent.includes('linux')) setPlatform('linux')
    else setPlatform('mac')

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getDownloadText = () => {
    if (platform === 'mac') return 'Download for macOS'
    if (platform === 'win') return 'Download for Windows'
    return 'Download for Linux'
  }

  const getDownloadIcon = () => {
    return <Download className="w-5 h-5" />
  }

  const features = [
    {
      title: 'Zero Latency Monaco',
      desc: 'Blazing fast code editing optimized for massive monorepos.',
      icon: Zap,
      color: 'text-yellow-400'
    },
    {
      title: 'Built-in Agentic AI',
      desc: 'Your IDE understands your entire codebase, not just the file.',
      icon: Cpu,
      color: 'text-primary'
    },
    {
      title: 'Local-First Privacy',
      desc: 'Your code stays on your machine. No telemetry, no tracking.',
      icon: ShieldCheck,
      color: 'text-green-400'
    },
    {
      title: 'Cloud Sync Toggle',
      desc: 'Sync settings across devices only when you want to.',
      icon: Globe,
      color: 'text-blue-400'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/70 backdrop-blur-md border-b border-white/5 py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xl">EL</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">ErrorLens Code</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Changelog</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com" className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-all shadow-xl hover:scale-105 active:scale-95">
              Launch Web Editor
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 pt-32 sm:pt-48 px-6 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] font-medium text-primary mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Introducing Version 1.0.0 — The AI Era begins</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
              Code at the Speed of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Thought.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
              Experience the world's most performant IDE. Built for developers who refuse to wait. Zero latency. Secure agentic AI. Beautiful interface.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <button className="group relative bg-primary hover:bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all shadow-[0_20px_50px_-20px_rgba(79,140,255,0.5)] hover:scale-105 active:scale-95 flex items-center gap-3">
                {getDownloadIcon()}
                {getDownloadText()}
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="px-10 py-5 rounded-2xl text-lg font-bold text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                <Github className="w-5 h-5" />
                View Source
              </button>
            </div>
          </motion.div>

          {/* App Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[100px] scale-90 -z-10" />
            <div className="glass-card p-2 p-2 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-10 bg-white/5 flex items-center px-4 gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="mx-auto text-[11px] text-muted/60 font-mono">ErrorLens Code — main.tsx</div>
              </div>
              <div className="mt-10 aspect-video rounded-xl bg-background border border-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full p-8 font-mono text-[10px] text-primary/40 leading-relaxed overflow-hidden">
                    {`import { createRoot } from 'react-dom/client';\nimport App from './App';\n\nconst root = createRoot(document.getElementById('root'));\nroot.render(<App />);\n\n// ErrorLens optimized render sequence\nfunction initializeIDE() {\n  console.log('Error LEns Core Active');\n  // ... boot sequence`}
                  </div>
                </div>
                <Code2 className="w-20 h-20 text-white/10" />
                <div className="absolute bottom-8 right-8 flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg animate-bounce">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary">AI Optimized</span>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Built for the next decade.</h2>
            <p className="text-muted text-lg">Every detail engineered for professional performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -10 }}
                className="glass-card p-8 group hover:border-primary/30 transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social / Footer Info */}
      <footer className="py-20 px-6 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">EL</span>
              </div>
              <span className="text-lg font-bold text-white">ErrorLens Code</span>
            </div>
            <p className="text-xs text-muted">© 2026 DeepMind Advanced Agentic Coding. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-muted hover:text-white transition-colors text-sm">Terms</a>
            <a href="#" className="text-muted hover:text-white transition-colors text-sm">Privacy</a>
            <a href="#" className="text-muted hover:text-white transition-colors text-sm">Twitter</a>
            <a href="#" className="text-muted hover:text-white transition-colors text-sm">Community</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
