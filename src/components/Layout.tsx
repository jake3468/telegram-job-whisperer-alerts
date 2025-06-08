import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  return <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-black">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Mobile Header with only Hamburger */}
          <header className="lg:hidden flex items-center justify-start p-4 border-b border-white/10 bg-black h-16">
            <SidebarTrigger className="h-10 w-10 flex items-center justify-center rounded-md transition-colors mx-0 my-0 px-0 py-0 font-light text-slate-950 bg-blue-500 hover:bg-blue-400">
              <Menu className="w-6 h-6" strokeWidth={2} />
              <span className="sr-only">Toggle navigation menu</span>
            </SidebarTrigger>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>;
}