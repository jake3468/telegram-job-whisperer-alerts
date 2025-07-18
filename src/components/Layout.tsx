import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
import React from 'react';
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  return <SidebarProvider defaultOpen={true} style={{
    "--sidebar-width": "clamp(220px, 20vw, 295px)"
  } as React.CSSProperties}>
      {/* Header for mobile/tablet - with logo and name in top right */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-900/90 via-fuchsia-900/90 to-indigo-900/85 backdrop-blur-2xl shadow-2xl border-b border-fuchsia-400/30">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg transition-all flex items-center justify-center bg-zinc-900 hover:bg-zinc-800">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img alt="JobBots Logo" src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" className="max-h-8 drop-shadow-2xl object-fill" />
            <span className="font-orbitron drop-shadow bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-white font-bold min-w-0 truncate text-lg">Aspirely.ai</span>
          </div>
        </div>
      </header>
      <div className={`
          min-h-screen flex w-full 
          bg-black
        `} style={{
      margin: 0,
      padding: 0,
      boxShadow: "none"
    }}>
        <AppSidebar />
        {/* Main content area now has padding-top to avoid the fixed mobile header */}
        <div className="flex-1 flex flex-col bg-black pt-28 lg:pt-0">
          <main className="flex-1 w-full px-0 py-0 bg-transparent">
            <div className="w-full px-3 sm:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
}