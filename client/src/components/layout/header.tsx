import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  showCreateButton?: boolean;
}

export function Header({ title, description, showCreateButton = true }: HeaderProps) {
  const { isConnected } = useWebSocket();

  return (
    <header className="bg-card border-b border-border p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">{title}</h2>
          <p className="text-muted-foreground" data-testid="text-page-description">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div 
              className={cn(
                "w-2 h-2 rounded-full real-time-pulse",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
              data-testid="status-connection"
            />
            <span className="text-muted-foreground">
              {isConnected ? "Live Updates" : "Disconnected"}
            </span>
          </div>
          {showCreateButton && (
            <Link href="/create">
              <Button data-testid="button-new-poll">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Poll
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
