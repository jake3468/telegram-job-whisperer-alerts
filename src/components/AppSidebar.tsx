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
    <Sidebar className="
      bg-gradient-to-br from-black via-gray-950 to-fuchsia-950
      border-r border-fuchsia-400/10 shadow-2xl shadow-fuchsia-600/10 
      backdrop-blur-2xl rounded-tr-3xl rounded-br-3xl
      min-w-[220px] max-w-[295px] w-[clamp(220px,20vw,295px)]
      overflow-x-hidden overflow-y-auto
      scrollbar-none
      "
    >
      {/* Logo & Name section: always visible */}
      <SidebarHeader className="py-8 px-3 border-b border-fuchsia-400/15 bg-black/95 relative flex flex-col items-center gap-2">
        <img
          src="/lovable-uploads/6239b4a7-4f3c-4902-a936-4216ae26d9af.png"
          alt="JobBots Logo"
          className="h-10 w-10 mb-1 drop-shadow-xl"
        />
        <span className="font-orbitron drop-shadow text-3xl font-extrabold text-transparent bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text select-none tracking-widest whitespace-nowrap">
          JobBots
        </span>
        {/* X button for mobile */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenMobile(false)}
            className="h-10 w-10 text-fuchsia-300 hover:bg-fuchsia-800/40 border border-fuchsia-400/20 bg-black/50 rounded-xl transition-all absolute right-3 top-4"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
        {/* Hamburger in mini-state only (for mobile) */}
        <SidebarTrigger className="lg:hidden absolute top-5 left-3 bg-fuchsia-700/20 rounded-lg p-2 hover:bg-fuchsia-500/40 border border-fuchsia-400/10" />
      </SidebarHeader>

      <SidebarContent>
        {/* Profile Section */}
        <SidebarGroup className="bg-black/60 rounded-2xl mb-2 mx-2 mt-6 shadow-md">
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
                        className={`flex items-center gap-2 px-2 py-3 mx-1 rounded-xl font-orbitron transition-all duration-300 text-base font-bold
                          ${
                            isCurrentlyActive
                              ? 'bg-gradient-to-r from-pastel-peach via-pastel-blue to-pastel-lavender text-black dark:text-white shadow-2xl shadow-fuchsia-300/20 border border-pastel-peach/30'
                              : 'text-fuchsia-100 hover:bg-gradient-to-r hover:from-fuchsia-800 hover:via-fuchsia-600 hover:to-indigo-800 hover:text-fuchsia-200 hover:shadow-lg'
                          }`
                        }
                        style={{overflow: 'hidden'}}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isCurrentlyActive ? 'text-black dark:text-white' : 'text-fuchsia-200'}`} />
                        {state === 'expanded' && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="bg-black/60 rounded-2xl mt-5 mx-2 shadow-md">
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
                        className={`flex items-center gap-2 px-2 py-3 mx-1 rounded-xl font-orbitron transition-all duration-300 text-base font-bold 
                          ${
                            isCurrentlyActive
                              ? 'bg-gradient-to-r from-pastel-lavender via-pastel-mint to-pastel-peach text-black dark:text-white shadow-xl shadow-fuchsia-400/20 border border-pastel-lavender/30'
                              : 'text-fuchsia-200 hover:bg-gradient-to-r hover:from-fuchsia-700 hover:to-indigo-800 hover:text-fuchsia-100'
                          }`
                        }
                        style={{overflow: 'hidden'}}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isCurrentlyActive ? 'text-black dark:text-white' : 'text-fuchsia-200'}`} />
                        {state === 'expanded' && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 border-t border-fuchsia-400/10 bg-gradient-to-r from-black/90 to-fuchsia-950/80 rounded-b-2xl mt-2">
        <SignedIn>
          <div className="flex items-center gap-3 w-full overflow-hidden">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 flex-shrink-0"
                }
              }}
            />
            {state === 'expanded' && user && (
              <div className="flex-1 min-w-0">
                <p className="text-fuchsia-100 text-base font-orbitron truncate">
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
