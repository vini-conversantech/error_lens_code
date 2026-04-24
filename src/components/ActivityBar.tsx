import { Files, Search, GitBranch, Play, Settings, User } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function ActivityBar() {
  const { leftSidebarOpen, toggleLeftSidebar, setSettingsOpen } = useAppStore()

  return (
    <div className="w-12 md:w-14 h-full bg-background border-r border-border flex flex-col items-center py-4 flex-shrink-0 z-10">
      {/* Top icons */}
      <div className="flex flex-col gap-4 w-full items-center">
        <button 
          onClick={toggleLeftSidebar}
          className={`p-2 rounded-xl transition-all ${leftSidebarOpen ? 'text-primary border-l-2 border-primary bg-primary/5' : 'text-muted border-l-2 border-transparent hover:text-text hover:bg-white/5'}`}
          title="Explorer"
        >
          <Files className="w-[1.4rem] h-[1.4rem] stroke-[1.5]" />
        </button>
        <button 
          className="p-2 rounded-xl text-muted border-l-2 border-transparent hover:text-text hover:bg-white/5 transition-all"
          title="Search"
        >
          <Search className="w-[1.4rem] h-[1.4rem] stroke-[1.5]" />
        </button>
        <button 
          className="p-2 rounded-xl text-muted border-l-2 border-transparent hover:text-text hover:bg-white/5 transition-all"
          title="Source Control"
        >
          <GitBranch className="w-[1.4rem] h-[1.4rem] stroke-[1.5]" />
        </button>
        <button 
          className="p-2 rounded-xl text-muted border-l-2 border-transparent hover:text-text hover:bg-white/5 transition-all"
          title="Run and Debug"
        >
          <Play className="w-[1.4rem] h-[1.4rem] stroke-[1.5]" />
        </button>
      </div>

      {/* Bottom spacer */}
      <div className="flex-1" />

      {/* Bottom icons */}
      <div className="flex flex-col gap-4 w-full items-center">
        <button 
          className="p-2 rounded-xl text-muted hover:text-text hover:bg-white/5 transition-all"
          title="Accounts"
        >
          <User className="w-[1.4rem] h-[1.4rem] stroke-[1.5]" />
        </button>
        <button 
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-xl text-muted hover:text-text hover:bg-white/5 transition-all"
          title="Settings"
        >
          <Settings className="w-[1.4rem] h-[1.4rem] stroke-[1.5]" />
        </button>
      </div>
    </div>
  )
}
