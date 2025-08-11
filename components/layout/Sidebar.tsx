"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, File, Folder, HelpCircle, LayoutDashboard, LogOut, Settings, User, Workflow } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  clearSessionStorage,
  getUserFromSessionStorage,
  getUserPermissions,
  hasPermission,
} from "@/components/routes/sessionStorage"
import Image from "next/image"

// Define types for navigation and menu items
type SubItem = {
  label: string
  path: string
  requiredPermissions?: string[]
}

type NavigationItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  subItems: SubItem[]
  chipCount?: number
  requiredPermissions?: string[]
  themeColor?: "primary" | "secondary" | "accent" | "muted"
}

type FooterItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  routerLink?: boolean
  path: string
  requiredPermissions?: string[]
}

// Define navigation items with permissions and theme colors
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    subItems: [],
    themeColor: "primary",
  },
  {
    icon: Folder,
    label: "Folders",
    path: "/dashboard/folders",
    subItems: [],
    themeColor: "secondary",
  },
  {
    icon: Workflow,
    label: "Workflows",
    path: "/dashboard/workflows",
    subItems: [
      {
        label: "All Workflows",
        path: "/dashboard/workflows",
        requiredPermissions: ["READ_WORKFLOW"],
      },
      {
        label: "Create",
        path: "/dashboard/workflows/init",
        requiredPermissions: ["CREATE_WORKFLOW"],
      },
    ],
    requiredPermissions: ["READ_WORKFLOW", "CREATE_WORKFLOW", "UPDATE_WORKFLOW", "DELETE_WORKFLOW"],
    themeColor: "accent",
  },
  {
    icon: User,
    label: "Users",
    path: "/users",
    subItems: [
      {
        label: "My Profile",
        path: "/dashboard/users/profile",
      },
      {
        label: "Create User",
        path: "/dashboard/users/create",
        requiredPermissions: ["CREATE_USER"],
      },
      {
        label: "Roles & Permissions",
        path: "/dashboard/users/roles",
        requiredPermissions: ["READ_ROLE", "READ_PERMISSION"],
      },
    ],
    requiredPermissions: ["READ_USER", "CREATE_USER", "UPDATE_USER", "DELETE_USER"],
    themeColor: "muted",
  },
  {
    icon: File,
    label: "Forms",
    path: "/forms",
    subItems: [
      {
        label: "All Forms",
        path: "/dashboard/forms",
        requiredPermissions: ["READ_FORM"],
      },
      {
        label: "Active forms",
        path: "/dashboard/forms/active",
        requiredPermissions: ["READ_FORM"],
      },
    ],
    requiredPermissions: ["READ_FORM", "CREATE_FORM", "UPDATE_FORM", "DELETE_FORM"],
    themeColor: "primary",
  },
]

const FOOTER_ITEMS: FooterItem[] = [
  {
    icon: HelpCircle,
    label: "Support",
    path: "https://support.coseke.com",
    routerLink: true,
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
  },
]

export function AppSidebar() {
  const router = useRouter()
  const [user, setUser] = React.useState({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    roles: [],
    name: "",
  })
  const [userPermissions, setUserPermissions] = React.useState<string[]>([])
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
    const currentUser = getUserFromSessionStorage()
    setUser(currentUser)
    setUserPermissions(getUserPermissions(currentUser))
  }, [])

  const handleLogout = () => {
    clearSessionStorage()
    router.push("/")
  }

  const getThemeColorClasses = (themeColor?: string) => {
    switch (themeColor) {
      case "primary":
        return "hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
      case "secondary":
        return "hover:bg-secondary/10 hover:text-secondary data-[active=true]:bg-secondary/10 data-[active=true]:text-secondary"
      case "accent":
        return "hover:bg-accent/10 hover:text-accent data-[active=true]:bg-accent/10 data-[active=true]:text-accent"
      case "muted":
        return "hover:bg-muted/50 hover:text-muted-foreground data-[active=true]:bg-muted/50 data-[active=true]:text-muted-foreground"
      default:
        return "hover:bg-accent/10 hover:text-accent-foreground"
    }
  }

  // Show loading state during SSR and initial client render
  if (!isClient) {
    return (
      <Sidebar className="border-r">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
            <div className="flex flex-col gap-1">
              <div className="w-24 h-4 bg-muted animate-pulse rounded"></div>
              <div className="w-16 h-2 bg-muted/50 animate-pulse rounded"></div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Loading...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>--</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Loading...</div>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  // Filter navigation items based on permissions
  const filteredNavigationItems = NAVIGATION_ITEMS.filter((item) =>
    hasPermission(userPermissions, item.requiredPermissions),
  )

  // Filter footer items based on permissions
  const filteredFooterItems = FOOTER_ITEMS.filter((item) => hasPermission(userPermissions, item.requiredPermissions))

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b bg-muted/20">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative">
            <Image src="/logo.png" alt="NLGRB Logo" width={200} height={200} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => {
                // Filter sub-items based on permissions
                const filteredSubItems = item.subItems.filter((subItem) =>
                  hasPermission(userPermissions, subItem.requiredPermissions),
                )

                if (filteredSubItems.length > 0) {
                  return (
                    <Collapsible key={item.label} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={`transition-all duration-200 ${getThemeColorClasses(item.themeColor)}`}
                          >
                            <item.icon className="size-4" />
                            <span className="font-medium">{item.label}</span>
                            {item.chipCount && (
                              <Badge variant="secondary" className="ml-auto">
                                {item.chipCount}
                              </Badge>
                            )}
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {filteredSubItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.label}>
                                <SidebarMenuSubButton
                                  asChild
                                  className="hover:bg-accent/10 hover:text-accent transition-all duration-200"
                                >
                                  <button onClick={() => router.push(subItem.path)}>
                                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full mr-2"></div>
                                    {subItem.label}
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                // If no sub-items or item has no sub-items, show as regular menu item
                if (item.subItems.length === 0) {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 ${getThemeColorClasses(item.themeColor)}`}
                      >
                        <button onClick={() => router.push(item.path)}>
                          <item.icon className="size-4" />
                          <span className="font-medium">{item.label}</span>
                          {item.chipCount && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.chipCount}
                            </Badge>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }
                return null
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredFooterItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              Support
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFooterItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      className="hover:bg-secondary/10 hover:text-secondary transition-all duration-200"
                    >
                      <button
                        onClick={() => (item.routerLink ? window.open(item.path, "_blank") : router.push(item.path))}
                      >
                        <item.icon className="size-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t bg-muted/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-card border">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.first_name} ${user.last_name}`}
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user.first_name?.[0] || "U"}
                  {user.last_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span className="text-xs text-accent font-medium">Online</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
