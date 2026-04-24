import { useEditorStore } from '../store/editorStore'
import { X, Circle } from 'lucide-react'
import FileIcon from './FileIcon'

export default function EditorTabs() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useEditorStore()
  
  if (tabs.length === 0) {
    return null
  }
  
  return (
    <div className="h-9 bg-panel border-b border-border flex items-center overflow-x-auto no-scrollbar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center gap-1.5 px-3 h-full cursor-pointer border-r border-border group shrink-0 ${
            tab.id === activeTabId 
              ? 'bg-background text-text border-b-2 border-b-primary' 
              : 'text-muted hover:text-text hover:bg-white/5'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <FileIcon filename={tab.name} className="shrink-0" />
          {tab.isDirty && (
            <Circle className="w-1.5 h-1.5 fill-warning text-warning shrink-0" />
          )}
          <span className="text-[11px] truncate max-w-[120px]">{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeTab(tab.id)
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}