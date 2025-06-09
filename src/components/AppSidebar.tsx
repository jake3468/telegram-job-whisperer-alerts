
import { Home, Target, FileText, Bell, User, Headphones } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const profileItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
]

const toolItems = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Job Guide",
    url: "/job-guide",
    icon: Target,
  },
  {
    title: "Cover Letter",
    url: "/cover-letter",
    icon: FileText,
  },
  {
    title: "Telegram Job Alerts",
    url: "/job-alerts",
    icon: Bell,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const isToolsExpanded = toolItems.some((item) => isActive(item.url))

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10">
      <SidebarContent className="bg-black">
        {/* Profile Items - No subheading */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {profileItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white font-medium"
                          : "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup defaultOpen={isToolsExpanded}>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wide font-medium">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white font-medium"
                          : "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support */}
        <div className="mt-auto p-4">
          <a
            href="mailto:support@example.com"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <Headphones className="h-4 w-4" />
            {state === "expanded" && <span>Support</span>}
          </a>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
