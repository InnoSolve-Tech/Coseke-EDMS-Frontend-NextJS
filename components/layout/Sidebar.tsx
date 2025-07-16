"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  File,
  Folder,
  HelpCircle,
  LayoutDashboard,
  ListIcon,
  LogOut,
  Settings,
  User,
  Workflow,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
} from "@/components/ui/sidebar";
import {
  clearSessionStorage,
  getUserFromSessionStorage,
  getUserPermissions,
  hasPermission,
} from "@/components/routes/sessionStorage";
import ThemeToggle from "@/components/ThemeToggle";

// Define types for navigation and menu items
type SubItem = {
  label: string;
  path: string;
  requiredPermissions?: string[];
};

type NavigationItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  subItems: SubItem[];
  chipCount?: number;
  requiredPermissions?: string[];
};

type FooterItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  routerLink?: boolean;
  path: string;
  requiredPermissions?: string[];
};

// Define navigation items with permissions
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    subItems: [],
    // Dashboard is usually accessible to all authenticated users
  },
  {
    icon: Folder,
    label: "Folders",
    path: "/dashboard/folders",
    subItems: [],
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
    requiredPermissions: [
      "READ_WORKFLOW",
      "CREATE_WORKFLOW",
      "UPDATE_WORKFLOW",
      "DELETE_WORKFLOW",
    ],
  },
  {
    icon: ListIcon,
    label: "Tasks",
    path: "/dashboard/tasks",
    subItems: [
      { label: "All Tasks", path: "/dashboard/tasks/all" },
      { label: "Backlog", path: "/dashboard/tasks/backlog" },
      { label: "In Progress", path: "/dashboard/tasks/in-progress" },
      { label: "Done", path: "/dashboard/tasks/done" },
    ],
    // Tasks don't seem to have specific permissions in the provided data
    // You might want to add TASK permissions to your backend
  },
  {
    icon: User,
    label: "Users",
    path: "/users",
    subItems: [
      {
        label: "My Profile",
        path: "/dashboard/users/profile",
        // Profile is usually accessible to all users
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
    requiredPermissions: [
      "READ_USER",
      "CREATE_USER",
      "UPDATE_USER",
      "DELETE_USER",
    ],
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
    requiredPermissions: [
      "READ_FORM",
      "CREATE_FORM",
      "UPDATE_FORM",
      "DELETE_FORM",
    ],
  },
];

const FOOTER_ITEMS: FooterItem[] = [
  {
    icon: HelpCircle,
    label: "Support",
    path: "https://support.coseke.com",
    routerLink: true,
    // Support is usually accessible to all users
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
    // Settings might require specific permissions, adjust as needed
  },
];

export function AppSidebar() {
  const router = useRouter();
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
  });

  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const currentUser = getUserFromSessionStorage();
    setUser(currentUser);
    setUserPermissions(getUserPermissions(currentUser));
  }, []);

  const handleLogout = () => {
    clearSessionStorage();
    router.push("/");
  };

  // Show loading state during SSR and initial client render
  if (!isClient) {
    return (
      <Sidebar className="border-r border-border bg-card">
        <SidebarHeader className="border-b border-border bg-card">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Folder className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold text-foreground">Coseke EDMS</span>
              <span className="text-xs text-muted-foreground">
                Document Management
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-card">
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground">
              Loading...
            </SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border bg-card">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    --
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    Loading...
                  </div>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    );
  }

  // Filter navigation items based on permissions
  const filteredNavigationItems = NAVIGATION_ITEMS.filter((item) =>
    hasPermission(userPermissions, item.requiredPermissions),
  );

  // Filter footer items based on permissions
  const filteredFooterItems = FOOTER_ITEMS.filter((item) =>
    hasPermission(userPermissions, item.requiredPermissions),
  );

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Folder className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-foreground">Coseke EDMS</span>
            <span className="text-xs text-muted-foreground">
              Document Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => {
                // Filter sub-items based on permissions
                const filteredSubItems = item.subItems.filter((subItem) =>
                  hasPermission(userPermissions, subItem.requiredPermissions),
                );

                if (filteredSubItems.length > 0) {
                  return (
                    <Collapsible key={item.label} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-accent hover:text-accent-foreground">
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
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
                                  className="hover:bg-accent hover:text-accent-foreground"
                                >
                                  <button
                                    onClick={() => router.push(subItem.path)}
                                  >
                                    {subItem.label}
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // If no sub-items or item has no sub-items, show as regular menu item
                if (item.subItems.length === 0) {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        className="hover:bg-accent hover:text-accent-foreground"
                      >
                        <button onClick={() => router.push(item.path)}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                          {item.chipCount && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.chipCount}
                            </Badge>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return null;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredFooterItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground">
              Support
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFooterItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      <button
                        onClick={() =>
                          item.routerLink
                            ? window.open(item.path, "_blank")
                            : router.push(item.path)
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border bg-card">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.first_name} ${user.last_name}`}
                />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {user.first_name?.[0] || "U"}
                  {user.last_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
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
  );
}
