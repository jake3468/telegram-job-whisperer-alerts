

import { User, Bell, Target, FileText, X, Share2, CreditCard, FileUser, Building2, MessageSquare, Kanban, Phone, Briefcase, Bot } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import CreditBalanceDisplay from './CreditBalanceDisplay';
import { useCachedLogo } from '@/hooks/useCachedLogo';

const profileItems = [{
  title: 'Profile',
  url: '/profile',
  icon: User
}, {
  title: 'AI Agents',
  url: '/ai-agents',
  icon: Bot
}, {
  title: 'Create Job Alerts',
  url: '/job-alerts',
  icon: Bell
}, {
  title: 'Job Board',
  url: '/job-board',
  icon: Briefcase
}, {
  title: 'Job Tracker',
  url: '/job-tracker',
  icon: Kanban
}, {
  title: 'Pricing Plans',
  url: '/get-more-credits',
  icon: CreditCard
}];

const toolItems = [{
  title: 'Resume Bot',
  url: '/resume-builder',
  icon: FileUser
}, {
  title: 'Company Decoder',
  url: '/company-role-analysis',
  icon: Building2
}, {
  title: 'Interview Prep',
  url: '/interview-prep',
  icon: MessageSquare
}, {
  title: 'AI Mock Interview',
  url: '/ai-mock-interview',
  icon: Phone
}, {
  title: 'Cover Letter',
  url: '/cover-letter',
  icon: FileText
}, {
  title: 'LinkedIn Posts',
  url: '/linkedin-posts',
  icon: Share2
}, {
  title: 'Job Analysis',
  url: '/job-guide',
  icon: Target
}];

export function AppSidebar() {
  const {
    state,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const {
    user
  } = useUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  
  // Cache the logo to prevent reloading on navigation
  const cachedLogoUrl = useCachedLogo("/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg");

  // Helper to pick best name string
  const getDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if ((user as any).username) return (user as any).username;
    return "User";
  };

  return <Sidebar className="
      bg-gradient-to-br from-black via-gray-950 to-fuchsia-950
      border-r border-white/20 shadow-2xl shadow-fuchsia-600/10 
      backdrop-blur-2xl
      h-full
      overflow-y-auto overflow-x-hidden
      scrollbar-none
      /* No rounded corners for a squared sidebar */
    ">
      {/* Logo & Name section: hide only on tablet (md to lg), show on mobile and desktop */}
      <SidebarHeader className="flex md:hidden lg:flex py-2 px-3 border-b border-fuchsia-400/15 bg-black/95 relative flex-col items-center gap-1">
        <img alt="JobBots Logo" src={cachedLogoUrl} className="max-h-10 mb-1 drop-shadow-2xl object-fill" />
        <span className="font-orbitron drop-shadow bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text select-none tracking-widest text-white font-bold min-w-0 truncate text-xl">Aspirely.ai</span>
        {/* X button for mobile - positioned at top right */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)} className="absolute top-2 right-2 h-8 w-8 text-fuchsia-300 hover:bg-fuchsia-800/40 border border-fuchsia-400/20 bg-black/50 rounded-xl transition-all">
            <X className="h-5 w-5" />
          </Button>
        )}
      </SidebarHeader>

      {/* Compact header for tablet view when logo is hidden - with X button at top right */}
      <SidebarHeader className="hidden md:flex lg:hidden py-2 px-3 border-b border-fuchsia-400/15 bg-black/95 relative justify-end">
        <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)} className="h-10 w-10 text-fuchsia-300 hover:bg-fuchsia-800/40 border border-fuchsia-400/20 bg-black/50 rounded-xl transition-all">
          <X className="h-6 w-6" />
        </Button>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden w-full px-0 !pr-0 pt-2">
        {/* Profile Section - visible on all screen sizes with proper spacing for tablet */}
        <SidebarGroup className="bg-gray-900/40 mx-2 mt-1 shadow-md rounded-none">
          <SidebarGroupContent>
            <SidebarMenu>
              {profileItems.map(item => {
              const isCurrentlyActive = isActive(item.url);
              return <SidebarMenuItem key={item.title} className="w-full">
                    <SidebarMenuButton asChild className="w-full px-0">
                      <NavLink to={item.url} className={`
                          flex items-center gap-2 py-2 
                          mx-0                          /* remove horizontal margin for full-width highlight */
                          px-3
                          rounded-none                   /* squared corners */
                          font-orbitron transition-all duration-300 
                          text-base font-bold w-full
                          ${isCurrentlyActive ? 'bg-gradient-to-r from-pastel-peach via-pastel-blue to-pastel-lavender text-black dark:text-white shadow-xl border-y border-pastel-peach/30' : 'text-white hover:bg-gradient-to-r hover:from-fuchsia-800 hover:via-fuchsia-600 hover:to-indigo-800 hover:text-white hover:shadow-lg'}
                        `} style={{
                    overflow: 'hidden',
                    borderRadius: 0 // Ensures squared corners
                  }}>
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isCurrentlyActive ? 'text-black dark:text-white' : 'text-white'}`} />
                        {state === 'expanded' && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="bg-gray-800/40 mt-1 mx-2 shadow-md rounded-none">
          <SidebarGroupLabel className="text-fuchsia-200 font-orbitron text-xs px-3 py-1">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map(item => {
              const isCurrentlyActive = isActive(item.url);
              return <SidebarMenuItem key={item.title} className="w-full">
                    <SidebarMenuButton asChild className="w-full px-0">
                      <NavLink to={item.url} className={`
                          flex items-center gap-2 py-2 
                          mx-0                          /* remove horizontal margin for full-width highlight */
                          px-3
                          rounded-none
                          font-orbitron transition-all duration-300 
                          text-base font-bold w-full
                          ${isCurrentlyActive ? 'bg-gradient-to-r from-pastel-lavender via-pastel-mint to-pastel-peach text-black dark:text-white shadow-xl border-y border-pastel-lavender/30' : 'text-white hover:bg-gradient-to-r hover:from-fuchsia-700 hover:to-indigo-800 hover:text-white'}
                        `} style={{
                    overflow: 'hidden',
                    borderRadius: 0
                  }}>
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isCurrentlyActive ? 'text-black dark:text-white' : 'text-white'}`} />
                        {state === 'expanded' && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-fuchsia-400/10 bg-gradient-to-r from-black/90 to-fuchsia-950/80 mt-2 rounded-none relative">
        <SignedIn>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-3 w-full">
              <div className={isMobile ? "relative z-[70]" : ""} style={isMobile ? {
              isolation: 'isolate'
            } : {}} onPointerDown={e => {
              if (isMobile) {
                e.stopPropagation();
              }
            }} onClick={e => {
              if (isMobile) {
                e.stopPropagation();
              }
            }}>
                <UserButton appearance={{
                elements: {
                  avatarBox: "w-10 h-10 flex-shrink-0",
                  userButtonPopoverCard: isMobile ? "!z-[80] !important" : "",
                  userButtonPopoverActionButton: isMobile ? "!z-[80] pointer-events-auto" : "",
                  userButtonPopoverFooter: isMobile ? "!z-[80]" : ""
                }
              }} />
              </div>
              {state === 'expanded' && user && <div className="flex-1 min-w-0">
                  {/* Show display name (not email), kept very responsive */}
                  <p className="text-fuchsia-100 text-base font-orbitron truncate break-all">
                    {getDisplayName()}
                  </p>
                </div>}
            </div>
            {/* Show credit balance */}
            <CreditBalanceDisplay />
          </div>
        </SignedIn>
      </SidebarFooter>
    </Sidebar>;
}

// no export default, just named export

