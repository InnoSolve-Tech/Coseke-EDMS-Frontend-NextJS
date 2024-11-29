import React, { useState, ReactNode } from 'react';
import { 
  Folder, 
  LayoutDashboard, 
  ShoppingCart, 
  List as ListIcon, 
  Workflow, 
  Users, 
  HelpCircle, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from './dashboard/Navbar';

// Define types for navigation and menu items
type SubItem = {
  label: string;
  path: string;
};

type NavigationItem = {
  icon: React.ComponentType;
  label: string;
  path: string;
  subItems: SubItem[];
  chipCount?: number;
};

type FooterItem = {
  icon: React.ComponentType;
  label: string;
  path: string;
};

type SidebarLayoutProps = {
  children: ReactNode;
};

// Define navigation items with icons, labels, and paths
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
    subItems: []
  },
  {
    icon: Folder,
    label: 'Folders',
    path: '/dashboard/folders',
    subItems: []
  },
  {
    icon: Workflow,
    label: 'Workflows',
    path: '/dashboard/workflows',
    subItems: [      
      { label: 'Create Workflows', path: '/dashboard/workflows/create' },
      { label: 'View Active', path: '/dashboard/workflows/active' },
    ]
  },
  {
    icon: ListIcon,
    label: 'Tasks',
    path: '/dashboard/tasks',
    subItems: [
      { label: 'All Tasks', path: '/dashboard/tasks/all' },
      { label: 'Backlog', path: '/dashboard/tasks/backlog' },
      { label: 'In Progress', path: '/dashboard/tasks/in-progress' },
      { label: 'Done', path: '/dashboard/tasks/done' }
    ]
  },
  {
    icon: Users,
    label: 'Users',
    path: '/users',
    subItems: [
      { label: 'My Profile', path: '/dashboard/users/profile' },
      { label: 'Create User', path: '/dashboard/users/create' },
      { label: 'Roles & Permissions', path: '/dashboard/users/roles' }
    ]
  }
];

const FOOTER_ITEMS: FooterItem[] = [
  {
    icon: HelpCircle,
    label: 'Support',
    path: 'https://support.coseke.com'
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/dashboard/settings'
  }
];

type MenuItemProps = {
  icon?: React.ComponentType;
  label: string;
  path: string;
  onClick?: () => void;
  chipCount?: number;
  nested?: boolean;
};

export default function Sidebar({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{[key: string]: boolean}>({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleColorScheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const toggleSubmenu = (label: string) => {
    if (!isCollapsed) {
      setOpenSubmenus((prev) => ({
        ...prev,
        [label]: !prev[label]
      }));
    }
  };

  const MenuItemWithTooltip: React.FC<MenuItemProps> = ({ 
    icon: Icon, 
    label, 
    path, 
    onClick, 
    chipCount, 
    nested = false 
  }) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      } else {
        router.push(path);
      }
    };

    return (
      <div 
        className={`
          flex items-center cursor-pointer relative
          ${nested ? 'pl-4' : ''} 
          hover:bg-gray-100 
          ${isCollapsed ? 'justify-center' : 'justify-start'}
          p-2 rounded-md
        `}
        onClick={handleClick}
      >
        <Navbar isCollapsed={isCollapsed}/>
        <div className="flex items-center flex-grow">
          {!nested && Icon && (
            <div className="w-5 h-5 mr-2">
              <Icon />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex items-center w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span className="text-sm">{label}</span>
                  {chipCount && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                      {chipCount}
                    </span>
                  )}
                </div>
                {onClick && (
                  <div className="ml-auto">
                    {openSubmenus[label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div 
        className={`
          border-r border-gray-200 
          flex flex-col transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && <h2 className="text-xl font-bold">Coseke EDMS</h2>}
          <button 
            onClick={toggleCollapse} 
            className="ml-auto hover:bg-gray-100 p-2 rounded-md"
          >
            {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
        </div>

        {/* Main Menu */}
        <nav className="flex-grow overflow-y-auto">
          <div className="space-y-1 p-2">
            {NAVIGATION_ITEMS.map((item) => (
              <div key={item.label}>
                <MenuItemWithTooltip 
                  icon={item.icon} 
                  label={item.label} 
                  path={item.path}
                  chipCount={item.chipCount}
                  onClick={item.subItems.length > 0 
                    ? () => toggleSubmenu(item.label) 
                    : undefined}
                />
                {!isCollapsed && item.subItems.length > 0 && openSubmenus[item.label] && (
                  <div className="pl-4 space-y-1">
                    {item.subItems.map((subItem) => (
                      <MenuItemWithTooltip 
                        key={subItem.label}
                        label={subItem.label} 
                        path={subItem.path}
                        nested 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Menu */}
        <div className="border-t border-gray-200 p-2 space-y-1">
          {FOOTER_ITEMS.map((item) => (
            <MenuItemWithTooltip 
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
            />
          ))}
          
          {/* Color Scheme Toggle */}
          {!isCollapsed && (
            <div 
              className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md"
              onClick={toggleColorScheme}
            >
              {isDarkMode ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />}
              <span className="text-sm">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 flex items-center">
          <img 
            src="/api/placeholder/40/40" 
            alt="User" 
            className={`
              rounded-full 
              ${isCollapsed ? 'mx-auto' : 'mr-3'}
            `} 
          />
          {!isCollapsed && (
            <div className="flex-grow">
              <div className="text-sm font-semibold">Siriwat K.</div>
              <div className="text-xs text-gray-500">siriwatk@test.com</div>
            </div>
          )}
          {!isCollapsed && (
            <button 
              className="hover:bg-gray-100 p-2 rounded-md"
              onClick={() => router.push('/logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <main 
        className={`
          flex-grow overflow-auto transition-all duration-300 mt-10
          ${isCollapsed ? 'ml-10' : 'ml-55'}
          h-screen
        `}
      >
        <div className="p-4 h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}