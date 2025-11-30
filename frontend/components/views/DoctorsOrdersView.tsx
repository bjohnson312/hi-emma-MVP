import { useState, useEffect } from "react";
import { Stethoscope, Pill, Activity, Plus, Check, Edit2, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { CarePlan, CarePlanItem, TodayTask } from "~backend/care_plans/types";
import CarePlanSetup from "@/components/CarePlanSetup";
import CarePlanItemEditor from "@/components/CarePlanItemEditor";

interface DoctorsOrdersViewProps {
  userId: string;
}

type TabType = "overview" | "medications" | "activities" | "setup";

export default function DoctorsOrdersView({ userId }: DoctorsOrdersViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [items, setItems] = useState<CarePlanItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [stats, setStats] = useState<{ completion_rate: number; current_streak: number } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<CarePlanItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, tasksRes] = await Promise.all([
        backend.care_plans.getUserPlans({ user_id: userId }),
        backend.care_plans.getTodayTasks({ user_id: userId }).catch(() => ({ tasks: [], total_count: 0, completed_count: 0 }))
      ]);

      const activePlan = plansRes.plans.find(p => p.is_active);
      setPlan(activePlan || null);

      if (activePlan) {
        const [itemsRes, statsRes] = await Promise.all([
          backend.care_plans.getPlanItems({ care_plan_id: activePlan.id }),
          backend.care_plans.getStats({ user_id: userId, days: 30 })
        ]);

        setItems(itemsRes.items);
        setStats(statsRes);
      }

      setTodayTasks(tasksRes.tasks);
    } catch (error) {
      console.error("Failed to load care plan:", error);
      toast({
        title: "Error",
        description: "Failed to load care plan data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (task: TodayTask) => {
    try {
      await backend.care_plans.markItemComplete({
        user_id: userId,
        item_id: task.item.id,
        completed: !task.completed
      });

      setTodayTasks(todayTasks.map(t =>
        t.item.id === task.item.id ? { ...t, completed: !t.completed } : t
      ));

      toast({
        title: "Success",
        description: task.completed ? "Task marked incomplete" : "Task completed!"
      });

      loadData();
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const handleSaveItem = async (newItem: any) => {
    try {
      if (editingItem) {
        await backend.care_plans.updateCarePlanItem({
          item_id: editingItem.id,
          ...newItem
        });
        toast({ title: "Success", description: "Item updated" });
      } else {
        await backend.care_plans.createCarePlanItem(newItem);
        toast({ title: "Success", description: "Item added" });
      }

      setShowItemEditor(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error("Failed to save item:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await backend.care_plans.deleteCarePlanItem({ item_id: itemId });
      toast({ title: "Success", description: "Item deleted" });
      loadData();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medication": return "💊";
      case "activity": return "🏃";
      case "measurement": return "📊";
      default: return "✅";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#4e8f71]">Loading...</div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <CarePlanSetup
        userId={userId}
        onComplete={() => {
          setShowSetup(false);
          loadData();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Doctor's Orders</h2>
              <p className="text-sm text-[#4e8f71]">Medications & Care Plan</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-8 text-center">
            <Stethoscope className="w-16 h-16 text-[#4e8f71] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#323e48] mb-2">No care plan added yet</h3>
            <p className="text-sm text-[#323e48]/70 mb-6">
              Create a personalized plan for medications, activities, and health tracking
            </p>
            <Button
              onClick={() => setShowSetup(true)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
            >
              Create Care Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const medications = items.filter(i => i.type === "medication");
  const activities = items.filter(i => i.type === "activity" || i.type === "measurement" || i.type === "other");

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#323e48]">{plan.name}</h2>
            <p className="text-sm text-[#4e8f71]">{plan.description || "Your personalized care plan"}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            This care plan is general wellness support and not medical advice. Always follow your doctor's instructions and talk to your care team before making changes.
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#4e8f71] text-white"
                : "text-[#323e48]/70 hover:text-[#323e48]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("medications")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "medications"
                ? "bg-[#4e8f71] text-white"
                : "text-[#323e48]/70 hover:text-[#323e48]"
            }`}
          >
            Medications
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "activities"
                ? "bg-[#4e8f71] text-white"
                : "text-[#323e48]/70 hover:text-[#323e48]"
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "setup"
                ? "bg-[#4e8f71] text-white"
                : "text-[#323e48]/70 hover:text-[#323e48]"
            }`}
          >
            Care Plan
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#4e8f71]" />
                    <span className="text-sm text-[#323e48]/70">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-[#323e48]">{stats.completion_rate}%</p>
                </div>
                <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-[#4e8f71]" />
                    <span className="text-sm text-[#323e48]/70">Current Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-[#323e48]">{stats.current_streak} days</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-[#323e48] mb-3">Today's Tasks</h3>
              {todayTasks.length === 0 ? (
                <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
                  <p className="text-[#323e48]/60">No tasks scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((task) => (
                    <div
                      key={task.item.id}
                      className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                        task.completed
                          ? "bg-[#4e8f71]/10 border-2 border-[#4e8f71]/30"
                          : "bg-gradient-to-r from-[#4e8f71]/5 to-[#364d89]/5 border-2 border-gray-200"
                      }`}
                    >
                      <button
                        onClick={() => toggleTaskComplete(task)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          task.completed ? "bg-[#4e8f71] text-white" : "bg-white border-2 border-gray-300"
                        }`}
                      >
                        {task.completed && <Check className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(task.item.type)}</span>
                          <span className="font-medium text-[#323e48]">{task.item.label}</span>
                        </div>
                        {task.scheduled_time && (
                          <p className="text-sm text-[#323e48]/70">at {task.scheduled_time}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "medications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#323e48]">Medications</h3>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowItemEditor(true);
                }}
                size="sm"
                className="bg-[#4e8f71] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </div>
            {medications.length === 0 ? (
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
                <p className="text-[#323e48]/60">No medications added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((med) => {
                  const times = typeof med.times_of_day === 'string' 
                    ? JSON.parse(med.times_of_day) 
                    : (med.times_of_day || []);
                  const details = typeof med.details === 'string'
                    ? JSON.parse(med.details)
                    : (med.details || {});

                  return (
                    <div key={med.id} className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-[#323e48]">{med.label}</p>
                          {details.dosage && (
                            <p className="text-sm text-[#323e48]/70">{details.dosage}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(med);
                              setShowItemEditor(true);
                            }}
                            className="text-[#4e8f71] hover:text-[#364d89]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(med.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-white/90 px-3 py-1 rounded-full text-[#4e8f71]">
                          {med.frequency}
                        </span>
                        {Array.isArray(times) && times.map((time, idx) => (
                          <span key={idx} className="text-xs bg-white/90 px-3 py-1 rounded-full text-[#4e8f71]">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#323e48]">Activities & Measurements</h3>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowItemEditor(true);
                }}
                size="sm"
                className="bg-[#4e8f71] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            {activities.length === 0 ? (
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
                <p className="text-[#323e48]/60">No activities added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const times = typeof activity.times_of_day === 'string' 
                    ? JSON.parse(activity.times_of_day) 
                    : (activity.times_of_day || []);

                  return (
                    <div key={activity.id} className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xl">{getTypeIcon(activity.type)}</span>
                          <p className="font-medium text-[#323e48]">{activity.label}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(activity);
                              setShowItemEditor(true);
                            }}
                            className="text-[#4e8f71] hover:text-[#364d89]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(activity.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-white/90 px-3 py-1 rounded-full text-[#4e8f71]">
                          {activity.frequency}
                        </span>
                        {Array.isArray(times) && times.map((time, idx) => (
                          <span key={idx} className="text-xs bg-white/90 px-3 py-1 rounded-full text-[#4e8f71]">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "setup" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#323e48] mb-2">Plan Details</h3>
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <p className="font-medium text-[#323e48]">{plan.name}</p>
                {plan.description && (
                  <p className="text-sm text-[#323e48]/70 mt-1">{plan.description}</p>
                )}
                {plan.condition_key && (
                  <span className="inline-block mt-2 text-xs bg-white/90 px-3 py-1 rounded-full text-[#4e8f71]">
                    {plan.condition_key}
                  </span>
                )}
              </div>
            </div>

            <div>
              <Button
                onClick={() => setShowSetup(true)}
                variant="outline"
                className="w-full"
              >
                Create New Care Plan
              </Button>
            </div>
          </div>
        )}
      </div>

      {showItemEditor && (
        <CarePlanItemEditor
          item={editingItem || undefined}
          carePlanId={plan.id}
          onSave={handleSaveItem}
          onCancel={() => {
            setShowItemEditor(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
