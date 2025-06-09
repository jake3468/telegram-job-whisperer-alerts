import { User, Bell, Target, FileText } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';
const navigationItems = [{
  title: 'Profile',
  url: '/dashboard',
  icon: User
}, {
  title: 'Job Alerts',
  url: '/job-alerts',
  icon: Bell
}, {
  title: 'Job Guide',
  url: '/job-guide',
  icon: Target
}, {
  title: 'Cover Letter',
  url: '/cover-letter',
  icon: FileText
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const {
    user
  } = useUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  return <Sidebar className="border-r border-white/20 bg-black">
      <SidebarHeader className="p-6 border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-3">
          {state === 'expanded' && <div className="flex-1 min-w-0">
              <p className="font-inter truncate text-4xl font-medium text-sky-300">
                Job AI
              </p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="bg-zinc-900">
          <SidebarGroupLabel className="text-gray-300 font-inter font-medium text-xs px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10 bg-zinc-900">
        <SignedIn>
          <div className="flex items-center gap-3">
            <UserButton appearance={{
            elements: {
              avatarBox: "w-10 h-10 flex-shrink-0"
            }
          }} />
            {state === 'expanded' && user && <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>}
          </div>
        </SignedIn>
      </SidebarFooter>
    </Sidebar>;
}