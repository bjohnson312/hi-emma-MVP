import { useState, useEffect } from "react";
import backend from "@/lib/backend-client";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Activity, Home, Briefcase, Star, Sparkles } from "lucide-react";

interface MemoryDetail {
  key: string;
  value: string;
  lastMentioned: Date;
  mentionCount: number;
}

interface MemorySummary {
  category: string;
  details: MemoryDetail[];
}

const categoryIcons: Record<string, any> = {
  health_concerns: Activity,
  family: Heart,
  activities: Sparkles,
  preferences: Star,
  goals: Star,
  work: Briefcase,
  other: Brain,
};

const categoryLabels: Record<string, string> = {
  health_concerns: "Health & Wellness",
  family: "Family & Relationships",
  activities: "Activities & Hobbies",
  preferences: "Preferences & Routines",
  goals: "Goals & Aspirations",
  work: "Work & Career",
  other: "Other",
};

interface MemoriesViewProps {
  userId: string;
}

export default function MemoriesView({ userId }: MemoriesViewProps) {
  const [memories, setMemories] = useState<MemorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, [userId]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const response = await backend.conversation.getMemorySummary({ userId });
      setMemories(response.memories);
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-foreground/60">Loading memories...</div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-semibold text-foreground">Emma's Memory</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Brain className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-foreground mb-2">No memories yet</h2>
          <p className="text-foreground/60">
            As you chat with Emma, she'll remember important details about you to make future
            conversations more personal and meaningful.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-semibold text-foreground">Emma's Memory</h1>
        </div>
        <Button onClick={loadMemories} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <p className="text-foreground/60 mb-8">
        Emma remembers these details to make your conversations more personal and attentive.
      </p>

      <div className="space-y-6">
        {memories.map((memory) => {
          const Icon = categoryIcons[memory.category] || Brain;
          const label = categoryLabels[memory.category] || memory.category;

          return (
            <div key={memory.category} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-foreground">{label}</h2>
              </div>

              <div className="space-y-3">
                {memory.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="bg-background/50 rounded-lg p-4 border border-border/50"
                  >
                    <p className="text-foreground">{detail.value}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-foreground/50">
                      <span>Last mentioned {formatDate(detail.lastMentioned)}</span>
                      {detail.mentionCount > 1 && (
                        <span>• Mentioned {detail.mentionCount} times</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
