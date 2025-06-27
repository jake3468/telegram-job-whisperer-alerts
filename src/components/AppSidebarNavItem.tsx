
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarNavItemProps {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function AppSidebarNavItem({ title, url, icon: Icon }: AppSidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === url;

  return (
    <li>
      <Link
        to={url}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:bg-gray-800 hover:text-white",
          isActive 
            ? "bg-gray-800 text-white" 
            : "text-gray-400 hover:text-white"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{title}</span>
      </Link>
    </li>
  );
}
