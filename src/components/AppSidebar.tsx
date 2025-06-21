
import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  CreditCard,
  User,
  BellRing,
  ScanSearch,
  FileText,
  Linkedin,
  LayoutDashboard,
  MessageSquare
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/profile",
      icon: LayoutDashboard,
    },
  ],
  tools: [
    {
      title: "Telegram Job Alerts",
      url: "/job-alerts",
      icon: BellRing,
    },
    {
      title: "AI Job Analysis",
      url: "/job-guide",
      icon: ScanSearch,
    },
    {
      title: "AI Cover Letters",
      url: "/cover-letter",
      icon: FileText,
    },
    {
      title: "AI LinkedIn Posts",
      url: "/linkedin-posts",
      icon: Linkedin,
    },
    {
      title: "AI Interview Prep",
      url: "/interview-prep",
      icon: MessageSquare,
    },
    {
      title: "Company Decoder",
      url: "/company-role-analysis",
      icon: LayoutDashboard,
    },
  ],
  projects: [
    {
      name: "Get More Credits",
      url: "/get-more-credits",
      icon: CreditCard,
    },
    {
      name: "Resume Builder",
      url: "/resume-builder",
      icon: Frame,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/profile">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">JobHuntr</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects items={data.tools} title="Tools" />
        <NavProjects items={data.projects} title="More" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
