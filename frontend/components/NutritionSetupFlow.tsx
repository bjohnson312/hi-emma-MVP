import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { NutritionSetupProgress } from "~backend/wellness/types";
import {
  Target,
  Apple,
  Utensils,
  Droplets,
  TrendingUp,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";

interface NutritionSetupFlowProps {
  userId: string;
  existingProgress: NutritionSetupProgress | null;
  onComplete: () => void;
  onExit: () => void;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  optional?: boolean;
}

const SETUP_STEPS: StepConfig[] = [
  {
    id: "goals",
    title: "Your Nutrition Goals",
    description: "What are you hoping to achieve with better nutrition?",
    icon: Target,
  },
  {
    id: "dietary_preferences",
    title: "Dietary Preferences",
    description: "Any dietary restrictions, allergies, or preferences?",
    icon: Apple,
  },
  {
    id: "meal_patterns",
    title: "Meal Patterns",
    description: "Tell us about your typical eating schedule",
    icon: Utensils,
  },
  {
    id: "water_goals",
    title: "Hydration Goals",
    description: "How much water do you want to drink daily?",
    icon: Droplets,
  },
  {
    id: "targets",
    title: "Nutrition Targets",
    description: "Set your daily calorie and macro targets",
    icon: TrendingUp,
  },
  {
    id: "review",
    title: "Review Your Plan",
    description: "Let's review your personalized nutrition plan",
    icon: Check,
  },
];

export function NutritionSetupFlow({ 
  userId, 
  existingProgress, 
  onComplete, 
  onExit 
}: NutritionSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState(existingProgress?.currentStep || 0);
  const [stepsCompleted, setStepsCompleted] = useState<string[]>(
    existingProgress?.stepsCompleted || []
  );

  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [customDietary, setCustomDietary] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("3");
  const [breakfastTime, setBreakfastTime] = useState("08:00");
  const [lunchTime, setLunchTime] = useState("12:00");
  const [dinnerTime, setDinnerTime] = useState("18:00");
  const [waterGoal, setWaterGoal] = useState("64");
  const [calorieTarget, setCalorieTarget] = useState("2000");
  const [proteinTarget, setProteinTarget] = useState("150");
  const [carbsTarget, setCarbsTarget] = useState("200");
  const [fatTarget, setFatTarget] = useState("65");

  const { toast } = useToast();

  const step = SETUP_STEPS[currentStep];
  const isReviewStep = step.id === "review";
  const totalSteps = SETUP_STEPS.length;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  useEffect(() => {
    saveProgress();
  }, [currentStep, stepsCompleted]);

  const saveProgress = async () => {
    if (!userId) return;
    
    try {
      await backend.wellness.updateNutritionSetupProgress({
        user_id: userId,
        current_step: currentStep,
        steps_completed: stepsCompleted,
        is_completed: currentStep >= totalSteps - 1
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const addCustomGoal = () => {
    if (customGoal.trim()) {
      setGoals([...goals, customGoal.trim()]);
      setCustomGoal("");
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const addCustomDietary = () => {
    if (customDietary.trim()) {
      setDietaryRestrictions([...dietaryRestrictions, customDietary.trim()]);
      setCustomDietary("");
    }
  };

  const handleNext = async () => {
    if (!stepsCompleted.includes(step.id)) {
      setStepsCompleted([...stepsCompleted, step.id]);
    }

    if (currentStep === totalSteps - 2) {
      await savePlan();
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const savePlan = async () => {
    try {
      await backend.wellness.updateDietPreferences({
        user_id: userId,
        dietary_restrictions: dietaryRestrictions,
        allergies: allergies ? [allergies] : undefined,
        meal_goals: goals,
        water_goal_oz: parseInt(waterGoal),
        preferred_meal_times: JSON.stringify({
          breakfast: breakfastTime,
          lunch: lunchTime,
          dinner: dinnerTime,
          meals_per_day: parseInt(mealsPerDay)
        })
      });

      const planGoals = [...goals];
      if (dietaryRestrictions.length > 0) {
        planGoals.push(`Following: ${dietaryRestrictions.join(", ")}`);
      }

      await backend.wellness.saveNutritionPlan({
        user_id: userId,
        goals: planGoals,
        dietary_preferences: dietaryRestrictions.join(", "),
        calorie_target: parseInt(calorieTarget),
        protein_target_g: parseInt(proteinTarget),
        carbs_target_g: parseInt(carbsTarget),
        fat_target_g: parseInt(fatTarget)
      });

      toast({
        title: "Plan Saved!",
        description: "Your nutrition plan has been created successfully"
      });
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast({
        title: "Error",
        description: "Failed to save nutrition plan",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async () => {
    try {
      await backend.wellness.updateNutritionSetupProgress({
        user_id: userId,
        current_step: totalSteps - 1,
        steps_completed: [...new Set([...stepsCompleted, "review"])],
        is_completed: true
      });
      onComplete();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error completing setup",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const canProceed = () => {
    switch (step.id) {
      case "goals":
        return goals.length > 0;
      case "dietary_preferences":
        return true;
      case "meal_patterns":
        return mealsPerDay && breakfastTime && lunchTime && dinnerTime;
      case "water_goals":
        return waterGoal && parseInt(waterGoal) > 0;
      case "targets":
        return calorieTarget && proteinTarget && carbsTarget && fatTarget;
      default:
        return true;
    }
  };

  const StepIcon = step.icon;

  const goalOptions = [
    "Weight management",
    "More energy",
    "Better sleep",
    "Improve chronic condition",
    "Build muscle",
    "Heart health",
    "Digestive health",
    "Mental clarity"
  ];

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-free",
    "Dairy-free",
    "Low-carb",
    "Keto",
    "Paleo",
    "Mediterranean"
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-[#4e8f71] to-[#364d89]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Building Your Nutrition Plan
            </h2>
            <button
              onClick={onExit}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-white/90 text-sm mt-2">
            Step {currentStep + 1} of {totalSteps} • {progressPercent}% Complete
          </p>
        </div>

        <div className="p-8">
          {!isReviewStep ? (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#4e8f71]/20 rounded-full flex items-center justify-center">
                    <StepIcon className="w-6 h-6 text-[#4e8f71]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#323e48] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#323e48]/70">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.id === "goals" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          goals.includes(goal)
                            ? "border-[#4e8f71] bg-[#4e8f71]/10 text-[#323e48]"
                            : "border-gray-200 text-[#323e48]/60 hover:border-[#4e8f71]/50"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="Add custom goal..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && addCustomGoal()}
                    />
                    <Button onClick={addCustomGoal} className="bg-[#4e8f71]">
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {step.id === "dietary_preferences" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Dietary Preferences
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {dietaryOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => toggleDietaryRestriction(option)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            dietaryRestrictions.includes(option)
                              ? "border-[#4e8f71] bg-[#4e8f71]/10 text-[#323e48]"
                              : "border-gray-200 text-[#323e48]/60 hover:border-[#4e8f71]/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={customDietary}
                        onChange={(e) => setCustomDietary(e.target.value)}
                        placeholder="Add custom preference..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === "Enter" && addCustomDietary()}
                      />
                      <Button onClick={addCustomDietary} className="bg-[#4e8f71]">
                        Add
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Allergies (optional)
                    </label>
                    <Input
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g., peanuts, shellfish, dairy"
                    />
                  </div>
                </div>
              )}

              {step.id === "meal_patterns" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Meals per day
                    </label>
                    <Input
                      type="number"
                      value={mealsPerDay}
                      onChange={(e) => setMealsPerDay(e.target.value)}
                      min="1"
                      max="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Typical breakfast time
                    </label>
                    <Input
                      type="time"
                      value={breakfastTime}
                      onChange={(e) => setBreakfastTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Typical lunch time
                    </label>
                    <Input
                      type="time"
                      value={lunchTime}
                      onChange={(e) => setLunchTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Typical dinner time
                    </label>
                    <Input
                      type="time"
                      value={dinnerTime}
                      onChange={(e) => setDinnerTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step.id === "water_goals" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Daily water goal (oz)
                    </label>
                    <Input
                      type="number"
                      value={waterGoal}
                      onChange={(e) => setWaterGoal(e.target.value)}
                      min="0"
                    />
                    <p className="text-xs text-[#323e48]/60 mt-1">
                      Recommended: 64-80 oz per day
                    </p>
                  </div>
                  <div className="bg-[#4e8f71]/10 rounded-xl p-4">
                    <p className="text-sm text-[#323e48]">
                      💧 Your goal: {waterGoal} oz = {Math.round(parseInt(waterGoal) / 8)} glasses
                    </p>
                  </div>
                </div>
              )}

              {step.id === "targets" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Daily calorie target
                    </label>
                    <Input
                      type="number"
                      value={calorieTarget}
                      onChange={(e) => setCalorieTarget(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Protein target (grams)
                    </label>
                    <Input
                      type="number"
                      value={proteinTarget}
                      onChange={(e) => setProteinTarget(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Carbs target (grams)
                    </label>
                    <Input
                      type="number"
                      value={carbsTarget}
                      onChange={(e) => setCarbsTarget(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#323e48] mb-2">
                      Fat target (grams)
                    </label>
                    <Input
                      type="number"
                      value={fatTarget}
                      onChange={(e) => setFatTarget(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 pt-4">
                {currentStep > 0 && (
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceed()}
                  className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                >
                  {currentStep === totalSteps - 2 ? "Save Plan" : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#4e8f71]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#4e8f71]" />
                </div>
                <h3 className="text-2xl font-bold text-[#323e48] mb-2">
                  Your Plan is Ready!
                </h3>
                <p className="text-[#323e48]/70 mb-6">
                  You can now track meals, log water intake, and monitor your progress.
                </p>
              </div>

              <div className="bg-[#4e8f71]/10 rounded-2xl p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-[#323e48] mb-2">Your Goals:</h4>
                  <div className="flex flex-wrap gap-2">
                    {goals.map((goal, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#323e48]">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
                {dietaryRestrictions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#323e48] mb-2">Dietary Preferences:</h4>
                    <div className="flex flex-wrap gap-2">
                      {dietaryRestrictions.map((pref, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#323e48]">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-[#323e48]/60">Calories</p>
                    <p className="text-lg font-bold text-[#323e48]">{calorieTarget}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-[#323e48]/60">Protein</p>
                    <p className="text-lg font-bold text-[#323e48]">{proteinTarget}g</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-[#323e48]/60">Carbs</p>
                    <p className="text-lg font-bold text-[#323e48]">{carbsTarget}g</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-[#323e48]/60">Fat</p>
                    <p className="text-lg font-bold text-[#323e48]">{fatTarget}g</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white">
                  Complete Setup
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
