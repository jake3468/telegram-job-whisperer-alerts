
import { User, Bell, FileSearch, Home } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Profile',
    url: '/dashboard',
    icon: Home,
    description: 'Manage your profile and resume'
  },
  {
    title: 'Job Alerts',
    url: '/job-alerts',
    icon: Bell,
    description: 'Set up personalized job alerts'
  },
  {
    title: 'Job Guide',
    url: '/job-guide',
    icon: FileSearch,
    description: 'Get job match analysis and cover letters'
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useUser();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="border-r border-white/10 bg-black/95 backdrop-blur-sm">
      <SidebarHeader className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pastel-blue to-pastel-mint flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          {state === 'expanded' && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium font-inter truncate">
                {user?.firstName || 'User'}
              </p>
              <p className="text-gray-400 text-sm font-inter truncate">
                {user?.emailAddresses?.[0]?.emailAddress || 'Welcome back'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-300 font-inter font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: navIsActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-inter ${
                          navIsActive || isActive(item.url)
                            ? 'bg-gradient-to-r from-pastel-blue/20 to-pastel-mint/20 text-white border border-white/20'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {state === 'expanded' && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
