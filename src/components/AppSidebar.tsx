
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

  // Helper to pick best name string
  const getDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if ((user as any).username) return (user as any).username;
    return "User";
  };

  return (
    <Sidebar className="
      bg-gradient-to-br from-black via-gray-950 to-fuchsia-950
      border-r border-fuchsia-400/10 shadow-2xl shadow-fuchsia-600/10 
      backdrop-blur-2xl
      min-w-[220px] max-w-[295px] w-[clamp(220px,20vw,295px)]
      h-full
      overflow-y-auto overflow-x-hidden
      scrollbar-none
      /* No rounded corners for a squared sidebar */
    ">
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
        {/* X button for mobile - only close button, no hamburger */}
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
        {/* Hamburger only for desktop mini-state */}
        {!isMobile && (
          <SidebarTrigger className="lg:hidden absolute top-5 left-3 bg-fuchsia-700/20 rounded-lg p-2 hover:bg-fuchsia-500/40 border border-fuchsia-400/10" />
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden w-full px-0 !pr-0">
        {/* Profile Section */}
        <SidebarGroup className="bg-black/60 mb-2 mx-2 mt-6 shadow-md rounded-none">
          <SidebarGroupLabel className="text-fuchsia-200 font-orbitron text-xs px-3 py-2">
            Profile
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {profileItems.map(item => {
                const isCurrentlyActive = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="w-full">
                    <SidebarMenuButton asChild className="w-full px-0">
                      <NavLink
                        to={item.url}
                        className={`
                          flex items-center gap-2 py-3 
                          mx-0                          /* remove horizontal margin for full-width highlight */
                          px-3
                          rounded-none                   /* squared corners */
                          font-orbitron transition-all duration-300 
                          text-base font-bold w-full
                          ${
                            isCurrentlyActive
                              ? 'bg-gradient-to-r from-pastel-peach via-pastel-blue to-pastel-lavender text-black dark:text-white shadow-xl border-y border-pastel-peach/30'
                              : 'text-white hover:bg-gradient-to-r hover:from-fuchsia-800 hover:via-fuchsia-600 hover:to-indigo-800 hover:text-white hover:shadow-lg'
                          }
                        `}
                        style={{
                          overflow: 'hidden',
                          borderRadius: 0, // Ensures squared corners
                        }}
                      >
                        <item.icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            isCurrentlyActive
                              ? 'text-black dark:text-white'
                              : 'text-white'
                          }`}
                        />
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
        <SidebarGroup className="bg-black/60 mt-5 mx-2 shadow-md rounded-none">
          <SidebarGroupLabel className="text-fuchsia-200 font-orbitron text-xs px-3 py-2">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map(item => {
                const isCurrentlyActive = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="w-full">
                    <SidebarMenuButton asChild className="w-full px-0">
                      <NavLink
                        to={item.url}
                        className={`
                          flex items-center gap-2 py-3 
                          mx-0                          /* remove horizontal margin for full-width highlight */
                          px-3
                          rounded-none
                          font-orbitron transition-all duration-300 
                          text-base font-bold w-full
                          ${
                            isCurrentlyActive
                              ? 'bg-gradient-to-r from-pastel-lavender via-pastel-mint to-pastel-peach text-black dark:text-white shadow-xl border-y border-pastel-lavender/30'
                              : 'text-white hover:bg-gradient-to-r hover:from-fuchsia-700 hover:to-indigo-800 hover:text-white'
                          }
                        `}
                        style={{
                          overflow: 'hidden',
                          borderRadius: 0
                        }}
                      >
                        <item.icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            isCurrentlyActive
                              ? 'text-black dark:text-white'
                              : 'text-white'
                          }`}
                        />
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

      <SidebarFooter className="p-5 border-t border-fuchsia-400/10 bg-gradient-to-r from-black/90 to-fuchsia-950/80 mt-2 rounded-none relative">
        <SignedIn>
          <div className="flex items-center gap-3 w-full">
            <div className={isMobile ? "relative z-[60]" : ""}>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 flex-shrink-0",
                    userButtonPopoverCard: isMobile ? "z-[60]" : ""
                  }
                }}
              />
            </div>
            {state === 'expanded' && user && (
              <div className="flex-1 min-w-0">
                {/* Show display name (not email), kept very responsive */}
                <p className="text-fuchsia-100 text-base font-orbitron truncate break-all">
                  {getDisplayName()}
                </p>
              </div>
            )}
          </div>
        </SignedIn>
      </SidebarFooter>
    </Sidebar>
  );
}

// no export default, just named export
