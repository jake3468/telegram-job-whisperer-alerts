
import { User, Bell, Target, FileText, X, Share2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
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
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

const profileItems = [{
  title: 'Profile',
  url: '/dashboard',
  icon: User
}];

const toolItems = [{
  title: 'Telegram Job Alerts',
  url: '/job-alerts',
  icon: Bell
}, {
  title: 'Job Analysis',
  url: '/job-guide',
  icon: Target
}, {
  title: 'Cover Letter',
  url: '/cover-letter',
  icon: FileText
}, {
  title: 'LinkedIn Posts',
  url: '/linkedin-posts',
  icon: Share2
}];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="bg-gradient-to-br from-sky-900/70 via-black/90 to-fuchsia-900/80 border-r border-fuchsia-400/20 shadow-2xl shadow-fuchsia-600/10 backdrop-blur-xl rounded-tr-2xl rounded-br-3xl">
      <SidebarHeader className="py-6 px-4 border-b border-fuchsia-400/10 bg-black/80 relative flex justify-between items-center gap-3">
        {state === 'expanded' && (
          <span className="font-orbitron drop-shadow text-2xl font-extrabold text-transparent bg-gradient-to-r from-sky-300 via-fuchsia-400 to-indigo-300 bg-clip-text select-none tracking-wider">
            JobBots
          </span>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenMobile(false)}
            className="h-10 w-10 text-fuchsia-300 hover:bg-fuchsia-800/40 border border-fuchsia-400/20 bg-black/40 rounded-xl transition-all"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
        {/* Always visible mini hamburger (desktop mini mode) */}
        <SidebarTrigger className="lg:hidden absolute top-5 right-4 bg-fuchsia-700/20 rounded-lg p-1 hover:bg-fuchsia-500/40 transition-all border border-fuchsia-400/10" />
      </SidebarHeader>

      <SidebarContent>
        {/* Profile Section */}
        <SidebarGroup className="bg-black/50 rounded-2xl mb-2 mx-2 shadow-sm">
          <SidebarGroupLabel className="text-fuchsia-200 font-orbitron text-xs px-3 py-2">
            Profile
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {profileItems.map(item => {
                const isCurrentlyActive = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-3 mx-2 rounded-xl font-orbitron transition-all duration-300 text-sm font-semibold 
                          ${isCurrentlyActive
                            ? 'bg-gradient-to-l from-sky-400 via-fuchsia-500 to-indigo-400 text-white shadow-lg shadow-fuchsia-400/20'
                            : 'text-fuchsia-200 hover:bg-fuchsia-800/70 hover:text-white hover:shadow-md'}`
                        }
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isCurrentlyActive ? 'text-white' : 'text-fuchsia-200'}`} />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="bg-black/50 rounded-2xl mt-4 mx-2 shadow-sm">
          <SidebarGroupLabel className="text-fuchsia-200 font-orbitron text-xs px-3 py-2">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map(item => {
                const isCurrentlyActive = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-3 mx-2 rounded-xl font-orbitron transition-all duration-300 text-sm font-semibold 
                          ${isCurrentlyActive
                            ? 'bg-gradient-to-l from-sky-400 via-fuchsia-500 to-indigo-400 text-white shadow-lg shadow-fuchsia-400/20'
                            : 'text-fuchsia-200 hover:bg-fuchsia-800/70 hover:text-white hover:shadow-md'}`
                        }
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isCurrentlyActive ? 'text-white' : 'text-fuchsia-200'}`} />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 border-t border-fuchsia-400/10 bg-gradient-to-r from-black/90 to-fuchsia-950/60 rounded-b-2xl mt-2">
        <SignedIn>
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 flex-shrink-0"
                }
              }}
            />
            {state === 'expanded' && user && (
              <div className="flex-1 min-w-0">
                <p className="text-fuchsia-100 text-sm font-orbitron truncate">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            )}
          </div>
        </SignedIn>
      </SidebarFooter>
    </Sidebar>
  );
}
