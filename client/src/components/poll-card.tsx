import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarIcon, 
  UsersIcon, 
  ShareIcon, 
  BarChartIcon,
  TrashIcon
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string;
  text: string;
}

interface PollStats {
  totalVotes: number;
  optionVotes: Array<{ optionId: string; count: number }>;
}

interface Poll {
  id: string;
  question: string;
  isPublished: boolean;
  showResults: boolean;
  createdAt: string;
  options: PollOption[];
  stats: PollStats;
}

interface PollCardProps {
  poll: Poll;
  showActions?: boolean;
  onDelete?: (pollId: string) => void;
  onVote?: () => void;
  isOwn?: boolean;
}

export function PollCard({ poll, showActions = true, onDelete, onVote, isOwn = false }: PollCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getOptionPercentage = (optionId: string) => {
    if (poll.stats.totalVotes === 0) return 0;
    const optionVotes = poll.stats.optionVotes.find(v => v.optionId === optionId)?.count || 0;
    return Math.round((optionVotes / poll.stats.totalVotes) * 100);
  };

  const getOptionVotes = (optionId: string) => {
    return poll.stats.optionVotes.find(v => v.optionId === optionId)?.count || 0;
  };

  const handleShare = () => {
    const url = `${window.location.origin}/poll/${poll.id}`;
    if (navigator.share) {
      navigator.share({
        title: poll.question,
        text: "Check out this poll!",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors" data-testid={`card-poll-${poll.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-foreground mb-2" data-testid="text-poll-question">
              {poll.question}
            </h4>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center" data-testid="text-poll-date">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formatDate(poll.createdAt)}
              </span>
              <span className="flex items-center" data-testid="text-poll-votes">
                <UsersIcon className="w-4 h-4 mr-1" />
                {poll.stats.totalVotes} votes
              </span>
              <Badge 
                variant={poll.isPublished ? "default" : "secondary"}
                className={cn(
                  "inline-flex items-center",
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
          {showActions && (
            <div className="flex items-center space-x-2 ml-4">
              {onVote && (
                <Button size="sm" onClick={onVote} data-testid="button-vote">
                  Vote
                </Button>
              )}
              <Link href={`/poll/${poll.id}`}>
                <Button size="sm" variant="outline" data-testid="button-view-results">
                  <BarChartIcon className="w-4 h-4 mr-1" />
                  View Results
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                data-testid="button-share-poll"
              >
                <ShareIcon className="w-4 h-4" />
              </Button>
              {isOwn && onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(poll.id)}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-delete-poll"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {poll.showResults && (
          <div className="space-y-3">
            {poll.options.slice(0, 3).map((option) => {
              const percentage = getOptionPercentage(option.id);
              const votes = getOptionVotes(option.id);
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate" data-testid={`text-option-${option.id}`}>
                      {option.text}
                    </span>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <span data-testid={`text-votes-${option.id}`}>{votes} votes</span>
                      <span className="font-medium text-foreground" data-testid={`text-percentage-${option.id}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" data-testid={`progress-${option.id}`} />
                </div>
              );
            })}
            {poll.options.length > 3 && (
              <p className="text-sm text-muted-foreground">
                +{poll.options.length - 3} more options
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
