import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Edit2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { CarePlanPreset, CreateCarePlanItemRequest } from "~backend/care_plans/types";

interface CarePlanSetupProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface PresetItem extends Omit<CreateCarePlanItemRequest, 'care_plan_id'> {
  enabled: boolean;
  tempId: string;
}

export default function CarePlanSetup({ userId, onComplete, onCancel }: CarePlanSetupProps) {
  const [step, setStep] = useState<"select" | "customize" | "review">("select");
  const [presets, setPresets] = useState<CarePlanPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<CarePlanPreset | null>(null);
  const [items, setItems] = useState<PresetItem[]>([]);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await backend.care_plans.getPresets();
      setPresets(response.presets);
    } catch (error) {
      console.error("Failed to load presets:", error);
      toast({
        title: "Error",
        description: "Failed to load care plan templates",
        variant: "destructive"
      });
    }
  };

  const selectPreset = async (preset: CarePlanPreset) => {
    setSelectedPreset(preset);
    setPlanName(preset.name);
    setPlanDescription(preset.description);

    if (preset.key === "custom") {
      setItems([]);
      setStep("customize");
      return;
    }

    try {
      setLoading(true);
      const response = await backend.care_plans.generateAIPlan({
        user_id: userId,
        condition: preset.key
      });

      const presetItems: PresetItem[] = response.items.map((item, idx) => ({
        ...item,
        enabled: true,
        tempId: `preset-${idx}`
      }));

      setItems(presetItems);
      setPlanName(response.plan_name);
      setPlanDescription(response.description);
      setStep("customize");
    } catch (error) {
      console.error("Failed to generate plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate care plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (tempId: string) => {
    setItems(items.map(item =>
      item.tempId === tempId ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const savePlan = async () => {
    try {
      setLoading(true);

      const plan = await backend.care_plans.createCarePlan({
        user_id: userId,
        name: planName,
        condition_key: selectedPreset?.key,
        description: planDescription
      });

      const enabledItems = items.filter(item => item.enabled);

      for (const item of enabledItems) {
        await backend.care_plans.createCarePlanItem({
          care_plan_id: plan.id,
          type: item.type,
          label: item.label,
          details: item.details,
          frequency: item.frequency,
          times_of_day: item.times_of_day,
          days_of_week: item.days_of_week,
          reminder_enabled: item.reminder_enabled,
          sort_order: item.sort_order
        });
      }

      toast({
        title: "Success",
        description: "Care plan created successfully"
      });

      onComplete();
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast({
        title: "Error",
        description: "Failed to save care plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <h2 className="text-2xl font-bold text-[#323e48] mb-2">Create Care Plan</h2>
          <p className="text-sm text-[#4e8f71] mb-6">Choose a template to get started</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => selectPreset(preset)}
                disabled={loading}
                className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 hover:from-[#4e8f71]/20 hover:to-[#364d89]/20 rounded-2xl p-6 text-left transition-all border-2 border-transparent hover:border-[#4e8f71]/30"
              >
                <div className="text-4xl mb-3">{preset.icon}</div>
                <h3 className="font-semibold text-[#323e48] mb-2">{preset.name}</h3>
                <p className="text-sm text-[#323e48]/70">{preset.description}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "customize") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <h2 className="text-2xl font-bold text-[#323e48] mb-2">Customize Your Plan</h2>
          <p className="text-sm text-[#4e8f71] mb-6">{planName}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This care plan is general wellness support and not medical advice. Always follow your doctor's instructions and talk to your care team before making changes.
            </p>
          </div>

          {items.length > 0 ? (
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                    item.enabled
                      ? "bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 border-2 border-[#4e8f71]/30"
                      : "bg-gray-100 border-2 border-gray-200 opacity-50"
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.tempId)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.enabled ? "bg-[#4e8f71] text-white" : "bg-white border-2 border-gray-300"
                    }`}
                  >
                    {item.enabled && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(item.type)}</span>
                      <span className="font-medium text-[#323e48]">{item.label}</span>
                    </div>
                    <p className="text-sm text-[#323e48]/70 mt-1">
                      {item.frequency} {item.times_of_day && item.times_of_day.length > 0 && `at ${item.times_of_day.join(", ")}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#323e48]/60">
              <p>No items yet. Add tasks to your custom plan.</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setStep("select")}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={savePlan}
              disabled={loading || items.filter(i => i.enabled).length === 0}
              className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
            >
              {loading ? "Saving..." : "Save Care Plan"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
