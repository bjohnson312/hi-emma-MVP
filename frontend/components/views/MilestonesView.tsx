import { useState, useEffect } from "react";
import backend from "@/lib/backend-client";
import { Award, Trophy, Star, Calendar } from "lucide-react";

interface UserMilestone {
  id: number;
  milestone_type: string;
  title: string;
  description?: string;
  achieved_at: Date;
  metadata: Record<string, any>;
}

export function MilestonesView() {
  const [milestones, setMilestones] = useState<UserMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("emma_user_id") || "";
      const response = await backend.profile.getMilestones({ user_id: userId, limit: 50 });
      setMilestones(response.milestones);
    } catch (error) {
      console.error("Failed to load milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case "interaction_count":
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case "streak":
        return <Star className="w-6 h-6 text-purple-500" />;
      case "achievement":
        return <Award className="w-6 h-6 text-blue-500" />;
      default:
        return <Award className="w-6 h-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Your Milestones
        </h1>
        <p className="text-muted-foreground mt-1">
          Celebrating your wellness journey achievements
        </p>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-muted-foreground">
            Keep going! Your first milestone is just around the corner.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-full p-3 border border-gray-200 dark:border-gray-700">
                  {getMilestoneIcon(milestone.milestone_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-1">
                    {milestone.title}
                  </h3>
                  {milestone.description && (
                    <p className="text-muted-foreground text-sm mb-3">
                      {milestone.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(milestone.achieved_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
        <h2 className="font-semibold text-foreground mb-2">Keep Building Your Journey!</h2>
        <p className="text-sm text-muted-foreground">
          Milestones are automatically awarded as you consistently engage with your wellness practice. 
          Keep checking in daily, tracking your mood, and maintaining your routines to unlock more achievements!
        </p>
      </div>
    </div>
  );
}
