import React from 'react'
import { 
  VscFiles, 
  VscSearch, 
  VscSourceControl, 
  VscDebugAlt, 
  VscExtensions,
  VscAccount,
  VscSettingsGear
} from 'react-icons/vsc'
import { useAppStore } from '../store/appStore'

export default function ActivityBar() {
  const { toggleLeftSidebar, setSettingsOpen, setSettingsTab, setRightSidebarTab, toggleRightSidebar, rightSidebarOpen } = useAppStore()

  const handleOpenSettings = (tab: 'account' | 'customizations') => {
    setSettingsTab(tab)
    setSettingsOpen(true)
  }

  const handleGitClick = () => {
    setRightSidebarTab('changes')
    if (!rightSidebarOpen) toggleRightSidebar()
  }

  const topIcons = [
    { id: 'explorer', icon: VscFiles, label: 'Explorer', active: true, onClick: toggleLeftSidebar },
    { id: 'search', icon: VscSearch, label: 'Search' },
    { id: 'git', icon: VscSourceControl, label: 'Source Control', onClick: handleGitClick },
    { id: 'debug', icon: VscDebugAlt, label: 'Run and Debug' },
    { id: 'extensions', icon: VscExtensions, label: 'Extensions' },
  ]

  const bottomIcons = [
    { id: 'account', icon: VscAccount, label: 'Account', onClick: () => handleOpenSettings('account') },
    { id: 'settings', icon: VscSettingsGear, label: 'Settings', onClick: () => handleOpenSettings('customizations') },
  ]

  return (
    <div className="w-[48px] h-full bg-panel flex flex-col items-center py-2 border-r border-border select-none">
      <div className="flex-1 flex flex-col gap-1 w-full items-center">
        {topIcons.map((item) => (
          <div
            key={item.id}
            title={item.label}
            className={`relative group p-3 cursor-pointer transition-all duration-200 ${
              item.active 
                ? 'text-text' 
                : 'text-muted hover:text-text'
            }`}
            onClick={item.onClick}
          >
            {item.active && (
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
            )}
            <item.icon className="w-6 h-6" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 w-full items-center pb-2">
        {bottomIcons.map((item) => (
          <div
            key={item.id}
            title={item.label}
            className="p-3 cursor-pointer text-muted hover:text-text transition-all duration-200"
            onClick={item.onClick}
          >
            <item.icon className="w-6 h-6" />
          </div>
        ))}
      </div>
    </div>
  )
}
