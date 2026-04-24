import { 
  SiTypescript, SiJavascript, SiReact, SiPython, SiDart, SiRust, SiGo, 
  SiHtml5, SiCss, SiSass, SiVuedotjs, SiSvelte, SiJson, SiYaml, 
  SiMarkdown, SiDocker, SiGit, SiNpm, SiGnubash, SiGraphql, 
  SiPostcss, SiTailwindcss, SiVite, SiWebpack, SiEslint, SiPrettier,
  SiSwift, SiKotlin, SiPhp, SiRuby, SiCplusplus, SiAndroid, SiApple,
  SiLinux, SiFlutter
} from 'react-icons/si'
import { 
  VscFile, VscFileCode, VscFilePdf, VscFileMedia, VscFileZip,
  VscFolder, VscFolderOpened, VscGear, VscLock, VscKey,
  VscSymbolClass, VscDatabase, VscSymbolStructure, VscChecklist,
  VscCode, VscBeaker, VscSettingsGear, VscTerminal, VscDebugAlt
} from 'react-icons/vsc'
import { 
  DiJava, DiDatabase, DiCoda
} from 'react-icons/di'
import { FaC, FaFolder, FaFolderOpen, FaBrain, FaWindows } from 'react-icons/fa6'
import { TbBrandCSharp } from 'react-icons/tb'

interface FileIconProps {
  filename: string
  isDirectory?: boolean
  isOpen?: boolean
  className?: string
  size?: number
}

// VS Code Material Icon Theme Colors
const COLORS = {
  ts: '#1976d2',
  tsx: '#0288d1',
  js: '#fbc02d',
  jsx: '#0288d1',
  py: '#388e3c',
  dart: '#00bcd4',
  rust: '#e64a19',
  go: '#00acc1',
  html: '#e65100',
  css: '#0277bd',
  sass: '#c2185b',
  vue: '#43a047',
  svelte: '#ff3e00',
  json: '#fbc02d',
  yaml: '#d32f2f',
  md: '#03a9f4',
  docker: '#0277bd',
  git: '#f4511e',
  npm: '#c62828',
  bash: '#43a047',
  sql: '#f57c00',
  folder: '#607d8b', // Professional Gray/Slate for folders
  file: '#90a4ae',
  c: '#0070bc',
  cpp: '#004482',
  cs: '#a179dc'
}

function getFileIconElement(filename: string, size: number) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const lowerName = filename.toLowerCase()

  // Special Filenames
  if (lowerName === 'package.json' || lowerName === 'package-lock.json') return <SiNpm size={size} color={COLORS.npm} />
  if (lowerName.includes('tsconfig')) return <SiTypescript size={size} color={COLORS.ts} />
  if (lowerName.includes('dockerfile')) return <SiDocker size={size} color={COLORS.docker} />
  if (lowerName.includes('git')) return <SiGit size={size} color={COLORS.git} />
  if (lowerName.includes('vite.config')) return <SiVite size={size} color="#646CFF" />
  if (lowerName.includes('tailwind.config')) return <SiTailwindcss size={size} color="#06B6D4" />
  if (lowerName === 'readme.md') return <SiMarkdown size={size} color={COLORS.md} />

  switch (ext) {
    case 'ts': return <SiTypescript size={size} color={COLORS.ts} />
    case 'tsx': return <SiReact size={size} color={COLORS.tsx} />
    case 'js':
    case 'mjs':
    case 'cjs': return <SiJavascript size={size} color={COLORS.js} />
    case 'jsx': return <SiReact size={size} color={COLORS.jsx} />
    case 'py': return <SiPython size={size} color={COLORS.py} />
    case 'dart': return <SiDart size={size} color={COLORS.dart} />
    case 'rs': return <SiRust size={size} color={COLORS.rust} />
    case 'go': return <SiGo size={size} color={COLORS.go} />
    case 'java': return <DiJava size={size + 2} color="#f44336" />
    case 'c': return <FaC size={size} color={COLORS.c} />
    case 'cpp': return <SiCplusplus size={size} color={COLORS.cpp} />
    case 'cs': return <TbBrandCSharp size={size} color={COLORS.cs} />
    case 'html': return <SiHtml5 size={size} color={COLORS.html} />
    case 'css': return <SiCss size={size} color={COLORS.css} />
    case 'scss':
    case 'sass': return <SiSass size={size} color={COLORS.sass} />
    case 'vue': return <SiVuedotjs size={size} color={COLORS.vue} />
    case 'svelte': return <SiSvelte size={size} color={COLORS.svelte} />
    case 'json': return <SiJson size={size} color={COLORS.json} />
    case 'yaml':
    case 'yml': return <SiYaml size={size} color={COLORS.yaml} />
    case 'md': return <SiMarkdown size={size} color={COLORS.md} />
    case 'sh': return <SiGnubash size={size} color={COLORS.bash} />
    case 'sql': return <VscDatabase size={size} color={COLORS.sql} />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg': return <VscFileMedia size={size} color="#4caf50" />
    case 'pdf': return <VscFilePdf size={size} color="#f44336" />
    case 'zip':
    case 'tar':
    case 'gz': return <VscFileZip size={size} color="#fb8c00" />
    default: return <VscFile size={size} color={COLORS.file} />
  }
}

function getFolderIconElement(name: string, isOpen: boolean, size: number) {
  const lowerName = name.toLowerCase()
  const iconSize = size + 2
  
  // Folder colors - Using a refined slate gray as the base
  const baseColor = COLORS.folder 

  // Specialized folders
  if (lowerName === 'node_modules') return <SiNpm size={size} color={COLORS.npm} />
  if (lowerName === '.git') return <SiGit size={size} color={COLORS.git} />
  if (lowerName === 'src' || lowerName === 'lib') return <VscCode size={iconSize} color="#4fc3f7" />
  if (lowerName === 'test' || lowerName === 'tests') return <VscBeaker size={iconSize} color="#81c784" />
  if (lowerName === 'assets' || lowerName === 'public' || lowerName === 'static') return <VscFileMedia size={iconSize} color="#ba68c8" />
  if (lowerName === 'android') return <SiAndroid size={size} color="#a4c639" />
  if (lowerName === 'ios' || lowerName === 'macos') return <SiApple size={size} color="#90a4ae" />
  if (lowerName === 'web') return <SiHtml5 size={size} color="#e65100" />
  if (lowerName === 'windows') return <FaWindows size={size} color="#0078d7" />
  if (lowerName === 'linux') return <SiLinux size={size} color="#333333" />
  if (lowerName === '.dart_tool' || lowerName === 'build') return <SiDart size={size} color="#00bcd4" />
  if (lowerName === '.idea' || lowerName === '.vscode') return <VscSettingsGear size={iconSize} color="#78909c" />

  return isOpen 
    ? <VscFolderOpened size={iconSize} color={baseColor} /> 
    : <VscFolder size={iconSize} color={baseColor} />
}

export default function FileIcon({ filename, isDirectory = false, isOpen = false, className = '', size = 16 }: FileIconProps) {
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      {isDirectory ? getFolderIconElement(filename, isOpen, size) : getFileIconElement(filename, size)}
    </span>
  )
}
