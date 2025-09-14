import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  UsersIcon, 
  BarChartIcon, 
  TrendingUpIcon, 
  ActivityIcon,
  SearchIcon,
  TrashIcon,
  ShieldIcon,
  CalendarIcon,
  MailIcon
} from "lucide-react";

export default function AdminPanel() {
  const [searchUsers, setSearchUsers] = useState("");
  const [searchPolls, setSearchPolls] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch admin stats
  const { data: adminStats = { 
    totalUsers: 0, 
    totalPolls: 0, 
    totalVotes: 0, 
    activePolls: 0 
  } } = useQuery({
    queryKey: ["/api/admin", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch admin stats");
      return response.json();
    },
  });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin", "users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch all polls
  const { data: polls = [] } = useQuery({
    queryKey: ["/api/polls"],
    queryFn: async () => {
      const response = await fetch("/api/polls", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch polls");
      return response.json();
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete poll mutation
  const deletePollMutation = useMutation({
    mutationFn: async (pollId: string) => {
      return await apiRequest("DELETE", `/api/admin/polls/${pollId}`);
    },
    onSuccess: () => {
      toast({
        title: "Poll deleted",
        description: "The poll has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete poll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: any) =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredPolls = polls.filter((poll: any) =>
    poll.question.toLowerCase().includes(searchPolls.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Admin Panel" 
          description="Manage users, polls, and monitor system activity"
          showCreateButton={true}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-total-users">
                      {adminStats.totalUsers}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Polls</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-total-polls">
                      {adminStats.totalPolls}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChartIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Polls</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-active-polls">
                      {adminStats.activePolls}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-total-votes">
                      {adminStats.totalVotes}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ActivityIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
              <TabsTrigger value="polls" data-testid="tab-polls">Polls</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-users"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground" data-testid="text-no-users">
                          {searchUsers ? "No users match your search." : "No users found."}
                        </p>
                      </div>
                    ) : (
                      filteredUsers.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                          data-testid={`user-item-${user.id}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground text-sm font-medium">
                                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-foreground" data-testid={`text-user-name-${user.id}`}>
                                  {user.name}
                                </p>
                                {user.isAdmin && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <ShieldIcon className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center" data-testid={`text-user-email-${user.id}`}>
                                  <MailIcon className="w-4 h-4 mr-1" />
                                  {user.email}
                                </span>
                                <span className="flex items-center" data-testid={`text-user-date-${user.id}`}>
                                  <CalendarIcon className="w-4 h-4 mr-1" />
                                  {formatDate(user.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {!user.isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-user-${user.id}`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.name}? This action cannot be undone.
                                    All polls and votes created by this user will also be deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUserMutation.mutate(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Polls Tab */}
            <TabsContent value="polls" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Poll Management</CardTitle>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search polls by question..."
                      value={searchPolls}
                      onChange={(e) => setSearchPolls(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-polls"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredPolls.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground" data-testid="text-no-polls">
                          {searchPolls ? "No polls match your search." : "No polls found."}
                        </p>
                      </div>
                    ) : (
                      filteredPolls.map((poll: any) => (
                        <div
                          key={poll.id}
                          className="flex items-start justify-between p-4 border border-border rounded-lg"
                          data-testid={`poll-item-${poll.id}`}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-2" data-testid={`text-poll-question-${poll.id}`}>
                              {poll.question}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center" data-testid={`text-poll-date-${poll.id}`}>
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {formatDate(poll.createdAt)}
                              </span>
                              <span data-testid={`text-poll-votes-${poll.id}`}>
                                {poll.stats.totalVotes} votes
                              </span>
                              <span data-testid={`text-poll-options-${poll.id}`}>
                                {poll.options.length} options
                              </span>
                              <Badge 
                                variant={poll.isPublished ? "default" : "secondary"}
                                className={poll.isPublished ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                                data-testid={`badge-poll-status-${poll.id}`}
                              >
                                {poll.isPublished ? "Live" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive ml-4"
                                data-testid={`button-delete-poll-${poll.id}`}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Poll</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this poll? This action cannot be undone.
                                  All votes associated with this poll will also be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePollMutation.mutate(poll.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
