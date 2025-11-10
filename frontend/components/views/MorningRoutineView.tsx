import { useState, useEffect } from "react";
import { Sun, MessageCircle, CheckCircle2, Circle, Clock, Sparkles, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { RoutineTemplate, MorningRoutinePreference } from "~backend/morning/routine_types";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface MorningRoutineViewProps {
  userId: string;
}

export default function MorningRoutineView({ userId }: MorningRoutineViewProps) {
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [routine, setRoutine] = useState<MorningRoutinePreference | null>(null);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutineData();
  }, [userId]);

  async function loadRoutineData() {
    try {
      const [templatesRes, preferenceRes, todayRes] = await Promise.all([
        backend.morning.getRoutineTemplates().catch(() => ({ templates: [] })),
        backend.morning.getRoutinePreference({ user_id: userId }).catch(() => ({ preference: null })),
        backend.morning.getTodayCompletion({ user_id: userId }).catch(() => ({ completion: null }))
      ]);

      setTemplates(templatesRes.templates || []);
      setRoutine(preferenceRes.preference || null);

      if (todayRes.completion?.activities_completed) {
        try {
          const activities = typeof todayRes.completion.activities_completed === 'string'
            ? JSON.parse(todayRes.completion.activities_completed)
            : todayRes.completion.activities_completed;
          setCompletedToday(Array.isArray(activities) ? activities : []);
        } catch {
          setCompletedToday([]);
        }
      }
    } catch (error) {
      console.error("Failed to load routine:", error);
    } finally {
      setLoading(false);
    }
  }

  async function selectTemplate(template: RoutineTemplate) {
    if (template.id === "custom") {
      setShowChat(true);
      setShowTemplates(false);
      return;
    }

    try {
      const saved = await backend.morning.createRoutinePreference({
        user_id: userId,
        routine_name: template.name,
        activities: template.activities,
        duration_minutes: template.duration_minutes
      });

      setRoutine(saved);
      setShowTemplates(false);
      toast({
        title: "Routine Saved!",
        description: `Your "${template.name}" routine is ready.`,
      });
    } catch (error) {
      console.error("Failed to save:", error);
      toast({
        title: "Error",
        description: "Failed to save routine.",
        variant: "destructive"
      });
    }
  }

  async function toggleActivity(activityId: string) {
    if (!routine) return;

    const newCompleted = completedToday.includes(activityId)
      ? completedToday.filter(id => id !== activityId)
      : [...completedToday, activityId];

    setCompletedToday(newCompleted);

    try {
      await backend.morning.logRoutineCompletion({
        user_id: userId,
        activities_completed: newCompleted,
        all_completed: newCompleted.length === routine.activities.length
      });

      if (newCompleted.length === routine.activities.length) {
        toast({
          title: "🎉 Complete!",
          description: "Great job finishing your morning routine!",
        });
      }
    } catch (error) {
      console.error("Failed to log:", error);
    }
  }

  if (showChat) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#323e48]">Morning Chat with Emma</h2>
            <Button onClick={() => setShowChat(false)} variant="outline">
              Back
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

  if (showTemplates) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <h2 className="text-2xl font-bold text-[#323e48] mb-2">Choose Your Morning Routine</h2>
          <p className="text-[#323e48]/70 mb-6">Pick a routine template that fits your lifestyle</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-white/90 hover:border-[#4e8f71]/50 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                    <span className="text-2xl">{template.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#323e48] mb-1">{template.name}</h3>
                    <p className="text-xs text-[#323e48]/70">{template.description}</p>
                  </div>
                </div>

                {template.id !== "custom" && template.activities && template.activities.length > 0 && (
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
                  <p className="text-sm text-[#323e48]/70">Build with Emma's help</p>
                )}
              </button>
            ))}
          </div>

          {routine && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setShowTemplates(false)} variant="outline">
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Sun className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#323e48]">Morning Routine</h2>
            <p className="text-sm text-[#4e8f71]">Start your day with Emma</p>
          </div>
          <Button
            onClick={() => setShowChat(true)}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Emma
          </Button>
        </div>

        {routine && routine.activities && routine.activities.length > 0 && (
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 border border-[#4e8f71]/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#323e48] text-lg">{routine.routine_name}</h3>
                <p className="text-sm text-[#323e48]/60">
                  {completedToday.length}/{routine.activities.length} completed today
                </p>
              </div>
              <Button
                onClick={() => setShowTemplates(true)}
                variant="outline"
                size="sm"
                className="border-[#323e48]/20"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Change
              </Button>
            </div>

            <div className="space-y-3">
              {routine.activities.map((activity) => {
                const isCompleted = completedToday.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    onClick={() => toggleActivity(activity.id)}
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

            {completedToday.length === routine.activities.length && routine.activities.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="font-bold">Amazing Work!</h4>
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-sm">You've completed your morning routine! 🎉</p>
              </div>
            )}
          </div>
        )}

        {(!routine || !routine.activities || routine.activities.length === 0) && (
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 border border-[#4e8f71]/20 mb-6">
            <h3 className="font-semibold text-[#323e48] mb-4">Set Up Your Routine</h3>
            <p className="text-sm text-[#323e48]/70 mb-4">
              Choose from our pre-made routines or chat with Emma to create a personalized morning routine.
            </p>
            <Button
              onClick={() => setShowTemplates(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl"
            >
              Choose a Routine Template
            </Button>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
          <h3 className="font-semibold text-[#323e48] mb-4">Daily Morning Check-In</h3>
          <p className="text-sm text-[#323e48]/70 mb-4">
            Start your day with a conversation with Emma. She'll ask about your sleep quality, 
            guide you through morning activities, and help set your intentions for the day.
          </p>
          <Button
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-xl"
          >
            Start Morning Check-In
          </Button>
        </div>
      </div>
    </div>
  );
}
