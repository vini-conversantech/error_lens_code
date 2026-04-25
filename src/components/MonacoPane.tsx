import { useRef, useEffect, useCallback } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { useEditorStore } from '../store/editorStore'
import { useAppStore } from '../store/appStore'
import * as monaco from 'monaco-editor'
import MediaViewer from './MediaViewer'

// Configure Monaco workers
self.MonacoEnvironment = {
  getWorker: function (_workerId: string, label: string) {
    const getWorkerModule = (moduleUrl: string, label: string) => {
      return new Worker(self.MonacoEnvironment!.getWorkerUrl!(moduleUrl, label), {
        name: label,
        type: 'module'
      })
    }

    switch (label) {
      case 'json':
        return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label)
      case 'css':
      case 'scss':
      case 'less':
        return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label)
      case 'html':
      case 'handlebars':
      case 'razor':
        return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label)
      case 'typescript':
      case 'javascript':
        return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label)
      default:
        return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label)
    }
  }
}

export default function MonacoPane() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const { tabs, activeTabId, updateTabContent, setSelectedText, getActiveTab } = useEditorStore()
  const { workspacePath, settings } = useAppStore()

  const activeTab = tabs.find(t => t.id === activeTabId)

  // Update theme when settings change
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(settings.theme)
    }
  }, [settings.theme])

  const handleEditorMount: OnMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor

    // Define custom themes
    monacoInstance.editor.defineTheme('errorlens-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF7B72' },
        { token: 'string', foreground: 'A5D6FF' },
        { token: 'number', foreground: '79C0FF' },
        { token: 'type', foreground: 'FFA657' },
        { token: 'function', foreground: 'D2A8FF' },
        { token: 'variable', foreground: 'FFA657' },
        { token: 'constant', foreground: '79C0FF' },
      ],
      colors: {
        'editor.background': '#0E131A',
        'editor.foreground': '#EAF2FF',
        'editor.lineHighlightBackground': '#121923',
        'editor.selectionBackground': '#4F8CFF40',
        'editor.inactiveSelectionBackground': '#4F8CFF20',
        'editorLineNumber.foreground': '#484F58',
        'editorLineNumber.activeForeground': '#EAF2FF',
        'editorCursor.foreground': '#4F8CFF',
        'editor.findMatchBackground': '#4F8CFF40',
        'editor.findMatchHighlightBackground': '#4F8CFF20',
        'editorGutter.background': '#0E131A',
        'editorWidget.background': '#121923',
        'editorWidget.border': '#2A313C',
        'input.background': '#0E131A',
        'input.border': '#2A313C',
        'input.foreground': '#EAF2FF',
        'dropdown.background': '#121923',
        'dropdown.border': '#2A313C',
        'list.activeSelectionBackground': '#4F8CFF30',
        'list.hoverBackground': '#FFFFFF10',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#2A313C80',
        'scrollbarSlider.hoverBackground': '#3A414C',
        'scrollbarSlider.activeBackground': '#4F8CFF40',
      }
    })

    monacoInstance.editor.defineTheme('amoled', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
        'editorGutter.background': '#000000',
      }
    })

    monacoInstance.editor.setTheme(settings.theme)

    // Listen for selection changes
    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || ''
        setSelectedText(selectedText)
      } else {
        setSelectedText('')
      }
    })

    // Track cursor position for status bar
    editor.onDidChangeCursorPosition((e) => {
      useEditorStore.getState().setCursorPosition(e.position.lineNumber, e.position.column)
    })

    // Add keyboard shortcuts
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, async () => {
      // Trigger save
      const tab = getActiveTab()
      if (tab) {
        if (settings.formatOnSave) {
          await editor.getAction('editor.action.formatDocument')?.run()
        }
        
        if (tab.isDirty) {
          window.electronAPI.writeFile(tab.path, editor.getValue()).then(() => {
            useEditorStore.getState().updateTabDirty(tab.id, false)
          })
        }
      }
    })

    // Add code actions provider
    monacoInstance.languages.registerCodeActionProvider('typescript', {
      provideCodeActions: (model: monaco.editor.ITextModel, range: monaco.Range, context: monaco.languages.CodeActionContext) => {
        const diagnostics = context.markers
        return diagnostics.map((diagnostic: monaco.editor.IMarkerData) => ({
          title: 'AI: Explain Error',
          command: {
            id: 'ai.explainError',
            title: 'Explain Error',
            arguments: [diagnostic]
          },
          kind: monacoInstance.languages.CodeActionKind.QuickFix
        }))
      }
    })
  }, [setSelectedText, settings.theme, settings.formatOnSave, getActiveTab])

  const handleEditorChange: OnChange = useCallback((value) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value)
    }
  }, [activeTabId, updateTabContent])

  // Auto-save with debounce
  useEffect(() => {
    if (!activeTab?.isDirty || !settings.autoSave) return

    const timeout = setTimeout(async () => {
      if (settings.formatOnSave && editorRef.current) {
        await editorRef.current.getAction('editor.action.formatDocument')?.run()
      }
      
      const content = editorRef.current?.getValue() || activeTab.content
      window.electronAPI.writeFile(activeTab.path, content)
      useEditorStore.getState().updateTabDirty(activeTab.id, false)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [activeTab?.content, settings.autoSave, settings.formatOnSave])

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-glow/20 flex items-center justify-center">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Welcome to ErrorLens Code</h2>
          <p className="text-muted mb-4">Open a folder to get started</p>
          <p className="text-sm text-muted">
            Use <kbd className="px-2 py-1 bg-card rounded text-xs">Ctrl+O</kbd> to open a folder
          </p>
        </div>
      </div>
    )
  }

  if (activeTab.type === 'image' || activeTab.type === 'video') {
    return <MediaViewer tab={activeTab} />
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme={settings.theme}
        options={{
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          fontLigatures: true,
          lineHeight: settings.fontSize * 1.5,
          padding: { top: 16, bottom: 16 },
          minimap: {
            enabled: settings.minimap,
            scale: 1,
            showSlider: 'mouseover'
          },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: settings.cursorSmoothCaretAnimation,
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
            showVariables: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true
          },
          wordWrap: settings.wordWrap,
          automaticLayout: true,
          tabSize: settings.tabSize,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          lineNumbers: settings.lineNumbers,
        }}
      />
    </div>
  )
}