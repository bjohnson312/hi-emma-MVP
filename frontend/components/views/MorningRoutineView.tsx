import { useState, useEffect } from "react";
import { Sun, Flame, TrendingUp, Calendar, CheckCircle2, Circle, Sparkles, MessageSquare, X, Clock, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import type { RoutineTemplate, MorningRoutinePreference, RoutineStats } from "~backend/morning/routine_types";
import { useToast } from "@/components/ui/use-toast";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface MorningRoutineViewProps {
  userId: string;
}

export default function MorningRoutineView({ userId }: MorningRoutineViewProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [preference, setPreference] = useState<MorningRoutinePreference | null>(null);
  const [stats, setStats] = useState<RoutineStats | null>(null);
  const [todayCompleted, setTodayCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadRoutineData();
  }, [userId]);

  async function loadRoutineData() {
    setLoading(true);
    try {
      const [templatesResult, preferenceResult, statsResult, todayResult] = await Promise.all([
        backend.morning.getRoutineTemplates(),
        backend.morning.getRoutinePreference({ user_id: userId }),
        backend.morning.getRoutineStats({ user_id: userId, days: 30 }),
        backend.morning.getTodayCompletion({ user_id: userId })
      ]);

      setTemplates(templatesResult.templates);
      setPreference(preferenceResult.preference);
      setStats(statsResult);

      if (todayResult.completion?.activities_completed) {
        try {
          const activities = typeof todayResult.completion.activities_completed === 'string'
            ? JSON.parse(todayResult.completion.activities_completed)
            : todayResult.completion.activities_completed;
          setTodayCompleted(activities || []);
        } catch (e) {
          console.error("Failed to parse activities:", e);
          setTodayCompleted([]);
        }
      } else {
        setTodayCompleted([]);
      }

      if (!preferenceResult.preference) {
        setShowTemplates(true);
      }
    } catch (error) {
      console.error("Failed to load routine data:", error);
      toast({
        title: "Error",
        description: "Failed to load morning routine data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTemplate(template: RoutineTemplate) {
    if (template.id === "custom") {
      setShowChat(true);
      setShowTemplates(false);
      return;
    }

    try {
      const newPreference = await backend.morning.createRoutinePreference({
        user_id: userId,
        routine_name: template.name,
        activities: template.activities,
        duration_minutes: template.duration_minutes
      });

      setPreference(newPreference);
      setShowTemplates(false);
      
      toast({
        title: "Routine Saved!",
        description: `Your "${template.name}" routine has been set up.`,
      });

      await loadRoutineData();
    } catch (error) {
      console.error("Failed to save routine:", error);
      toast({
        title: "Error",
        description: "Failed to save routine.",
        variant: "destructive"
      });
    }
  }

  async function handleToggleActivity(activityId: string) {
    if (!preference) return;

    const newCompleted = todayCompleted.includes(activityId)
      ? todayCompleted.filter(id => id !== activityId)
      : [...todayCompleted, activityId];

    setTodayCompleted(newCompleted);

    const allCompleted = newCompleted.length === preference.activities.length;

    try {
      await backend.morning.logRoutineCompletion({
        user_id: userId,
        activities_completed: newCompleted,
        all_completed: allCompleted
      });

      await loadRoutineData();

      if (allCompleted) {
        toast({
          title: "🎉 Routine Complete!",
          description: "Great job completing your morning routine!",
        });
      }
    } catch (error) {
      console.error("Failed to log completion:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <RefreshCw className="w-8 h-8 text-[#4e8f71] animate-spin mx-auto mb-4" />
          <p className="text-[#323e48]/60">Loading your morning routine...</p>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#323e48]">Chat with Emma</h2>
            <Button
              onClick={() => {
                setShowChat(false);
                loadRoutineData();
              }}
              variant="outline"
              className="border-[#323e48]/20"
            >
              <X className="w-4 h-4 mr-2" />
              Back to Routine
            </Button>
          </div>
        </div>
        <ConversationalCheckIn 
          userId={userId} 
          sessionType="morning" 
          title="Morning Chat with Emma"
          onNameUpdate={() => {}}
        />
      </div>
    );
  }

  if (showTemplates || !preference) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#323e48] mb-2">Choose Your Morning Routine</h2>
            <p className="text-[#323e48]/70">Pick a routine template that fits your lifestyle</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-white/90 hover:border-[#4e8f71]/50 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{template.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#323e48] mb-1">{template.name}</h3>
                    <p className="text-xs text-[#323e48]/70">{template.description}</p>
                  </div>
                </div>

                {template.id !== "custom" && (
                  <>
                    <div className="flex items-center gap-2 mb-3 text-xs text-[#323e48]/60">
                      <Clock className="w-3 h-3" />
                      {template.duration_minutes} minutes
                    </div>
                    <div className="space-y-1">
                      {template.activities.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-2 text-xs text-[#323e48]/80">
                          <span>{activity.icon}</span>
                          <span>{activity.name}</span>
                        </div>
                      ))}
                      {template.activities.length > 3 && (
                        <div className="text-xs text-[#4e8f71]">+{template.activities.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}

                {template.id === "custom" && (
                  <p className="text-sm text-[#323e48]/70">Build a routine from scratch with Emma's guidance</p>
                )}
              </button>
            ))}
          </div>

          {preference && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setShowTemplates(false)}
                variant="outline"
                className="border-[#323e48]/20"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Sun className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Morning Routine</h2>
              <p className="text-sm text-[#4e8f71]">{preference?.routine_name || "Your daily wellness start"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowChat(true)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Emma
            </Button>
            <Button
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white shadow-lg"
            >
              Change Routine
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-[#323e48]/60">Current Streak</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.current_streak} days</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-[#323e48]/60">Completion Rate</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.completion_rate}%</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-xs text-[#323e48]/60">Days Achieved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.total_completions}/30</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-[#323e48]/60">Longest Streak</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.longest_streak} days</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 border border-[#4e8f71]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#323e48] text-lg">Today's Activities</h3>
            <span className="text-sm text-[#323e48]/60">
              {todayCompleted.length}/{preference.activities.length} completed
            </span>
          </div>

          <div className="space-y-3">
            {preference.activities.map((activity) => {
              const isCompleted = todayCompleted.includes(activity.id);
              return (
                <button
                  key={activity.id}
                  onClick={() => handleToggleActivity(activity.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                      : "bg-white/90 border-[#323e48]/10 hover:border-[#4e8f71]/50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#323e48]/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{activity.icon}</span>
                        <h4 className="font-bold text-[#323e48]">{activity.name}</h4>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-[#323e48]/70">{activity.description}</p>
                      )}
                      {activity.duration_minutes && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-[#323e48]/60">
                          <Clock className="w-3 h-3" />
                          {activity.duration_minutes} min
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {todayCompleted.length === preference.activities.length && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-bold">Amazing Work!</h4>
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-sm">You've completed your morning routine for today! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
