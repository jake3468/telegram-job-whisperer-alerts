import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
import { SignedIn, UserButton } from '@clerk/clerk-react';
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
          {/* Mobile Header with Hamburger and User Button */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black h-16">
            <SidebarTrigger className="h-10 w-10 flex items-center justify-center rounded-md transition-colors text-slate-100 bg-red-800 hover:bg-red-700">
              <Menu className="w-6 h-6 text-white" strokeWidth={2} />
              <span className="sr-only">Toggle navigation menu</span>
            </SidebarTrigger>
            
            <SignedIn>
              <UserButton appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }} />
            </SignedIn>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>;
}