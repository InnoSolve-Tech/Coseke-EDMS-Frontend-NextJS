"use client"


interface AppbarProps {
    isCollapsed: boolean
  }
  
  export function Navbar({ isCollapsed }: AppbarProps) {
    return (
      <div
        className={`
          fixed top-0 right-0 ml-10 z-10 h-16
          bg-white dark:bg-gray-800
          border-b border-gray-200 dark:border-gray-700
          shadow-sm
          transition-all duration-300
          ${isCollapsed ? 'left-20' : 'left-64'}
          rounded-bl-lg
        `}
      >
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
      </div>
    )
  }
  
