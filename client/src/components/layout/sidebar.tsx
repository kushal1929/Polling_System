import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  HomeIcon, 
  Vote, 
  PlusIcon, 
  SearchIcon, 
  SettingsIcon,
  LogOutIcon,
  SendHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { AuthState } from "@/lib/auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "My Polls", href: "/my-polls", icon: Vote },
  { name: "Create Poll", href: "/create", icon: PlusIcon },
  { name: "Browse Polls", href: "/browse", icon: SearchIcon },
  { name: "Admin Panel", href: "/admin", icon: SettingsIcon, adminOnly: true },
];

export function Sidebar() {
  const [location] = useLocation();
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    return authService.subscribe(setAuthState);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || authState.user?.isAdmin
  );

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <SendHorizontal className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-app-title">PollStream</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
              {authState.user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-username">
              {authState.user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              {authState.user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full"
          data-testid="button-logout"
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
