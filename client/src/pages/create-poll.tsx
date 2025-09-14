import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, XIcon, SaveIcon, SendIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CreatePoll() {
  const [, setLocation] = useLocation();
  const [pollData, setPollData] = useState({
    question: "",
    description: "",
    options: ["", "", ""],
    allowMultiple: false,
    showResults: true,
    isPublished: true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPollMutation = useMutation({
    mutationFn: async (data: typeof pollData) => {
      const validOptions = data.options.filter(opt => opt.trim() !== "");
      return await apiRequest("POST", "/api/polls", {
        question: data.question,
        options: validOptions,
        allowMultiple: data.allowMultiple,
        showResults: data.showResults,
      });
    },
    onSuccess: () => {
      toast({
        title: "Poll created!",
        description: "Your poll has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      setLocation("/");
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
    setPollData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = pollData.options.filter(opt => opt.trim() !== "");
    
    if (!pollData.question.trim()) {
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

    createPollMutation.mutate(pollData);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Create Poll" 
          description="Design your poll and start collecting responses"
          showCreateButton={false}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Poll Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Question Section */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="question" className="text-base font-medium">
                        Poll Question *
                      </Label>
                      <Textarea
                        id="question"
                        placeholder="What would you like to ask your audience?"
                        value={pollData.question}
                        onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                        className="mt-2 min-h-[80px]"
                        data-testid="textarea-poll-question"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Add context or additional information about your poll"
                        value={pollData.description}
                        onChange={(e) => setPollData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-2"
                        data-testid="textarea-poll-description"
                      />
                    </div>
                  </div>

                  {/* Options Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      Poll Options *
                    </Label>
                    
                    <div className="space-y-3">
                      {pollData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <Input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="flex-1"
                            data-testid={`input-poll-option-${index}`}
                          />
                          {pollData.options.length > 2 && (
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
                      variant="outline"
                      onClick={addOption}
                      className="w-full"
                      data-testid="button-add-option"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Another Option
                    </Button>
                  </div>

                  {/* Settings Section */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-medium">Poll Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allow-multiple">Allow Multiple Selections</Label>
                          <p className="text-sm text-muted-foreground">
                            Let voters choose more than one option
                          </p>
                        </div>
                        <Switch
                          id="allow-multiple"
                          checked={pollData.allowMultiple}
                          onCheckedChange={(checked) => 
                            setPollData(prev => ({ ...prev, allowMultiple: checked }))
                          }
                          data-testid="switch-allow-multiple"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show-results">Show Results Immediately</Label>
                          <p className="text-sm text-muted-foreground">
                            Display results to voters after they vote
                          </p>
                        </div>
                        <Switch
                          id="show-results"
                          checked={pollData.showResults}
                          onCheckedChange={(checked) => 
                            setPollData(prev => ({ ...prev, showResults: checked }))
                          }
                          data-testid="switch-show-results"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is-published">Publish Immediately</Label>
                          <p className="text-sm text-muted-foreground">
                            Make the poll available for voting right away
                          </p>
                        </div>
                        <Switch
                          id="is-published"
                          checked={pollData.isPublished}
                          onCheckedChange={(checked) => 
                            setPollData(prev => ({ ...prev, isPublished: checked }))
                          }
                          data-testid="switch-is-published"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="button-save-draft"
                    >
                      <SaveIcon className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPollMutation.isPending}
                      data-testid="button-create-poll"
                    >
                      <SendIcon className="w-4 h-4 mr-2" />
                      {createPollMutation.isPending ? "Creating..." : "Create Poll"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
