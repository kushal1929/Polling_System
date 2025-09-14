import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PollCard } from "@/components/poll-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, XIcon, BarChartIcon, TrendingUpIcon, UsersIcon, PieChartIcon } from "lucide-react";

export default function Dashboard() {
  const [quickPoll, setQuickPoll] = useState({
    question: "",
    options: ["", ""],
    allowMultiple: false,
    showResults: true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user polls
  const { data: polls = [] } = useQuery({
    queryKey: ["/api/polls", "my"],
    queryFn: async () => {
      const response = await fetch("/api/polls/my", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch polls");
      return response.json();
    },
  });

  // Fetch user stats
  const { data: stats = { totalPolls: 0, activePolls: 0, totalVotes: 0 } } = useQuery({
    queryKey: ["/api/stats", "user"],
    queryFn: async () => {
      const response = await fetch("/api/stats/user", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (pollData: typeof quickPoll) => {
      return await apiRequest("POST", "/api/polls", {
        question: pollData.question,
        options: pollData.options.filter(opt => opt.trim() !== ""),
        allowMultiple: pollData.allowMultiple,
        showResults: pollData.showResults,
      });
    },
    onSuccess: () => {
      toast({
        title: "Poll created!",
        description: "Your poll has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setQuickPoll({
        question: "",
        options: ["", ""],
        allowMultiple: false,
        showResults: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create poll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addOption = () => {
    setQuickPoll(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (quickPoll.options.length > 2) {
      setQuickPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setQuickPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleCreateQuickPoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = quickPoll.options.filter(opt => opt.trim() !== "");
    
    if (!quickPoll.question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a poll question.",
        variant: "destructive",
      });
      return;
    }

    if (validOptions.length < 2) {
      toast({
        title: "At least 2 options required",
        description: "Please provide at least 2 options for your poll.",
        variant: "destructive",
      });
      return;
    }

    createPollMutation.mutate(quickPoll);
  };

  const avgParticipation = stats.totalPolls > 0 
    ? Math.round((stats.totalVotes / stats.totalPolls)) 
    : 0;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          description="Manage your polls and view real-time results" 
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Polls</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-total-polls">
                      {stats.totalPolls}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChartIcon className="w-6 h-6 text-blue-600" />
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
                      {stats.activePolls}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUpIcon className="w-6 h-6 text-green-600" />
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
                      {stats.totalVotes}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Participation</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-avg-participation">
                      {avgParticipation}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <PieChartIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Polls Section */}
          <Card className="mb-8">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recent Polls</h3>
                <Button variant="ghost" size="sm" data-testid="button-view-all-polls">
                  View All →
                </Button>
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {polls.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p data-testid="text-no-polls">No polls created yet. Create your first poll below!</p>
                </div>
              ) : (
                polls.slice(0, 3).map((poll: any) => (
                  <div key={poll.id} className="p-6">
                    <PollCard poll={poll} isOwn={true} />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Create Poll Section */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Poll Creation</h3>
              
              <form onSubmit={handleCreateQuickPoll} className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Poll Question
                  </Label>
                  <Input
                    type="text"
                    placeholder="What would you like to ask?"
                    value={quickPoll.question}
                    onChange={(e) => setQuickPoll(prev => ({ ...prev, question: e.target.value }))}
                    data-testid="input-poll-question"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Poll Options
                  </Label>
                  <div className="space-y-2">
                    {quickPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          data-testid={`input-option-${index}`}
                        />
                        {quickPoll.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            data-testid={`button-remove-option-${index}`}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addOption}
                    className="mt-2"
                    data-testid="button-add-option"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <Checkbox
                        checked={quickPoll.allowMultiple}
                        onCheckedChange={(checked) => 
                          setQuickPoll(prev => ({ ...prev, allowMultiple: checked as boolean }))
                        }
                        data-testid="checkbox-allow-multiple"
                      />
                      <span className="ml-2 text-sm text-foreground">Allow multiple choices</span>
                    </label>
                    <label className="flex items-center">
                      <Checkbox
                        checked={quickPoll.showResults}
                        onCheckedChange={(checked) => 
                          setQuickPoll(prev => ({ ...prev, showResults: checked as boolean }))
                        }
                        data-testid="checkbox-show-results"
                      />
                      <span className="ml-2 text-sm text-foreground">Show results immediately</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="button-save-draft"
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPollMutation.isPending}
                      data-testid="button-create-poll"
                    >
                      {createPollMutation.isPending ? "Creating..." : "Create Poll"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
