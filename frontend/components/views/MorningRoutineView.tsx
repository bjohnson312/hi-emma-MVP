import { useState, useEffect } from "react";
import { Sun, MessageCircle, Plus, Edit2, Trash2, CheckCircle2, Circle, Clock, Sparkles, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { RoutineTemplate, MorningRoutinePreference, MorningRoutineActivity } from "~backend/morning/routine_types";
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
  const [editMode, setEditMode] = useState(false);
  const [editedActivities, setEditedActivities] = useState<MorningRoutineActivity[]>([]);
  const [routineName, setRoutineName] = useState("");

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
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

  function startEdit() {
    if (!routine) return;
    setEditMode(true);
    setEditedActivities([...routine.activities]);
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

      setRoutine(saved);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <p className="text-[#323e48]/60">Loading...</p>
        </div>
      </div>
    );
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
              <Button onClick={() => setShowTemplates(false)} variant="outline">Cancel</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#323e48]">Edit Morning Routine</h2>
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
            Chat
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
              <div className="flex gap-2">
                <Button
                  onClick={startEdit}
                  variant="outline"
                  size="sm"
                  className="border-[#323e48]/20"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => setShowTemplates(true)}
                  variant="outline"
                  size="sm"
                  className="border-[#323e48]/20"
                >
                  Change
                </Button>
              </div>
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
              Choose from our pre-made routines or create your own custom routine.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowTemplates(true)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl"
              >
                Choose Template
              </Button>
              <Button
                onClick={() => {
                  setEditMode(true);
                  setEditedActivities([]);
                  setRoutineName("My Morning Routine");
                }}
                className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom
              </Button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
          <h3 className="font-semibold text-[#323e48] mb-3">Daily Check-In</h3>
          <p className="text-sm text-[#323e48]/70 mb-4">
            Chat with Emma about your sleep, set your intentions, and start your day right.
          </p>
          <Button
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-xl"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Morning Check-In
          </Button>
        </div>
      </div>
    </div>
  );
}
