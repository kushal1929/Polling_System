import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PollCard } from "@/components/poll-card";
import { VotingModal } from "@/components/voting-modal";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon } from "lucide-react";

export default function BrowsePolls() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["/api/polls"],
    queryFn: async () => {
      const response = await fetch("/api/polls", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch polls");
      return response.json();
    },
  });

  const filteredPolls = polls.filter((poll: any) =>
    poll.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVoteOnPoll = (poll: any) => {
    setSelectedPoll(poll);
    setShowVotingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading polls...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Browse Polls" 
          description="Discover and vote on polls from the community"
          showCreateButton={true}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search polls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-polls"
                />
              </div>
            </CardContent>
          </Card>

          {/* Polls Grid */}
          {filteredPolls.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground" data-testid="text-no-polls">
                  {searchQuery ? "No polls match your search." : "No polls available yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPolls.map((poll: any) => (
                <div key={poll.id}>
                  <PollCard 
                    poll={poll} 
                    showActions={true}
                    onVote={() => handleVoteOnPoll(poll)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <VotingModal
        open={showVotingModal}
        onOpenChange={setShowVotingModal}
        poll={selectedPoll}
      />
    </div>
  );
}
