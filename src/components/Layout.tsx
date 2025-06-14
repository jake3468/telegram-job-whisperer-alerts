
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      {/* Header for mobile - glassy vibrant with no content overlap */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-900/90 via-fuchsia-900/90 to-indigo-900/85 backdrop-blur-2xl shadow-2xl border-b border-fuchsia-400/30">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 bg-white/10 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg hover:bg-fuchsia-700/30 transition-all flex items-center justify-center">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/6239b4a7-4f3c-4902-a936-4216ae26d9af.png"
              alt="JobBots Logo"
              className="h-8 w-8 drop-shadow-lg"
            />
            <span className="font-orbitron font-extrabold text-2xl bg-gradient-to-r from-sky-300 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm tracking-wider select-none relative whitespace-nowrap">
              JobBots
            </span>
          </div>
        </div>
      </header>
      {/* The following div ensures no header overlap on mobile by ALWAYS adding pt-20 when header is fixed */}
      <div className={`
        min-h-screen flex w-full 
        bg-gradient-to-br from-[#0e1122] via-[#181526] to-[#21203a]
        ${'lg:pt-0 pt-20'}  /* Force padding top on mobile for all pages */
      `}
        style={{
          margin: 0,
          padding: 0,
          boxShadow: "none"
        }}
      >
        {/* Make sure AppSidebar and content are flush */}
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen bg-transparent">
          {/* Main Content */}
          <main className="flex-1 w-full px-0 py-0 bg-transparent">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
