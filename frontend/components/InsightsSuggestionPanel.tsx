import { useState } from "react";
import { X, Check, Sparkles, Calendar, Heart, Apple, Pill, Activity } from "lucide-react";
import backend from "~backend/client";

interface DetectedInsight {
  id: string;
  intentType: string;
  extractedData: Record<string, any>;
  confidence: number;
  emmaSuggestionText?: string;
}

interface InsightsSuggestionPanelProps {
  suggestions: DetectedInsight[];
  userId: string;
  onApply: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  onClose: () => void;
}

const intentIcons: Record<string, any> = {
  morning_routine: Calendar,
  evening_routine: Activity,
  diet_nutrition: Apple,
  doctors_orders: Pill,
  mood: Heart,
  symptoms: Activity,
  wellness_general: Sparkles
};

const intentLabels: Record<string, string> = {
  morning_routine: "Morning Routine",
  evening_routine: "Evening Routine",
  diet_nutrition: "Diet & Nutrition",
  doctors_orders: "Doctor's Orders",
  mood: "Mood",
  symptoms: "Symptoms",
  wellness_general: "Wellness"
};

export default function InsightsSuggestionPanel({
  suggestions,
  userId,
  onApply,
  onDismiss,
  onClose
}: InsightsSuggestionPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(suggestions.map(s => s.id))
  );
  const [processing, setProcessing] = useState(false);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleApplySelected = async () => {
    setProcessing(true);
    try {
      for (const id of selectedIds) {
        await backend.insights.applySuggestion({ suggestionId: id, userId });
        onApply(id);
      }
      onClose();
    } catch (error) {
      console.error("Failed to apply suggestions:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDismissAll = async () => {
    setProcessing(true);
    try {
      for (const suggestion of suggestions) {
        await backend.insights.dismissSuggestion({ 
          suggestionId: suggestion.id, 
          userId 
        });
        onDismiss(suggestion.id);
      }
      onClose();
    } catch (error) {
      console.error("Failed to dismiss suggestions:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />
      
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] sm:max-h-[600px] overflow-hidden pointer-events-auto transition-all duration-300 ease-out"
        style={{
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Insights from our chat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-180px)] sm:max-h-[400px] px-6 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            I noticed a few things we discussed. Would you like me to save these?
          </p>

          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const Icon = intentIcons[suggestion.intentType] || Sparkles;
              const label = intentLabels[suggestion.intentType] || "Wellness";
              const isSelected = selectedIds.has(suggestion.id);

              return (
                <div
                  key={suggestion.id}
                  onClick={() => toggleSelection(suggestion.id)}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }
                    hover:border-purple-400 dark:hover:border-purple-500
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg flex-shrink-0
                      ${isSelected 
                        ? 'bg-purple-100 dark:bg-purple-900/40' 
                        : 'bg-gray-200 dark:bg-gray-700'
                      }
                    `}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          {label}
                        </span>
                        {suggestion.confidence >= 0.8 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            High confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {suggestion.emmaSuggestionText || formatSuggestion(suggestion)}
                      </p>
                    </div>

                    <div className={`
                      flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300 dark:border-gray-600'
                      }
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-2">
          <button
            onClick={handleApplySelected}
            disabled={processing || selectedIds.size === 0}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
          >
            {processing 
              ? "Saving..." 
              : `Save ${selectedIds.size === suggestions.length ? "All" : `${selectedIds.size} Selected`}`
            }
          </button>
          <button
            onClick={handleDismissAll}
            disabled={processing}
            className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSuggestion(suggestion: DetectedInsight): string {
  const data = suggestion.extractedData;
  
  switch (suggestion.intentType) {
    case "morning_routine":
      return `Add "${data.activity || data.name}" to your morning routine`;
    case "evening_routine":
      return `Add "${data.activity || data.name}" to your evening routine`;
    case "diet_nutrition":
      if (data.restriction) return `Save dietary restriction: ${data.restriction}`;
      if (data.goal) return `Save nutrition goal: ${data.goal}`;
      return "Update diet preferences";
    case "doctors_orders":
      return `Add medication: ${data.medication || data.name}`;
    case "mood":
      return `Log mood: ${data.mood || data.feeling}`;
    case "symptoms":
      return `Log symptom: ${data.symptom || "health observation"}`;
    default:
      return "Save wellness note";
  }
}
