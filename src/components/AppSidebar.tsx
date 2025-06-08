
import { User, Bell, FileSearch } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';

const navigationItems = [{
  title: 'Profile',
  url: '/dashboard',
  icon: User
}, {
  title: 'Job Alerts',
  url: '/job-alerts',
  icon: Bell
}, {
  title: 'Job Match',
  url: '/job-guide',
  icon: FileSearch
}];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="border-r border-white/20 bg-black">
      <SidebarHeader className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {state === 'expanded' && (
            <div className="flex-1 min-w-0">
              <p className="font-inter truncate text-4xl font-medium text-sky-300">
                Job AI
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-300 font-inter font-medium text-xs px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive: navIsActive }) => 
                        `flex items-center gap-3 px-3 py-3 mx-2 rounded-lg transition-all duration-300 font-inter text-sm transform hover:scale-105 hover:translate-x-1 ${
                          navIsActive || isActive(item.url) 
                            ? 'bg-gradient-to-r from-sky-500/20 to-sky-300/20 text-white border border-sky-400/30' 
                            : 'text-gray-300 hover:text-white hover:bg-white/5 hover:border hover:border-white/10'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {state === 'expanded' && (
                        <span className="font-medium truncate">{item.title}</span>
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
