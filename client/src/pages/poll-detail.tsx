import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { VotingModal } from "@/components/voting-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  CalendarIcon, 
  UsersIcon, 
  ShareIcon, 
  VoteIcon,
  BarChartIcon,
  TrendingUpIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PollDetailProps {
  pollId: string;
}

export default function PollDetail({ pollId }: PollDetailProps) {
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { messages } = useWebSocket();

  const { data: poll, isLoading } = useQuery({
    queryKey: ["/api/polls", pollId],
    queryFn: async () => {
      const response = await fetch(`/api/polls/${pollId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch poll");
      return response.json();
    },
  });

  const { data: userVotes = [] } = useQuery({
    queryKey: ["/api/votes", "user", pollId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}/votes/user`, { credentials: "include" });
        if (response.status === 404) return [];
        if (!response.ok) throw new Error("Failed to fetch user votes");
        return response.json();
      } catch {
        return [];
      }
    },
    enabled: !!pollId,
  });

  // Listen for real-time updates
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.type === "VOTE_CAST" && latestMessage.pollId === pollId) {
      queryClient.invalidateQueries({ queryKey: ["/api/polls", pollId] });
    }
  }, [messages, pollId, queryClient]);

  useEffect(() => {
    setHasVoted(userVotes.length > 0);
  }, [userVotes]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOptionPercentage = (optionId: string) => {
    if (!poll || poll.stats.totalVotes === 0) return 0;
    const optionVotes = poll.stats.optionVotes.find((v: any) => v.optionId === optionId)?.count || 0;
    return Math.round((optionVotes / poll.stats.totalVotes) * 100);
  };

  const getOptionVotes = (optionId: string) => {
    if (!poll) return 0;
    return poll.stats.optionVotes.find((v: any) => v.optionId === optionId)?.count || 0;
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: poll.question,
        text: "Check out this poll!",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Poll link has been copied to clipboard.",
      });
    }
  };

  const handleVote = () => {
    setShowVotingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading poll...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Poll not found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Poll Details" 
          description="View poll results and cast your vote"
          showCreateButton={true}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Poll Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-4" data-testid="text-poll-question">
                      {poll.question}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center" data-testid="text-poll-date">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(poll.createdAt)}
                      </span>
                      <span className="flex items-center" data-testid="text-total-votes">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        {poll.stats.totalVotes} votes
                      </span>
                      <Badge 
                        variant={poll.isPublished ? "default" : "secondary"}
                        className={cn(
                          poll.isPublished && "bg-green-100 text-green-700 hover:bg-green-100"
                        )}
                        data-testid="badge-poll-status"
                      >
                        {poll.isPublished && (
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 real-time-pulse" />
                        )}
                        {poll.isPublished ? "Live" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!hasVoted && poll.isPublished && (
                      <Button onClick={handleVote} data-testid="button-vote">
                        <VoteIcon className="w-4 h-4 mr-2" />
                        Vote
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleShare} data-testid="button-share">
                      <ShareIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-votes">
                        {poll.stats.totalVotes}
                      </p>
                    </div>
                    <UsersIcon className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Options</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-options">
                        {poll.options.length}
                      </p>
                    </div>
                    <BarChartIcon className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Leading Option</p>
                      <p className="text-xl font-bold text-foreground truncate" data-testid="stat-leading-option">
                        {poll.stats.totalVotes > 0 
                          ? poll.options.reduce((max: any, option: any) => 
                              getOptionVotes(option.id) > getOptionVotes(max.id) ? option : max
                            ).text
                          : "No votes yet"
                        }
                      </p>
                    </div>
                    <TrendingUpIcon className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Poll Results */}
            <Card>
              <CardHeader>
                <CardTitle>Poll Results</CardTitle>
              </CardHeader>
              <CardContent>
                {hasVoted && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800" data-testid="text-vote-confirmation">
                      ✓ You have voted on this poll
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {poll.options.map((option: any, index: number) => {
                    const percentage = getOptionPercentage(option.id);
                    const votes = getOptionVotes(option.id);
                    const isUserVote = userVotes.some((vote: any) => vote.optionId === option.id);
                    
                    return (
                      <div 
                        key={option.id} 
                        className={cn(
                          "p-4 rounded-lg border",
                          isUserVote ? "border-primary bg-primary/5" : "border-border"
                        )}
                        data-testid={`option-result-${option.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="font-medium text-foreground" data-testid={`text-option-${option.id}`}>
                              {option.text}
                              {isUserVote && <span className="ml-2 text-primary">✓</span>}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <span className="text-muted-foreground" data-testid={`text-votes-${option.id}`}>
                              {votes} votes
                            </span>
                            <span className="font-semibold text-foreground" data-testid={`text-percentage-${option.id}`}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-3 progress-bar" 
                          data-testid={`progress-${option.id}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {poll.stats.totalVotes === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground" data-testid="text-no-votes">
                      No votes yet. Be the first to vote!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <VotingModal
        open={showVotingModal}
        onOpenChange={setShowVotingModal}
        poll={poll}
        hasVoted={hasVoted}
      />
    </div>
  );
}
