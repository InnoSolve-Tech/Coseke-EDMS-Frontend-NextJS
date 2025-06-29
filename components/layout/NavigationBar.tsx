"use client";

import * as React from "react";
import { Bell, Search, Settings, User, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import {
  clearSessionStorage,
  getUserFromSessionStorage,
} from "@/components/routes/sessionStorage";
import ThemeToggle from "@/components/ThemeToggle";

export function TopNavbar() {
  const router = useRouter();
  const { state } = useSidebar();
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

  React.useEffect(() => {
    setUser(getUserFromSessionStorage());
  }, []);

  const handleLogout = () => {
    clearSessionStorage();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-16 items-center px-4">
        {/* Left side - Burger menu and search */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <SidebarTrigger className="hidden lg:flex">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </SidebarTrigger>
          <Separator orientation="vertical" className="h-4" />

          {/* Search - show full search when expanded, icon when collapsed */}
          {state === "expanded" ? (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents, workflows..."
                className="pl-8 bg-muted/50"
              />
            </div>
          ) : (
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New workflow assigned</p>
                  <p className="text-xs text-muted-foreground">
                    Document review workflow has been assigned to you
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Task overdue</p>
                  <p className="text-xs text-muted-foreground">
                    Invoice processing task is overdue
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">System update</p>
                  <p className="text-xs text-muted-foreground">
                    System maintenance scheduled for tonight
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/settings")}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>

          <Separator orientation="vertical" className="h-4" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.first_name} ${user.last_name}`}
                    alt={`${user.first_name} ${user.last_name}`}
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {user.first_name?.[0] || "U"}
                    {user.last_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/users/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Show user name when sidebar is expanded */}
          {state === "expanded" && (
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-foreground">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
