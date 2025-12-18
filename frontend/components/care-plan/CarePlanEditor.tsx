import { useState, useEffect } from "react";
import { Plus, Save, Trash2, ArrowLeft, Bell, BellOff, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { CarePlanTask, TaskType } from "~backend/care_plans/types";
import { logErrorSilently } from "@/lib/silent-error-handler";

interface CarePlanEditorProps {
  userId: string;
  initialTasks: CarePlanTask[];
  initialPlanName: string;
  onBack: () => void;
  onSaved: () => void;
}

const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
  { value: "medication", label: "Medication", icon: "💊" },
  { value: "activity", label: "Activity", icon: "🏃" },
  { value: "measurement", label: "Measurement", icon: "📊" },
  { value: "habit", label: "Habit", icon: "✨" }
];

export default function CarePlanEditor({
  userId,
  initialTasks,
  initialPlanName,
  onBack,
  onSaved
}: CarePlanEditorProps) {
  const { toast } = useToast();
  const [planName, setPlanName] = useState(initialPlanName);
  const [tasks, setTasks] = useState<CarePlanTask[]>(initialTasks);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tasks.length === 0) {
      addTask();
    }
  }, []);

  function addTask() {
    const newTask: CarePlanTask = {
      label: "",
      type: "medication",
      frequency: "daily",
      time_of_day: "",
      reminder_enabled: false,
      order_index: tasks.length,
      is_active: true
    };
    setTasks([...tasks, newTask]);
  }

  function updateTask(index: number, field: keyof CarePlanTask, value: any) {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  }

  function removeTask(index: number) {
    setTasks(tasks.filter((_, i) => i !== index));
  }

  async function savePlan() {
    if (!planName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your care plan.",
        variant: "default"
      });
      return;
    }

    const validTasks = tasks.filter(t => t.label.trim());
    if (validTasks.length === 0) {
      toast({
        title: "Tasks Required",
        description: "Please add at least one task.",
        variant: "default"
      });
      return;
    }

    setSaving(true);
    try {
      const tasksToSave = validTasks.map((task, index) => ({
        label: task.label,
        type: task.type,
        frequency: task.frequency,
        time_of_day: task.time_of_day || undefined,
        reminder_enabled: task.reminder_enabled,
        order_index: index
      }));

      await backend.care_plans.createPlan({
        user_id: userId,
        name: planName,
        tasks: tasksToSave
      });

      toast({
        title: "Care Plan Saved!",
        description: "Your care plan is now active.",
      });

      onSaved();
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'CarePlanEditor',
        errorType: 'api_failure',
        apiEndpoint: '/care_plans/create',
        severity: 'low',
      });
      toast({
        title: "Unable to save plan",
        description: "Please try again in a moment",
        variant: "default"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h2 className="text-3xl font-bold text-[#323e48] mb-6">Build Your Care Plan</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#323e48] mb-2">
            Plan Name
          </label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="My Care Plan"
            className="bg-white"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#323e48]">Tasks</h3>
          <Button
            onClick={addTask}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border-2 border-[#323e48]/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#323e48] mb-1">
                    Task Name
                  </label>
                  <Input
                    value={task.label}
                    onChange={(e) => updateTask(index, "label", e.target.value)}
                    placeholder="Take morning medication"
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#323e48] mb-1">
                    Type
                  </label>
                  <select
                    value={task.type}
                    onChange={(e) => updateTask(index, "type", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#323e48]/20 rounded-lg text-sm"
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#323e48] mb-1">
                    Frequency
                  </label>
                  <Input
                    value={task.frequency}
                    onChange={(e) => updateTask(index, "frequency", e.target.value)}
                    placeholder="daily, 2x/day, weekly..."
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#323e48] mb-1">
                    Time of Day (optional)
                  </label>
                  <Input
                    value={task.time_of_day || ""}
                    onChange={(e) => updateTask(index, "time_of_day", e.target.value)}
                    placeholder="8:00 AM, morning, evening..."
                    className="bg-white"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateTask(index, "reminder_enabled", !task.reminder_enabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      task.reminder_enabled
                        ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                        : "bg-gray-100 text-gray-600 border-2 border-gray-200"
                    }`}
                  >
                    {task.reminder_enabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">
                      {task.reminder_enabled ? "Reminder On" : "Reminder Off"}
                    </span>
                  </button>

                  <Button
                    onClick={() => removeTask(index)}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-[#323e48]/60">
              <p className="mb-4">No tasks yet. Add your first task to get started!</p>
              <Button
                onClick={addTask}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={savePlan}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Care Plan
              </>
            )}
          </Button>
          <Button onClick={onBack} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
