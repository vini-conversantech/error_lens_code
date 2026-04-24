// Utility functions

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Format date
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

// Get file icon based on extension
export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const iconMap: Record<string, string> = {
    // Code
    js: '📜',
    jsx: '⚛️',
    ts: '📘',
    tsx: '⚛️',
    py: '🐍',
    rb: '💎',
    rs: '🦀',
    go: '🐹',
    java: '☕',
    c: '🔧',
    cpp: '🔧',
    h: '🔧',
    hpp: '🔧',
    cs: '🔵',
    php: '🐘',
    swift: '🍎',
    kt: '🟣',
    
    // Web
    html: '🌐',
    htm: '🌐',
    css: '🎨',
    scss: '🎨',
    less: '🎨',
    vue: '💚',
    svelte: '🔥',
    
    // Data
    json: '📋',
    yaml: '📋',
    yml: '📋',
    xml: '📋',
    toml: '⚙️',
    ini: '⚙️',
    
    // Docs
    md: '📝',
    markdown: '📝',
    txt: '📄',
    pdf: '📕',
    
    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    webp: '🖼️',
    
    // Config
    gitignore: '🔀',
    dockerfile: '🐳',
    env: '🔐',
    
    // Other
    sh: '💻',
    bash: '💻',
    zsh: '💻',
    sql: '🗃️',
    graphql: '◼️',
  }
  
  return iconMap[ext] || '📄'
}

// Get folder icon
export function getFolderIcon(name: string): string {
  const folderIcons: Record<string, string> = {
    src: '📂',
    source: '📂',
    lib: '📚',
    libs: '📚',
    dist: '📦',
    build: '📦',
    out: '📦',
    node_modules: '📦',
    packages: '📦',
    public: '🌐',
    static: '🌐',
    assets: '🖼️',
    images: '🖼️',
    img: '🖼️',
    styles: '🎨',
    css: '🎨',
    components: '🧩',
    pages: '📄',
    routes: '🔀',
    utils: '🔧',
    helpers: '🔧',
    services: '⚡',
    api: '🌐',
    hooks: '🪝',
    context: '🔐',
    store: '🏪',
    config: '⚙️',
    tests: '🧪',
    test: '🧪',
    specs: '🧪',
    __tests__: '🧪',
    e2e: '🔄',
    docs: '📚',
    documentation: '📚',
    examples: '💡',
    scripts: '📜',
    tools: '🔧',
    bin: '⚙️',
  }
  
  return folderIcons[name.toLowerCase()] || '📁'
}

// Truncate string
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Download file
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Class name helper
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Check if file is hidden
export function isHiddenFile(filename: string): boolean {
  return filename.startsWith('.') || filename === 'node_modules'
}

// Get relative path
export function getRelativePath(basePath: string, targetPath: string): string {
  const base = basePath.replace(/\\/g, '/').replace(/\/$/, '')
  const target = targetPath.replace(/\\/g, '/')
  
  if (!target.startsWith(base)) return target
  
  return target.slice(base.length + 1)
}

// Parse language from filename
export function parseLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    md: 'markdown',
    markdown: 'markdown',
    dockerfile: 'dockerfile',
    toml: 'toml',
    ini: 'ini',
    graphql: 'graphql',
    vue: 'vue',
    svelte: 'svelte',
  }
  
  return langMap[ext] || 'plaintext'
}

// Keyboard shortcut helpers
export function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl'
}