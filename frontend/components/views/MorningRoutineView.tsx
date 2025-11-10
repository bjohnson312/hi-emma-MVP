import { useState, useEffect } from "react";
import { Sun, Flame, TrendingUp, Calendar, CheckCircle2, Circle, Sparkles, MessageSquare, X, Clock, Target, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import type { RoutineTemplate, MorningRoutinePreference, RoutineStats } from "~backend/morning/routine_types";
import { useToast } from "@/components/ui/use-toast";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface MorningRoutineViewProps {
  userId: string;
}

function MorningRoutineContent({ userId }: MorningRoutineViewProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [preference, setPreference] = useState<MorningRoutinePreference | null>(null);
  const [stats, setStats] = useState<RoutineStats | null>(null);
  const [todayCompleted, setTodayCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!userId) {
          setError("No user ID provided");
          setInitializing(false);
          setLoading(false);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        setInitializing(false);
        await loadRoutineData();
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize");
        setInitializing(false);
        setLoading(false);
      }
    };

    initialize();
  }, [userId]);

  async function loadRoutineData() {
    if (!userId) {
      setError("No user ID available");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading routine data for user:", userId);
      
      const [templatesResult, preferenceResult, statsResult, todayResult] = await Promise.all([
        backend.morning.getRoutineTemplates().catch(err => {
          console.error("Failed to get templates:", err);
          return { templates: [] };
        }),
        backend.morning.getRoutinePreference({ user_id: userId }).catch(err => {
          console.error("Failed to get preference:", err);
          return { preference: null };
        }),
        backend.morning.getRoutineStats({ user_id: userId, days: 30 }).catch(err => {
          console.error("Failed to get stats:", err);
          return null;
        }),
        backend.morning.getTodayCompletion({ user_id: userId }).catch(err => {
          console.error("Failed to get today's completion:", err);
          return { completion: null };
        })
      ]);

      console.log("Data loaded successfully");

      setTemplates(templatesResult?.templates || []);
      setPreference(preferenceResult?.preference || null);
      setStats(statsResult);

      if (todayResult?.completion?.activities_completed) {
        try {
          const activities = typeof todayResult.completion.activities_completed === 'string'
            ? JSON.parse(todayResult.completion.activities_completed)
            : todayResult.completion.activities_completed;
          setTodayCompleted(Array.isArray(activities) ? activities : []);
        } catch (e) {
          console.error("Failed to parse activities:", e);
          setTodayCompleted([]);
        }
      } else {
        setTodayCompleted([]);
      }

      if (!preferenceResult?.preference) {
        setShowTemplates(true);
      }
    } catch (error) {
      console.error("Failed to load routine data:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load morning routine data.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTemplate(template: RoutineTemplate) {
    try {
      console.log("Template selected:", template?.name || "unknown");
      
      if (!template || !template.id) {
        throw new Error("Invalid template selected");
      }
      
      if (template.id === "custom") {
        setShowChat(true);
        setShowTemplates(false);
        return;
      }

      if (!userId) {
        throw new Error("User not authenticated. Please refresh the page.");
      }

      if (!template.activities) {
        throw new Error("Template has no activities");
      }

      console.log("Saving routine for user:", userId);
      
      const newPreference = await backend.morning.createRoutinePreference({
        user_id: userId,
        routine_name: template.name || "My Routine",
        activities: template.activities,
        duration_minutes: template.duration_minutes || 0
      });

      console.log("Routine saved successfully");
      
      setPreference(newPreference);
      setShowTemplates(false);
      
      toast({
        title: "Routine Saved!",
        description: `Your "${template.name}" routine has been set up.`,
      });

      await loadRoutineData();
    } catch (error) {
      console.error("Failed to save routine:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save routine";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }

  async function handleToggleActivity(activityId: string) {
    try {
      if (!preference || !preference.activities) {
        console.error("No preference or activities");
        return;
      }

      const newCompleted = todayCompleted.includes(activityId)
        ? todayCompleted.filter(id => id !== activityId)
        : [...todayCompleted, activityId];

      setTodayCompleted(newCompleted);

      const allCompleted = newCompleted.length === preference.activities.length;

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
      toast({
        title: "Error",
        description: "Failed to save activity",
        variant: "destructive"
      });
    }
  }

  // Render states
  if (initializing) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4e8f71] to-[#364d89] flex items-center justify-center mx-auto mb-4">
            <Sun className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-[#323e48] mb-2">Morning Routine</h3>
          <p className="text-[#323e48]/60">Preparing your wellness journey...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Not Authenticated</p>
          <p className="text-sm text-[#323e48]/60">Please log in to view your morning routine</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-4">Error Loading Morning Routine</p>
          <p className="text-sm text-[#323e48]/60 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setInitializing(true);
              setTimeout(async () => {
                setInitializing(false);
                await loadRoutineData();
              }, 500);
            }}
            className="bg-[#4e8f71] hover:bg-[#3d7259]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
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
    if (!templates || templates.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
            <RefreshCw className="w-8 h-8 text-[#4e8f71] animate-spin mx-auto mb-4" />
            <p className="text-[#323e48]/60">Loading routine templates...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#323e48] mb-2">Choose Your Morning Routine</h2>
            <p className="text-[#323e48]/70">Pick a routine template that fits your lifestyle</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              if (!template || !template.id) return null;
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-white/90 hover:border-[#4e8f71]/50 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl">{template.icon || '⭐'}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#323e48] mb-1">{template.name || 'Unnamed Routine'}</h3>
                      <p className="text-xs text-[#323e48]/70">{template.description || ''}</p>
                    </div>
                  </div>

                  {template.id !== "custom" && template.activities && template.activities.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-3 text-xs text-[#323e48]/60">
                        <Clock className="w-3 h-3" />
                        {template.duration_minutes || 0} minutes
                      </div>
                      <div className="space-y-1">
                        {template.activities.slice(0, 3).map((activity, idx) => (
                          <div key={activity.id || idx} className="flex items-center gap-2 text-xs text-[#323e48]/80">
                            <span>{activity.icon || '•'}</span>
                            <span>{activity.name || 'Activity'}</span>
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
              );
            })}
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

  if (!preference || !preference.activities || preference.activities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <Sun className="w-12 h-12 text-[#4e8f71] mx-auto mb-4" />
          <p className="text-[#323e48] font-semibold mb-4">No routine set up yet</p>
          <Button onClick={() => setShowTemplates(true)} className="bg-[#4e8f71] hover:bg-[#3d7259]">
            Choose a Routine
          </Button>
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
              <p className="text-sm text-[#4e8f71]">{preference.routine_name || "Your daily wellness start"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowChat(true)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white shadow-lg"
            >
              Change
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-[#323e48]/60">Streak</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.current_streak} days</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-[#323e48]/60">Rate</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.completion_rate}%</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-xs text-[#323e48]/60">Days</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.total_completions}/30</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-[#323e48]/60">Best</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.longest_streak} days</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 border border-[#4e8f71]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#323e48] text-lg">Today's Activities</h3>
            <span className="text-sm text-[#323e48]/60">
              {todayCompleted.length}/{preference.activities.length}
            </span>
          </div>

          <div className="space-y-3">
            {preference.activities.map((activity, idx) => {
              const isCompleted = todayCompleted.includes(activity.id);
              return (
                <button
                  key={activity.id || idx}
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
                        <span className="text-xl">{activity.icon || '•'}</span>
                        <h4 className="font-bold text-[#323e48]">{activity.name || 'Activity'}</h4>
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

          {todayCompleted.length === preference.activities.length && preference.activities.length > 0 && (
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

// Error boundary wrapper
export default function MorningRoutineView(props: MorningRoutineViewProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("React error:", event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || "Something went wrong");
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-4">Something Went Wrong</p>
          <p className="text-sm text-[#323e48]/60 mb-6">{errorMessage}</p>
          <Button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="bg-[#4e8f71] hover:bg-[#3d7259]"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  try {
    return <MorningRoutineContent {...props} />;
  } catch (error) {
    console.error("Render error:", error);
    setHasError(true);
    setErrorMessage(error instanceof Error ? error.message : "Render failed");
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-4">Component Error</p>
          <p className="text-sm text-[#323e48]/60 mb-6">The morning routine component failed to load</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#4e8f71] hover:bg-[#3d7259]"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
}
