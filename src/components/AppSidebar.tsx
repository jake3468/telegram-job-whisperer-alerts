import {
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
  Shield,
  Type,
  User,
  HelpCircle,
  Briefcase,
  FileText,
  Network,
  MessageSquarePlus,
  GraduationCap,
  BookOpenCheck,
  Building2,
  FileSearch2,
  BadgeInfo,
  LucideIcon,
} from "lucide-react";

import { AppSidebarNavItem } from "./AppSidebarNavItem";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function AppSidebar() {
  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Job Guides",
      url: "/job-guides",
      icon: ListChecks,
    },
    {
      title: "Create Job Guide",
      url: "/job-guides/create",
      icon: Plus,
    },
    {
      title: "Cover Letters",
      url: "/cover-letters",
      icon: FileText,
    },
    {
      title: "Create Cover Letter",
      url: "/cover-letters/create",
      icon: Plus,
    },
    {
      title: "LinkedIn Posts",
      url: "/linkedin-posts",
      icon: Network,
    },
    {
      title: "Create LinkedIn Post",
      url: "/linkedin-posts/create",
      icon: MessageSquarePlus,
    },
    {
      title: "Company Analyses",
      url: "/company-analyses",
      icon: Building2,
    },
    {
      title: "Create Company Analysis",
      url: "/company-analyses/create",
      icon: Plus,
    },
    {
      title: "Interview Preps",
      url: "/interview-preps",
      icon: BookOpenCheck,
    },
    {
      title: "Create Interview Prep",
      url: "/interview-preps/create",
      icon: Plus,
    },
    {
      title: "Resumes",
      url: "/resumes",
      icon: FileSearch2,
    },
    {
      title: "Create Resume",
      url: "/resumes/create",
      icon: Plus,
    },
    {
      title: "AI Prompts",
      url: "/ai-prompts",
      icon: Type,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "About",
      url: "/about",
      icon: BadgeInfo,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Security Dashboard",
      url: "/security-dashboard",
      icon: Shield,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-60">
      <div className="px-4 py-6">
        <h1 className="font-bold text-2xl text-white">Aspirely</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your AI Career Assistant
        </p>
      </div>
      <div className="flex-grow overflow-y-auto py-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <AppSidebarNavItem
              key={item.title}
              title={item.title}
              url={item.url}
              icon={item.icon}
            />
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Aspirely. All rights reserved.
        </p>
      </div>
    </div>
  );
}
