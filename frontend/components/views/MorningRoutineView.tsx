import { useState, useEffect } from "react";
import { Sun, MessageCircle, Plus, Edit2, Trash2, CheckCircle2, Clock, Sparkles, Save, X, TrendingUp, Rocket, Target, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { RoutineTemplate, MorningRoutinePreference, MorningRoutineActivity } from "~backend/morning/routine_types";
import type { GetJourneySetupResponse } from "~backend/journey/types";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface MorningRoutineViewProps {
  userId: string;
}

function parseActivities(activities: any): MorningRoutineActivity[] {
  if (Array.isArray(activities)) {
    return activities;
  }
  if (typeof activities === 'string') {
    try {
      const parsed = JSON.parse(activities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function MorningRoutineView({ userId }: MorningRoutineViewProps) {
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [routine, setRoutine] = useState<MorningRoutinePreference | null>(null);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedActivities, setEditedActivities] = useState<MorningRoutineActivity[]>([]);
  const [routineName, setRoutineName] = useState("");
  const [morningSetup, setMorningSetup] = useState<{ completion_percentage: number; steps: Array<{ id: string; name: string; description: string; completed: boolean; route?: string }>; all_complete: boolean } | null>(null);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [stats, setStats] = useState<{ total_completions: number; current_streak: number; completion_rate: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    try {
      const [templatesRes, preferenceRes, todayRes, morningSetupRes, statsRes] = await Promise.all([
        backend.morning.getRoutineTemplates().catch(() => ({ templates: [] })),
        backend.morning.getRoutinePreference({ user_id: userId }).catch(() => ({ preference: null })),
        backend.morning.getTodayCompletion({ user_id: userId }).catch(() => ({ completion: null })),
        backend.morning.getMorningSetupProgress({ user_id: userId }).catch(() => null),
        backend.morning.getRoutineStats({ user_id: userId }).catch(() => ({ total_completions: 0, current_streak: 0, completion_rate: 0 }))
      ]);

      setTemplates(templatesRes.templates || []);
      setStats(statsRes);
      
      if (preferenceRes.preference) {
        const parsed = {
          ...preferenceRes.preference,
          activities: parseActivities(preferenceRes.preference.activities)
        };
        setRoutine(parsed);
      } else {
        setRoutine(null);
      }

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

      if (morningSetupRes && !morningSetupRes.all_complete) {
        setMorningSetup(morningSetupRes);
        setShowSetupBanner(true);
      }
    } catch (error) {
      console.error("Failed to load:", error);
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

      const parsed = {
        ...saved,
        activities: parseActivities(saved.activities)
      };
      setRoutine(parsed);
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
    if (!routine || !Array.isArray(routine.activities)) return;

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

  function startEdit() {
    if (!routine) return;
    setEditMode(true);
    const activities = Array.isArray(routine.activities) ? routine.activities : [];
    setEditedActivities([...activities]);
    setRoutineName(routine.routine_name || "");
  }

  function cancelEdit() {
    setEditMode(false);
    setEditedActivities([]);
    setRoutineName("");
  }

  function addActivity() {
    const newActivity: MorningRoutineActivity = {
      id: `activity_${Date.now()}`,
      name: "",
      description: "",
      duration_minutes: 5,
      icon: "⭐"
    };
    setEditedActivities([...editedActivities, newActivity]);
  }

  function updateActivity(index: number, field: keyof MorningRoutineActivity, value: string | number) {
    const updated = [...editedActivities];
    updated[index] = { ...updated[index], [field]: value };
    setEditedActivities(updated);
  }

  function removeActivity(index: number) {
    setEditedActivities(editedActivities.filter((_, i) => i !== index));
  }

  async function saveEdit() {
    if (!routine || editedActivities.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one activity.",
        variant: "destructive"
      });
      return;
    }

    try {
      const totalDuration = editedActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

      const saved = await backend.morning.createRoutinePreference({
        user_id: userId,
        routine_name: routineName || "My Routine",
        activities: editedActivities,
        duration_minutes: totalDuration
      });

      const parsed = {
        ...saved,
        activities: parseActivities(saved.activities)
      };
      setRoutine(parsed);
      setEditMode(false);
      toast({
        title: "Routine Updated!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Failed to save:", error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive"
      });
    }
  }

  if (showChat) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#323e48]">Morning Chat</h2>
            <Button onClick={() => setShowChat(false)} variant="outline">Back</Button>
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

  return (
    <div className="space-y-6">
      {showSetupBanner && journeySetup && journeySetup.completion_percentage < 100 && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl p-6 shadow-xl border border-white/40 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Start Your Wellness Journey</h3>
                  <p className="text-sm text-white/90">
                    Complete your profile to unlock Emma's full potential
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Setup Progress</span>
                  <span className="text-sm font-bold">{journeySetup.completion_percentage}% Complete</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${journeySetup.completion_percentage}%` }}
                  />
                </div>
              </div>

              {journeySetup.incomplete_steps.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Still to complete:</p>
                  <div className="flex flex-wrap gap-2">
                    {journeySetup.incomplete_steps.slice(0, 5).map((step, index) => (
                      <span key={index} className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                        {step}
                      </span>
                    ))}
                    {journeySetup.incomplete_steps.length > 5 && (
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                        +{journeySetup.incomplete_steps.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowTemplates(true)}
                  className="bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Continue Setup
                </Button>
                <Button
                  onClick={() => setShowSetupBanner(false)}
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  Remind Me Later
                </Button>
              </div>
            </div>

            <button
              onClick={() => setShowSetupBanner(false)}
              className="text-white/60 hover:text-white transition-colors ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Sun className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Morning Routine</h2>
              <p className="text-sm text-[#4e8f71]">Start your day with Emma</p>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#4e8f71]" />
                <span className="text-xs text-[#323e48]/60">Completed</span>
              </div>
              <p className="text-2xl font-bold text-[#4e8f71]">{stats.total_completions}</p>
            </div>

            <div className="bg-white/90 border border-[#364d89]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#364d89]" />
                <span className="text-xs text-[#323e48]/60">Streak</span>
              </div>
              <p className="text-2xl font-bold text-[#364d89]">{stats.current_streak} days</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-[#323e48]/60">Rate</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.completion_rate}%</p>
            </div>
          </div>
        )}

        {showTemplates ? (
          <>
            <h3 className="text-xl font-bold text-[#323e48] mb-4">Choose Your Morning Routine</h3>
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
                <Button onClick={() => setShowTemplates(false)} variant="outline">Cancel</Button>
              </div>
            )}
          </>
        ) : editMode ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#323e48]">Edit Morning Routine</h3>
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="bg-[#4e8f71] hover:bg-[#3d7259]">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={cancelEdit} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#323e48] mb-2">Routine Name</label>
              <Input
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="My Morning Routine"
                className="bg-white"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#323e48]">Activities</h3>
                <Button onClick={addActivity} size="sm" className="bg-[#4e8f71] hover:bg-[#3d7259]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </div>

              {editedActivities.map((activity, index) => (
                <div key={activity.id} className="bg-white/90 rounded-xl p-4 border-2 border-[#323e48]/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#323e48] mb-1">Activity Name</label>
                      <Input
                        value={activity.name}
                        onChange={(e) => updateActivity(index, 'name', e.target.value)}
                        placeholder="Wake-up stretch"
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#323e48] mb-1">Icon (emoji)</label>
                      <Input
                        value={activity.icon}
                        onChange={(e) => updateActivity(index, 'icon', e.target.value)}
                        placeholder="🧘"
                        className="bg-white"
                        maxLength={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#323e48] mb-1">Description (optional)</label>
                      <Input
                        value={activity.description || ""}
                        onChange={(e) => updateActivity(index, 'description', e.target.value)}
                        placeholder="Gentle full-body stretches"
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#323e48] mb-1">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={activity.duration_minutes || 0}
                        onChange={(e) => updateActivity(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                        placeholder="5"
                        className="bg-white"
                        min={1}
                        max={120}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={() => removeActivity(index)}
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {editedActivities.length === 0 && (
                <div className="text-center py-12 text-[#323e48]/60">
                  <p className="mb-4">No activities yet. Add your first activity to get started!</p>
                  <Button onClick={addActivity} className="bg-[#4e8f71] hover:bg-[#3d7259]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Activity
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {routine && routine.activities && Array.isArray(routine.activities) && routine.activities.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#323e48] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#4e8f71]" />
                    Today's Routine
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={startEdit}
                      className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Routine
                    </Button>
                    <Button
                      onClick={() => setShowTemplates(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    >
                      Change Template
                    </Button>
                    <Button
                      onClick={() => setShowChat(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with Emma
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 mb-6">
                <h3 className="font-semibold text-[#323e48]">Set Up Your Routine</h3>
                <p className="text-sm text-[#323e48]/70">
                  Choose from our pre-made routines or create your own custom routine.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => setShowTemplates(true)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                  >
                    Choose Template
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(true);
                      setEditedActivities([]);
                      setRoutineName("My Morning Routine");
                    }}
                    className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {routine && routine.activities && Array.isArray(routine.activities) && routine.activities.length > 0 && !editMode && !showTemplates && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-2xl font-bold text-[#323e48] mb-1">{routine.routine_name}</h3>
                <p className="text-[#323e48]/70">{routine.duration_minutes} minutes total</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#4e8f71] mb-1">
                  {routine.activities.length > 0 ? Math.round((completedToday.length / routine.activities.length) * 100) : 0}%
                </div>
                <div className="text-xs text-[#323e48]/60">Progress</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-[#323e48]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] transition-all duration-500 rounded-full"
                    style={{ width: `${routine.activities.length > 0 ? (completedToday.length / routine.activities.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#323e48] min-w-[60px]">
                  {completedToday.length}/{routine.activities.length}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {routine.activities.map((activity) => {
              const isCompleted = completedToday.includes(activity.id);
              return (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 group ${
                    isCompleted
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-[#f8f9fa] hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-[#323e48]/30 group-hover:border-[#4e8f71]"
                  }`}>
                    {isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  
                  <span className="text-lg mr-2">{activity.icon}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-[#323e48] ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {activity.name}
                      </span>
                      {activity.duration_minutes && (
                        <span className="text-xs text-[#323e48]/50">
                          {activity.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {Array.isArray(routine.activities) && completedToday.length === routine.activities.length && routine.activities.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
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
    </div>
  );
}
