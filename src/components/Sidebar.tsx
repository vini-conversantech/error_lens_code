import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore, FileItem } from '../store/appStore'
import { useEditorStore, detectLanguage } from '../store/editorStore'
import { v4 as uuidv4 } from 'uuid'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Search,
  Settings,
  GitBranch,
  Plus,
  RefreshCw,
  MinusSquare,
  Library,
  MoreHorizontal,
  Clock
} from 'lucide-react'
import { VscNewFile, VscNewFolder, VscCollapseAll, VscRefresh, VscEllipsis } from 'react-icons/vsc'
import FileIcon from './FileIcon'

interface SidebarProps {
  onOpenFolder: () => void
}

export default function Sidebar({ onOpenFolder }: SidebarProps) {
  const { workspacePath, workspaceName, files, setFiles, gitStatus, setGitStatus } = useAppStore()
  const { addTab } = useEditorStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isDirectory: boolean } | null>(null)
  const [width, setWidth] = useState(240)
  const [isResizing, setIsResizing] = useState(false)
  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    defaultValue: string;
    onResolve: (value: string | null) => void;
  }>({ isOpen: false, title: '', placeholder: '', defaultValue: '', onResolve: () => { } });

  const getPromptValue = (title: string, placeholder: string, defaultValue: string = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptConfig({
        isOpen: true,
        title,
        placeholder,
        defaultValue,
        onResolve: (value) => {
          setPromptConfig(prev => ({ ...prev, isOpen: false }))
          resolve(value)
        }
      })
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      let newWidth = e.clientX
      if (newWidth < 140) newWidth = 140
      if (newWidth > 500) newWidth = 500
      setWidth(newWidth)
    }

    const handleMouseUp = () => setIsResizing(false)

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const toggleFolder = useCallback(async (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
      // Load children if not loaded
      const loadChildren = async () => {
        const result = await window.electronAPI.listFiles(path)
        if (result.success && result.items) {
          const children = result.items
            .map((item: any) => ({
              name: item.name,
              path: item.path,
              isDirectory: item.isDirectory,
              children: item.isDirectory ? [] : undefined,
              isExpanded: false
            }))

          setFiles(files => {
            const updateChildren = (items: FileItem[]): FileItem[] => {
              return items.map(item => {
                if (item.path === path) {
                  return { ...item, children, isExpanded: true }
                }
                if (item.children) {
                  return { ...item, children: updateChildren(item.children) }
                }
                return item
              })
            }
            return updateChildren(files)
          })
        }
      }
      loadChildren()
    }
    setExpandedPaths(newExpanded)
  }, [expandedPaths, setFiles])

  const handleFileClick = useCallback(async (item: FileItem) => {
    if (item.isDirectory) {
      toggleFolder(item.path)
    } else {
      try {
        const result = await window.electronAPI.readFile(item.path)
        if (result.success && result.content !== undefined) {
          addTab({
            id: uuidv4(),
            path: item.path,
            name: item.name,
            content: result.content,
            language: detectLanguage(item.name),
            isDirty: false
          })
        }
      } catch (error) {
        console.error('Failed to open file:', error)
      }
    }
  }, [addTab, toggleFolder])

  const handleCollapseAll = () => {
    setExpandedPaths(new Set())
  }

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, path: item.path, isDirectory: item.isDirectory })
  }

  const handleCreateFile = async () => {
    if (!contextMenu) return
    const name = await getPromptValue('New File', 'Enter file name (e.g., index.ts)')
    if (name) {
      const newPath = contextMenu.isDirectory
        ? `${contextMenu.path}/${name}`
        : `${workspacePath}/${name}`
      await window.electronAPI.createFile(newPath)
      setContextMenu(null)
    }
  }

  const handleCreateFolder = async () => {
    if (!contextMenu) return
    const name = await getPromptValue('New Folder', 'Enter folder name (e.g., components)')
    if (name) {
      const newPath = contextMenu.isDirectory
        ? `${contextMenu.path}/${name}`
        : `${workspacePath}/${name}`
      await window.electronAPI.createDirectory(newPath)
      setContextMenu(null)
    }
  }

  const handleDelete = async () => {
    if (!contextMenu) return
    if (confirm('Are you sure you want to delete this?')) {
      await window.electronAPI.delete(contextMenu.path)
      setContextMenu(null)
    }
  }

  const handleRefresh = async () => {
    if (workspacePath) {
      const result = await window.electronAPI.listFiles(workspacePath)
      if (result.success && result.items) {
        setFiles(result.items.map((item: any) => ({
          name: item.name,
          path: item.path,
          isDirectory: item.isDirectory,
          children: item.isDirectory ? [] : undefined,
          isExpanded: false
        })))
      }
    }
  }

  const filteredFiles = searchQuery
    ? filterFiles(files, searchQuery.toLowerCase())
    : files

  const renderFileTree = (items: FileItem[], depth: number = 0) => {
    // Sort: directories first, then files, both alphabetically
    const sorted = [...items].sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return sorted.map(item => {
      const isExpanded = expandedPaths.has(item.path)
      return (
        <div key={item.path}>
          <div
            className="flex items-center gap-1 py-[2px] px-1 cursor-pointer hover:bg-white/5 rounded-sm group transition-colors"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => handleFileClick(item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            {item.isDirectory ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                )}
                <FileIcon filename={item.name} isDirectory isOpen={isExpanded} className="shrink-0" />
              </>
            ) : (
              <>
                <span className="w-3 shrink-0" />
                <FileIcon filename={item.name} className="shrink-0" />
              </>
            )}
            <span className="flex-1 truncate text-[12px] text-text/80 group-hover:text-text leading-tight ml-1">
              {item.name}
            </span>
          </div>
          {item.isDirectory && isExpanded && item.children && (
            <div>
              {renderFileTree(item.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div style={{ width }} className="relative h-full bg-panel border-r border-border flex flex-col shrink-0 overflow-x-hidden">
      <div
        className="absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize z-50 hover:bg-primary/50 active:bg-primary transition-colors"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
      />

      {/* Explorer Header */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Explorer</span>
        <VscEllipsis className="w-4 h-4 text-muted cursor-pointer hover:text-text transition-colors" />
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
        {workspacePath ? (
          <>
            {/* Project folder name with actions */}
            <div className="flex items-center justify-between px-3 py-1 group">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer" onClick={handleRefresh}>
                <ChevronDown className="w-3 h-3 text-muted shrink-0" />
                <span className="text-[11px] font-semibold text-text uppercase tracking-wide truncate">
                  {workspaceName}
                </span>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setContextMenu({ x: 60, y: 120, path: workspacePath, isDirectory: true })
                    handleCreateFile()
                  }}
                  className="p-1 hover:bg-white/10 rounded flex items-center justify-center"
                  title="New File"
                >
                  <VscNewFile className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={() => {
                    setContextMenu({ x: 60, y: 120, path: workspacePath, isDirectory: true })
                    handleCreateFolder()
                  }}
                  className="p-1 hover:bg-white/10 rounded flex items-center justify-center"
                  title="New Folder"
                >
                  <VscNewFolder className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={handleRefresh}
                  className="p-1 hover:bg-white/10 rounded flex items-center justify-center"
                  title="Refresh Explorer"
                >
                  <VscRefresh className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={handleCollapseAll}
                  className="p-1 hover:bg-white/10 rounded flex items-center justify-center"
                  title="Collapse All Folders"
                >
                  <VscCollapseAll className="w-4 h-4 text-muted" />
                </button>
              </div>
            </div>
            {renderFileTree(filteredFiles)}
          </>
        ) : (
          <div className="p-3 text-center">
            <p className="text-muted text-[12px] mb-3">No folder open</p>
            <button onClick={onOpenFolder} className="btn-primary text-[12px] px-3 py-1.5">
              Open Folder
            </button>
          </div>
        )}
      </div>

      {/* Git branch indicator */}
      {gitStatus?.isRepo && (
        <div className="px-3 py-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-[11px]">
            <GitBranch className="w-3 h-3 text-muted" />
            <span className="text-muted truncate">{gitStatus.current}</span>
            {gitStatus.ahead > 0 && (
              <span className="text-success">↑{gitStatus.ahead}</span>
            )}
            {gitStatus.behind > 0 && (
              <span className="text-warning">↓{gitStatus.behind}</span>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="px-3 py-2 border-t border-border">
        <button
          // onClick={() => useAppStore.getState().setSettingsOpen(true)}
          className="flex items-center gap-1.5 text-muted hover:text-text transition-colors w-full"
        >
          <Clock className="w-3 h-3" />
          <span className="text-[11px]">Timeline</span>
        </button>
      </div>

      {/* Context menu - fixed positioning with boundary checks */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-[101] min-w-[180px] bg-panel border border-border rounded-lg shadow-2xl py-1 backdrop-blur-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.isDirectory && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-text hover:bg-white/5 cursor-pointer transition-colors" onClick={handleCreateFile}>
                  <Plus className="w-3 h-3 text-muted" />
                  <span>New File...</span>
                  <span className="ml-auto text-[9px] text-muted/50">⌘N</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-text hover:bg-white/5 cursor-pointer transition-colors" onClick={handleCreateFolder}>
                  <Folder className="w-3 h-3 text-muted" />
                  <span>New Folder...</span>
                  <span className="ml-auto text-[9px] text-muted/50">⇧⌘N</span>
                </div>
                <div className="h-px bg-border my-1 mx-2" />
              </>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-text hover:bg-white/5 cursor-pointer transition-colors" onClick={() => {
              window.electronAPI.showItemInFolder?.(contextMenu.path)
              setContextMenu(null)
            }}>
              <span className="w-3 h-3 flex items-center justify-center text-muted text-[10px]">🔍</span>
              <span>Reveal in Finder</span>
              <span className="ml-auto text-[9px] text-muted/50">⌥⌘R</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-text hover:bg-white/5 cursor-pointer transition-colors" onClick={() => {
              navigator.clipboard.writeText(contextMenu.path)
              setContextMenu(null)
            }}>
              <span className="w-3 h-3 flex items-center justify-center text-muted text-[10px]">📋</span>
              <span>Copy Path</span>
              <span className="ml-auto text-[9px] text-muted/50">⌥⌘C</span>
            </div>

            <div className="h-px bg-border my-1 mx-2" />

            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-text hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setContextMenu(null)}>
              <span className="w-3 h-3 flex items-center justify-center text-muted text-[10px]">✎</span>
              <span>Rename...</span>
              <span className="ml-auto text-[9px] text-muted/50">↩</span>
            </div>

            <div className="h-px bg-border my-1 mx-2" />

            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-error hover:bg-error/10 cursor-pointer transition-colors" onClick={handleDelete}>
              <span className="w-3 h-3 flex items-center justify-center text-[10px]">⌫</span>
              <span>Delete</span>
              <span className="ml-auto text-[9px] opacity-50">⌘⌫</span>
            </div>
          </div>
        </>
      )}

      {/* Custom Prompt Modal */}
      {promptConfig.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-panel border border-border p-4 rounded-xl w-full max-w-sm shadow-2xl animate-fade-in mx-4">
            <h3 className="font-semibold text-text text-sm mb-3">{promptConfig.title}</h3>
            <input
              type="text"
              autoFocus
              placeholder={promptConfig.placeholder}
              defaultValue={promptConfig.defaultValue}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] mb-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') promptConfig.onResolve(e.currentTarget.value)
                if (e.key === 'Escape') promptConfig.onResolve(null)
              }}
              onBlur={(e) => promptConfig.onResolve(e.currentTarget.value)}
            />
            <div className="text-[10px] text-muted">Press Enter to confirm, Esc to cancel.</div>
          </div>
        </div>
      )}
    </div>
  )
}

function filterFiles(items: FileItem[], query: string): FileItem[] {
  const result: FileItem[] = []

  for (const item of items) {
    if (item.name.toLowerCase().includes(query)) {
      result.push(item)
    } else if (item.isDirectory && item.children) {
      const filteredChildren = filterFiles(item.children, query)
      if (filteredChildren.length > 0) {
        result.push({ ...item, children: filteredChildren, isExpanded: true })
      }
    }
  }

  return result
}