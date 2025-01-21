"use client";

import { Bell, Search, Settings, User } from "lucide-react";
import { useState } from "react";

interface AppbarProps {
  isCollapsed: boolean;
}

export function Navbar({ isCollapsed }: AppbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className={`
        fixed top-0 right-0 z-10
        h-16 bg-white border-b
        transition-all duration-300 
        backdrop-blur-sm bg-white/90
        ${isCollapsed ? "left-20" : "left-64"}
      `}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>

        {/* Middle section - Search */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-gray-50 hover:bg-gray-100 transition-colors"
            />
          </div>
        </div>

        {/* Right section - Icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>

          <div className="h-8 w-px bg-gray-200 mx-2"></div>

          <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <div className="relative">
              <User className="h-5 w-5 text-gray-600" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
