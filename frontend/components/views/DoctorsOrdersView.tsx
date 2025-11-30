import { useState, useEffect } from "react";
import { Heart, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import CarePlanDashboardTile from "../care-plan/CarePlanDashboardTile";
import CreateCarePlanView from "../care-plan/CreateCarePlanView";
import CarePlanEditor from "../care-plan/CarePlanEditor";
import TodayCareTasks from "../care-plan/TodayCareTasks";
import StayActiveTab from "../care-plan/StayActiveTab";
import type { CarePlanWithTasks, CarePlanTask } from "~backend/care_plans/types";

interface DoctorsOrdersViewProps {
  userId: string;
}

type ViewMode = "dashboard" | "create" | "edit" | "tasks" | "active";

export default function DoctorsOrdersView({ userId }: DoctorsOrdersViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [carePlan, setCarePlan] = useState<CarePlanWithTasks | null>(null);
  const [editTasks, setEditTasks] = useState<CarePlanTask[]>([]);
  const [editPlanName, setEditPlanName] = useState("");
  const [activeTab, setActiveTab] = useState<"care-plan" | "stay-active">("care-plan");

  useEffect(() => {
    loadCarePlan();
  }, [userId]);

  async function loadCarePlan() {
    setLoading(true);
    try {
      const response = await backend.care_plans.getUserPlan({ user_id: userId });
      setCarePlan(response.plan);
    } catch (error) {
      console.error("Failed to load care plan:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreatePlan() {
    setViewMode("create");
  }

  function handleViewPlan() {
    setViewMode("tasks");
  }

  function handleEditPlan(tasks: CarePlanTask[], planName: string) {
    setEditTasks(tasks);
    setEditPlanName(planName);
    setViewMode("edit");
  }

  async function handlePlanSaved() {
    await loadCarePlan();
    setViewMode("dashboard");
    toast({
      title: "Success!",
      description: "Your care plan has been saved.",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#323e48]/10 rounded w-1/3"></div>
            <div className="h-32 bg-[#323e48]/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "create") {
    return (
      <CreateCarePlanView
        userId={userId}
        onBack={() => setViewMode("dashboard")}
        onPlanCreated={handlePlanSaved}
        onEditPlan={handleEditPlan}
      />
    );
  }

  if (viewMode === "edit") {
    return (
      <CarePlanEditor
        userId={userId}
        initialTasks={editTasks}
        initialPlanName={editPlanName}
        onBack={() => setViewMode("dashboard")}
        onSaved={handlePlanSaved}
      />
    );
  }

  if (viewMode === "tasks" && carePlan) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#323e48]">{carePlan.name}</h2>
                <p className="text-sm text-[#323e48]/60">{carePlan.tasks.length} tasks</p>
              </div>
            </div>
            <button
              onClick={() => setViewMode("dashboard")}
              className="text-sm text-[#323e48]/60 hover:text-[#323e48]"
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="space-y-3">
            {carePlan.tasks.map((task, index) => (
              <div
                key={task.id || index}
                className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-[#323e48]/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {task.type === "medication" && "💊"}
                    {task.type === "activity" && "🏃"}
                    {task.type === "measurement" && "📊"}
                    {task.type === "habit" && "✨"}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#323e48]">{task.label}</h4>
                    <div className="flex items-center gap-3 text-sm text-[#323e48]/60">
                      <span>{task.frequency}</span>
                      {task.time_of_day && <span>• {task.time_of_day}</span>}
                    </div>
                  </div>
                  {task.reminder_enabled && (
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Reminder On
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleEditPlan(carePlan.tasks, carePlan.name)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg"
            >
              Edit Care Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasPlan = carePlan !== null;
  const upcomingTasks = carePlan?.tasks
    .filter(t => t.time_of_day)
    .slice(0, 2)
    .map(t => ({ label: t.label, time_of_day: t.time_of_day })) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Doctor's Orders</h2>
            <p className="text-sm text-[#323e48]/60">Manage your care plan and stay active</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("care-plan")}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === "care-plan"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-[#323e48]/5 text-[#323e48]/70 hover:bg-[#323e48]/10"
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Care Plan
          </button>
          <button
            onClick={() => setActiveTab("stay-active")}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === "stay-active"
                ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                : "bg-[#323e48]/5 text-[#323e48]/70 hover:bg-[#323e48]/10"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Stay Active
          </button>
        </div>
      </div>

      {activeTab === "care-plan" && (
        <>
          <CarePlanDashboardTile
            hasPlan={hasPlan}
            completedCount={0}
            totalCount={carePlan?.tasks.length || 0}
            upcomingTasks={upcomingTasks}
            onCreatePlan={handleCreatePlan}
            onViewPlan={handleViewPlan}
          />

          {hasPlan && <TodayCareTasks userId={userId} />}
        </>
      )}

      {activeTab === "stay-active" && <StayActiveTab />}
    </div>
  );
}
