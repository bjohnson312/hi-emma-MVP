import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { CarePlanItem, CreateCarePlanItemRequest } from "~backend/care_plans/types";

interface CarePlanItemEditorProps {
  item?: CarePlanItem;
  carePlanId: number;
  onSave: (item: CreateCarePlanItemRequest) => void;
  onCancel: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "3x_daily", label: "3 times daily" },
  { value: "5x_week", label: "5 times per week" },
  { value: "3x_week", label: "3 times per week" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
  { value: "custom", label: "Custom" }
];

const TYPE_OPTIONS = [
  { value: "medication", label: "💊 Medication", icon: "💊" },
  { value: "activity", label: "🏃 Activity", icon: "🏃" },
  { value: "measurement", label: "📊 Measurement", icon: "📊" },
  { value: "other", label: "✅ Other", icon: "✅" }
];

export default function CarePlanItemEditor({ item, carePlanId, onSave, onCancel }: CarePlanItemEditorProps) {
  const [type, setType] = useState<"medication" | "activity" | "measurement" | "other">(item?.type || "medication");
  const [label, setLabel] = useState(item?.label || "");
  const [frequency, setFrequency] = useState(item?.frequency || "once_daily");
  const [dosage, setDosage] = useState((item?.details as any)?.dosage || "");
  const [instructions, setInstructions] = useState((item?.details as any)?.instructions || "");
  const [timeInput, setTimeInput] = useState("");
  const [times, setTimes] = useState<string[]>(item?.times_of_day || []);
  const [reminderEnabled, setReminderEnabled] = useState(item?.reminder_enabled ?? true);

  const addTime = () => {
    if (timeInput && !times.includes(timeInput)) {
      setTimes([...times, timeInput]);
      setTimeInput("");
    }
  };

  const removeTime = (time: string) => {
    setTimes(times.filter(t => t !== time));
  };

  const handleSave = () => {
    const newItem: CreateCarePlanItemRequest = {
      care_plan_id: carePlanId,
      type,
      label,
      frequency,
      times_of_day: times,
      reminder_enabled: reminderEnabled,
      details: {
        dosage: dosage || undefined,
        instructions: instructions || undefined
      }
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#323e48]">
            {item ? "Edit Item" : "Add Item"}
          </h3>
          <button onClick={onCancel} className="text-[#323e48]/60 hover:text-[#323e48]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setType(option.value as any)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    type === option.value
                      ? "border-[#4e8f71] bg-[#4e8f71]/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">Name</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Blood pressure medication"
              className="w-full"
            />
          </div>

          {type === "medication" && (
            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">Dosage</label>
              <Input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 10mg"
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">Instructions</label>
            <Input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Take with food"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-xl"
            >
              {FREQUENCY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">Times</label>
            <div className="flex gap-2 mb-2">
              <Input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addTime} type="button">Add</Button>
            </div>
            {times.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {times.map(time => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-2 bg-[#4e8f71]/10 px-3 py-1 rounded-full text-sm"
                  >
                    {time}
                    <button onClick={() => removeTime(time)} className="text-[#323e48]/60 hover:text-[#323e48]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label className="text-sm text-[#323e48]">Enable reminders</label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label}
            className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
          >
            {item ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
