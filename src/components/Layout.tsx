import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl shadow-2xl border-b border-white/25">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 border-white/20 ring-2 ring-white/5 text-white rounded-2xl shadow-xl transition-all flex items-center justify-center bg-black hover:bg-zinc-800 hover:ring-white/10">
            <div className="flex flex-col gap-1">
              <div className="w-5 h-0.5 bg-white rounded-full transition-all"></div>
              <div className="w-5 h-0.5 bg-white rounded-full transition-all"></div>
              <div className="w-5 h-0.5 bg-white rounded-full transition-all"></div>
            </div>
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