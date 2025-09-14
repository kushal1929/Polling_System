import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { authService, type AuthState } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CreatePoll from "@/pages/create-poll";
import BrowsePolls from "@/pages/browse-polls";
import PollDetail from "@/pages/poll-detail";
import AdminPanel from "@/pages/admin-panel";
import { useWebSocket } from "./hooks/use-websocket";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    return authService.subscribe(setAuthState);
  }, []);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return <Login />;
  }

  return <>{children}</>;
}

function Router() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/create">
        <AuthGuard>
          <CreatePoll />
        </AuthGuard>
      </Route>
      <Route path="/browse">
        <AuthGuard>
          <BrowsePolls />
        </AuthGuard>
      </Route>
      <Route path="/poll/:id">
        {({ id }) => (
          <AuthGuard>
            <PollDetail pollId={id} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <AdminPanel />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
