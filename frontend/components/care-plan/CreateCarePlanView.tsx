import { useState } from "react";
import { Sparkles, FileText, Edit, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { PresetTemplate } from "~backend/care_plans/presets";
import type { CarePlanTask } from "~backend/care_plans/types";

interface CreateCarePlanViewProps {
  userId: string;
  onBack: () => void;
  onPlanCreated: () => void;
  onEditPlan: (tasks: CarePlanTask[], planName: string) => void;
}

export default function CreateCarePlanView({
  userId,
  onBack,
  onPlanCreated,
  onEditPlan
}: CreateCarePlanViewProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"select" | "ai" | "template">("select");
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<PresetTemplate[]>([]);

  async function handleAIGenerate() {
    if (!aiInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe your condition or goal.",
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

      onEditPlan(tasksWithDefaults, `${aiInput} Care Plan`);
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

  async function loadPresets() {
    setLoading(true);
    try {
      const response = await backend.care_plans.getPresets();
      setPresets(response.presets);
      setMode("template");
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

  function handleTemplateSelect(template: PresetTemplate) {
    const tasks = template.tasks.map(task => ({
      ...task,
      is_active: true
    })) as CarePlanTask[];

    onEditPlan(tasks, template.name);
  }

  if (mode === "ai") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => setMode("select")}
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
              <h2 className="text-2xl font-bold text-[#323e48]">AI-Assisted Plan</h2>
              <p className="text-sm text-[#323e48]/60">Let Emma help you create a plan</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                What's your condition or health goal?
              </label>
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="E.g., Managing diabetes, recovering from knee surgery..."
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

  if (mode === "template") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <button
            onClick={() => setMode("select")}
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

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctor's Orders
        </button>

        <h2 className="text-3xl font-bold text-[#323e48] mb-2">Create Your Care Plan</h2>
        <p className="text-[#323e48]/70 mb-8">Choose how you'd like to get started</p>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => setMode("ai")}
            className="text-left p-6 rounded-2xl border-2 border-[#323e48]/10 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-500/50 transition-all hover:shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#323e48] mb-2">AI-Assisted Plan</h3>
            <p className="text-sm text-[#323e48]/70">
              Tell Emma about your condition or goal, and she'll create a personalized plan
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
            onClick={() => onEditPlan([], "My Care Plan")}
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
