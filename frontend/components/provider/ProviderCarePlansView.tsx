import { useState, useEffect } from "react";
import { Heart, Sparkles, FileText, Edit, Plus, Users, ArrowLeft, Loader2, Clock, CheckCircle, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { CarePlanTask, TaskType, CarePlanWithTasks } from "~backend/care_plans/types";
import type { PresetTemplate } from "~backend/care_plans/presets";
import type { PatientListItem } from "~backend/patients/types";
import PatientCarePlansListView from "./PatientCarePlansListView";
import { logErrorSilently } from "@/lib/silent-error-handler";

type ViewMode = "home" | "create-select" | "ai-generate" | "template-select" | "editor" | "assign" | "patient-list" | "edit-patient-plan";

interface TemplatePlan {
  name: string;
  description?: string;
  tasks: CarePlanTask[];
}

const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
  { value: "medication", label: "Medication", icon: "💊" },
  { value: "activity", label: "Activity", icon: "🏃" },
  { value: "measurement", label: "Measurement", icon: "📊" },
  { value: "habit", label: "Habit", icon: "✨" }
];

export default function ProviderCarePlansView() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewMode>("home");
  const [currentPlan, setCurrentPlan] = useState<TemplatePlan | null>(null);
  const [tasks, setTasks] = useState<CarePlanTask[]>([]);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [presets, setPresets] = useState<PresetTemplate[]>([]);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);



  async function loadPatients() {
    setLoading(true);
    try {
      const token = localStorage.getItem("provider_token") || "";
      const response = await backend.patients.listPatients({ token });
      setPatients(response.patients);
      setPatientsLoaded(true);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'ProviderCarePlansView',
        errorType: 'api_failure',
        severity: 'low',
      });
      toast({
        title: "Unable to load patients",
        description: "Please try again in a moment",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPresets() {
    setLoading(true);
    try {
      const response = await backend.care_plans.getPresets();
      setPresets(response.presets);
      setView("template-select");
    } catch (error) {
      console.error("Failed to load presets:", error);
      toast({
        title: "Error",
        description: "Failed to load templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAIGenerate() {
    if (!aiInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the condition or goal.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await backend.care_plans.generateAIPlan({ condition: aiInput });
      
      const tasksWithDefaults = response.tasks.map((task: any, index: number) => ({
        ...task,
        reminder_enabled: false,
        order_index: index,
        is_active: true
      })) as CarePlanTask[];

      setPlanName(`${aiInput} Care Plan`);
      setTasks(tasksWithDefaults);
      setView("editor");
    } catch (error) {
      console.error("AI generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate care plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateSelect(template: PresetTemplate) {
    const templateTasks = template.tasks.map(task => ({
      ...task,
      is_active: true
    })) as CarePlanTask[];

    setPlanName(template.name);
    setPlanDescription(template.description || "");
    setTasks(templateTasks);
    setView("editor");
  }

  function handleStartFromScratch() {
    setPlanName("My Care Plan");
    setPlanDescription("");
    setTasks([{
      label: "",
      type: "medication",
      frequency: "daily",
      time_of_day: "",
      reminder_enabled: false,
      order_index: 0,
      is_active: true
    }]);
    setView("editor");
  }

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

  function handleProceedToAssign() {
    if (!planName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the care plan.",
        variant: "destructive"
      });
      return;
    }

    const validTasks = tasks.filter(t => t.label.trim());
    if (validTasks.length === 0) {
      toast({
        title: "Tasks Required",
        description: "Please add at least one task.",
        variant: "destructive"
      });
      return;
    }

    setTasks(validTasks);
    setView("assign");
  }

  function togglePatientSelection(patientId: string) {
    if (selectedPatientIds.includes(patientId)) {
      setSelectedPatientIds(selectedPatientIds.filter(id => id !== patientId));
    } else {
      setSelectedPatientIds([...selectedPatientIds, patientId]);
    }
  }

  async function handleAssignToPatients() {
    if (selectedPatientIds.length === 0) {
      toast({
        title: "No Patients Selected",
        description: "Please select at least one patient.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const tasksToSave = tasks.map((task, index) => ({
        label: task.label,
        type: task.type,
        frequency: task.frequency,
        time_of_day: task.time_of_day || undefined,
        reminder_enabled: task.reminder_enabled,
        order_index: index
      }));

      let successCount = 0;
      let errorCount = 0;

      for (const patientId of selectedPatientIds) {
        try {
          const patient = patients.find(p => p.id === patientId);
          
          await backend.care_plans.createPlan({
            patient_id: patientId,
            user_id: patient?.user_id || undefined,
            name: planName,
            description: planDescription || undefined,
            tasks: tasksToSave
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to create plan for patient ${patientId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Care Plans Assigned!",
          description: `Successfully assigned to ${successCount} patient${successCount > 1 ? 's' : ''}.${errorCount > 0 ? ` Failed for ${errorCount} patient${errorCount > 1 ? 's' : ''}.` : ''}`,
        });
      }

      if (errorCount === 0) {
        setPlanName("");
        setPlanDescription("");
        setTasks([]);
        setSelectedPatientIds([]);
        setView("home");
      }
    } catch (error) {
      console.error("Failed to assign care plans:", error);
      toast({
        title: "Error",
        description: "Failed to assign care plans.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPlanName("");
    setPlanDescription("");
    setTasks([]);
    setAiInput("");
    setSelectedPatientIds([]);
    setPatientsLoaded(false);
    setPatients([]);
    setEditingPatientId(null);
    setEditingPlanId(null);
    setView("home");
  }

  function handleEditPatientPlan(patientId: string, plan: CarePlanWithTasks) {
    setEditingPatientId(patientId);
    setEditingPlanId(plan.id || null);
    setPlanName(plan.name);
    setPlanDescription(plan.description || "");
    setTasks(plan.tasks);
    setView("edit-patient-plan");
  }

  async function handleSavePatientPlan() {
    if (!editingPlanId || !editingPatientId) return;

    setLoading(true);
    try {
      const tasksToUpdate = tasks.map((task, index) => ({
        label: task.label,
        type: task.type,
        frequency: task.frequency,
        time_of_day: task.time_of_day || undefined,
        reminder_enabled: task.reminder_enabled,
        order_index: index
      }));

      for (const task of tasks) {
        if (task.id) {
          await backend.care_plans.updateTask({
            task_id: task.id,
            updates: {
              label: task.label,
              type: task.type,
              frequency: task.frequency,
              time_of_day: task.time_of_day || undefined,
              reminder_enabled: task.reminder_enabled
            }
          });
        }
      }

      toast({
        title: "Care Plan Updated",
        description: "The patient's care plan has been successfully updated."
      });

      handleReset();
    } catch (error) {
      console.error("Failed to update care plan:", error);
      toast({
        title: "Error",
        description: "Failed to update care plan.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if (view === "patient-list") {
    return (
      <PatientCarePlansListView
        onBack={() => setView("home")}
        onEditPlan={handleEditPatientPlan}
      />
    );
  }

  if (view === "home") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#323e48]">Care Plan Management</h1>
              <p className="text-[#323e48]/70">Create and assign care plans to patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <h2 className="text-2xl font-bold text-[#323e48] mb-6">Manage Care Plans</h2>

          <button
            onClick={() => setView("patient-list")}
            className="w-full text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-gradient-to-br from-rose-50 to-pink-50 hover:border-rose-500/50 transition-all hover:shadow-xl mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <List className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#323e48] mb-1">View Patients with Care Plans</h3>
                <p className="text-sm text-[#323e48]/70">
                  See all patients assigned to care plans, edit their plans, and send SMS messages
                </p>
              </div>
            </div>
          </button>

          <h2 className="text-2xl font-bold text-[#323e48] mb-2">Create a New Care Plan</h2>
          <p className="text-[#323e48]/70 mb-6">Choose how you'd like to get started</p>

          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => setView("ai-generate")}
              className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-500/50 transition-all hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#323e48] mb-2">AI-Assisted Plan</h3>
              <p className="text-sm text-[#323e48]/70">
                Describe a condition or goal, and Emma will create a personalized plan
              </p>
            </button>

            <button
              onClick={loadPresets}
              disabled={loading}
              className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-blue-500/50 transition-all hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#323e48] mb-2">Use a Template</h3>
              <p className="text-sm text-[#323e48]/70">
                Start with a pre-made plan for common conditions
              </p>
            </button>

            <button
              onClick={handleStartFromScratch}
              className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-500/50 transition-all hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                <Edit className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#323e48] mb-2">Start From Scratch</h3>
              <p className="text-sm text-[#323e48]/70">
                Build a completely custom care plan yourself
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "ai-generate") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">AI-Assisted Care Plan</h2>
              <p className="text-sm text-[#323e48]/60">Let Emma help you create a plan</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                What condition or health goal should this plan address?
              </label>
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="E.g., Managing diabetes, recovering from knee surgery, heart health..."
                className="bg-white"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleAIGenerate}
              disabled={loading || !aiInput.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Care Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "template-select") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Choose a Template</h2>
              <p className="text-sm text-[#323e48]/60">Select a preset care plan</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {presets.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-white/90 hover:border-blue-500/50 transition-all hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                  <span className="text-2xl">{template.icon}</span>
                </div>
                <h3 className="font-bold text-[#323e48] mb-1">{template.name}</h3>
                <p className="text-sm text-[#323e48]/70 mb-3">{template.description}</p>
                <p className="text-xs text-[#323e48]/60">{template.tasks.length} tasks</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === "edit-patient-plan") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => {
              setView("patient-list");
              setEditingPatientId(null);
              setEditingPlanId(null);
            }}
            className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patient List
          </button>

          <h2 className="text-3xl font-bold text-[#323e48] mb-6">Edit Patient Care Plan</h2>

          <div className="space-y-4 mb-6">
            <div>
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

            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                Description (Optional)
              </label>
              <Input
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Brief description of this care plan..."
                className="bg-white"
              />
            </div>
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
                      Remove
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
              onClick={handleSavePatientPlan}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button 
              onClick={() => {
                setView("patient-list");
                setEditingPatientId(null);
                setEditingPlanId(null);
              }} 
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "editor") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h2 className="text-3xl font-bold text-[#323e48] mb-6">Build Your Care Plan</h2>

          <div className="space-y-4 mb-6">
            <div>
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

            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                Description (Optional)
              </label>
              <Input
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Brief description of this care plan..."
                className="bg-white"
              />
            </div>
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
                      Remove
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
              onClick={handleProceedToAssign}
              className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Continue to Assign Patients
            </Button>
            <Button onClick={handleReset} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "assign") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => setView("editor")}
            className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Assign to Patients</h2>
              <p className="text-sm text-[#323e48]/60">
                Care Plan: <span className="font-semibold">{planName}</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Each selected patient will receive a copy of this care plan. They can complete tasks independently.
            </p>
          </div>

          {!patientsLoaded ? (
            <div className="space-y-4">
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-[#323e48]/30" />
                <h3 className="text-lg font-bold text-[#323e48] mb-2">Ready to Assign</h3>
                <p className="text-[#323e48]/60 mb-6">
                  Load your patient list to select who should receive this care plan
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={loadPatients}
                    disabled={loading}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Load Patients
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[#323e48] mb-3">
                  Select Patients ({selectedPatientIds.length} selected)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => togglePatientSelection(patient.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedPatientIds.includes(patient.id)
                          ? "bg-pink-50 border-pink-300"
                          : "bg-white border-[#323e48]/10 hover:border-[#323e48]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedPatientIds.includes(patient.id)
                            ? "bg-pink-500 border-pink-500"
                            : "border-[#323e48]/30"
                        }`}>
                          {selectedPatientIds.includes(patient.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#323e48]">{patient.full_name}</p>
                          <p className="text-xs text-[#323e48]/60">{patient.email || patient.phone || 'No contact info'}</p>
                          {patient.medical_record_number && (
                            <p className="text-xs text-[#323e48]/50">MRN: {patient.medical_record_number}</p>
                          )}
                          {patient.has_app_access && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                              <CheckCircle className="w-3 h-3" />
                              App User
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}

                  {patients.length === 0 && (
                    <div className="text-center py-8 text-[#323e48]/60">
                      <p>No patients available. Add patients first to assign care plans.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAssignToPatients}
                  disabled={loading || selectedPatientIds.length === 0}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Assign to {selectedPatientIds.length} Patient{selectedPatientIds.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
