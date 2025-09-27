
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true} style={{
      "--sidebar-width": "clamp(220px, 20vw, 295px)"
    } as React.CSSProperties}>
      {/* Header for mobile/tablet - with logo and name in top right */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl shadow-2xl border-b border-gray-200">
        <div className="flex items-center justify-between px-3 py-4">
          <SidebarTrigger className="text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <Menu size={24} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img alt="JobBots Logo" src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" className="max-h-8 drop-shadow-2xl object-fill" />
            <span className="font-orbitron drop-shadow bg-gradient-to-r from-sky-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent font-bold min-w-0 truncate text-lg">Aspirely.ai</span>
          </div>
        </div>
      </header>
      <div className="min-h-screen flex w-full bg-white" style={{
      margin: 0,
      padding: 0,
      boxShadow: "none",
      backgroundColor: "#ffffff"
    }}>
        <AppSidebar />
        {/* Main content area now has reduced padding-top */}
        <div className="flex-1 flex flex-col bg-white pt-20 lg:pt-0" style={{backgroundColor: "#ffffff"}}>
          <main className="flex-1 w-full px-0 py-0 bg-white" style={{backgroundColor: "#ffffff"}}>
            <div className="w-full px-3 sm:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
