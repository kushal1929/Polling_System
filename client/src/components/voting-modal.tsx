import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  question: string;
  allowMultiple: boolean;
  options: PollOption[];
}

interface VotingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
  hasVoted?: boolean;
}

export function VotingModal({ open, onOpenChange, poll, hasVoted = false }: VotingModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!poll) throw new Error("No poll selected");
      return await apiRequest("POST", `/api/polls/${poll.id}/vote`, { optionId });
    },
    onSuccess: () => {
      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      onOpenChange(false);
      setSelectedOptions([]);
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Please select an option",
        description: "You must select at least one option to vote.",
        variant: "destructive",
      });
      return;
    }

    // For now, just submit the first selected option
    // TODO: Handle multiple selections properly
    voteMutation.mutate(selectedOptions[0]);
  };

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (!poll) return;

    if (poll.allowMultiple) {
      if (checked) {
        setSelectedOptions(prev => [...prev, optionId]);
      } else {
        setSelectedOptions(prev => prev.filter(id => id !== optionId));
      }
    } else {
      setSelectedOptions(checked ? [optionId] : []);
    }
  };

  if (!poll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-voting">
        <DialogHeader>
          <DialogTitle data-testid="text-vote-title">Vote on Poll</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <h4 className="text-base font-medium text-foreground" data-testid="text-poll-question">
            {poll.question}
          </h4>
          
          {hasVoted ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-already-voted">
                You have already voted on this poll.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {poll.allowMultiple ? (
                  // Multiple choice
                  poll.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 p-3 border border-input rounded-md hover:bg-accent cursor-pointer vote-animation">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={(checked) => handleOptionChange(option.id, checked as boolean)}
                        data-testid={`checkbox-option-${option.id}`}
                      />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer" data-testid={`label-option-${option.id}`}>
                        {option.text}
                      </Label>
                    </div>
                  ))
                ) : (
                  // Single choice
                  <RadioGroup 
                    value={selectedOptions[0] || ""} 
                    onValueChange={(value) => setSelectedOptions([value])}
                  >
                    {poll.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-3 p-3 border border-input rounded-md hover:bg-accent cursor-pointer vote-animation">
                        <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-option-${option.id}`} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer" data-testid={`label-option-${option.id}`}>
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-vote"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={voteMutation.isPending || selectedOptions.length === 0}
                  data-testid="button-submit-vote"
                >
                  {voteMutation.isPending ? "Submitting..." : "Submit Vote"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
