import { useState, useEffect } from "react";
import { Apple, Plus, Coffee, Utensils, Salad, Info, Camera, Refrigerator, Target, Settings, MessageCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { DietNutritionLog, NutritionPlan, NutritionSetupProgress } from "~backend/wellness/types";
import { NutritionSetupFlow } from "../NutritionSetupFlow";
import FoodImageUpload from "../FoodImageUpload";
import NutritionChatWithEmma from "../NutritionChatWithEmma";
import WeeklyMealPlanView from "./WeeklyMealPlanView";
import { logErrorSilently } from '@/lib/silent-error-handler';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton';

interface DietNutritionViewProps {
  userId: string;
}

export default function DietNutritionView({ userId }: DietNutritionViewProps) {
  const [todayLogs, setTodayLogs] = useState<DietNutritionLog[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [setupProgress, setSetupProgress] = useState<NutritionSetupProgress | null>(null);
  const [nutritionStats, setNutritionStats] = useState<any>(null);
  const [dailyAchievement, setDailyAchievement] = useState<any>(null);
  const [showSetupFlow, setShowSetupFlow] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showFoodAsMedicine, setShowFoodAsMedicine] = useState(false);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [showRefrigeratorScan, setShowRefrigeratorScan] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showEmmaChat, setShowEmmaChat] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [refrigeratorSuggestions, setRefrigeratorSuggestions] = useState<any>(null);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [description, setDescription] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      await Promise.all([
        loadTodayMeals(),
        loadNutritionPlan(),
        loadSetupProgress(),
        loadNutritionStats()
      ]);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'DietNutritionView',
        errorType: 'api_failure',
        severity: 'low',
      });
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayMeals = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await backend.wellness.getMealLogs({
        user_id: userId,
        start_date: today,
        limit: 20
      });
      setTodayLogs(response.logs);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'DietNutritionView',
        errorType: 'api_failure',
        apiEndpoint: '/wellness/meal-logs',
        severity: 'low',
      });
    }
  };

  const loadNutritionPlan = async () => {
    try {
      const response = await backend.wellness.getNutritionPlan({ user_id: userId });
      setNutritionPlan(response.plan || null);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'DietNutritionView',
        errorType: 'api_failure',
        apiEndpoint: '/wellness/nutrition-plan',
        severity: 'low',
      });
    }
  };

  const loadSetupProgress = async () => {
    try {
      const progress = await backend.wellness.getNutritionSetupProgress({ user_id: userId });
      setSetupProgress(progress);
      if (!progress.isCompleted) {
        setShowSetupFlow(true);
      }
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'DietNutritionView',
        errorType: 'api_failure',
        apiEndpoint: '/wellness/nutrition-setup-progress',
        severity: 'low',
      });
    }
  };

  const loadNutritionStats = async () => {
    try {
      const stats = await backend.wellness.getNutritionStats({ user_id: userId });
      setNutritionStats(stats);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'DietNutritionView',
        errorType: 'api_failure',
        apiEndpoint: '/wellness/nutrition-stats',
        severity: 'low',
      });
    }
  };

  const logMeal = async () => {
    if (!description.trim()) {
      toast({
        title: "Add description",
        description: "Please describe what you ate",
        variant: "default"
      });
      return;
    }

    try {
      await backend.wellness.logMeal({
        user_id: userId,
        meal_type: mealType,
        description: description.trim(),
        water_intake_oz: waterIntake ? parseInt(waterIntake) : undefined
      });
      
      toast({
        title: "Success",
        description: "Meal logged successfully"
      });
      
      setDescription("");
      setWaterIntake("");
      setShowAddMeal(false);
      await loadTodayMeals();
      await calculateDailyAchievement();
    } catch (error) {
      console.error("Failed to log meal:", error);
      toast({
        title: "Error",
        description: "Failed to log meal",
        variant: "destructive"
      });
    }
  };

  const handleMealImageAnalysis = async (data: any) => {
    setShowImageCapture(false);
    await loadTodayMeals();
    await calculateDailyAchievement();
    
    if (data.meal_data) {
      toast({
        title: "Meal Analyzed",
        description: `${data.meal_data.description} - ${data.meal_data.calories || "?"} calories`,
        duration: 5000
      });
    }
  };

  const calculateDailyAchievement = async () => {
    if (!nutritionPlan) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const achievement = await backend.wellness.calculateDailyAchievement({
        user_id: userId,
        date: today,
        calories: todayCalories,
        protein_g: todayProtein,
        carbs_g: todayCarbs,
        fat_g: todayFat,
        water_oz: totalWater,
        calorie_target: nutritionPlan.calorie_target || 2000,
        protein_target: nutritionPlan.protein_target_g || 150,
        carbs_target: nutritionPlan.carbs_target_g || 200,
        fat_target: nutritionPlan.fat_target_g || 65,
        water_target: 80
      });
      setDailyAchievement(achievement);
      await loadNutritionStats();
    } catch (error) {
      console.error("Failed to calculate daily achievement:", error);
    }
  };

  const handleRefrigeratorAnalysis = (data: any) => {
    setShowRefrigeratorScan(false);
    
    if (data.refrigerator_data) {
      setRefrigeratorSuggestions(data.refrigerator_data);
      toast({
        title: "Refrigerator Scanned",
        description: `Found ${data.refrigerator_data.detected_items?.length || 0} items`,
        duration: 3000
      });
    }
  };

  const handleSetupComplete = () => {
    setShowSetupFlow(false);
    loadNutritionPlan();
    loadSetupProgress();
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case "breakfast": return Coffee;
      case "lunch": return Utensils;
      case "dinner": return Utensils;
      case "snack": return Salad;
      default: return Utensils;
    }
  };

  const totalWater = todayLogs.reduce((sum, log) => sum + (log.water_intake_oz || 0), 0);
  const waterGoalOz = 80;
  const waterProgress = Math.min((totalWater / waterGoalOz) * 100, 100);

  const todayCalories = todayLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const todayProtein = todayLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
  const todayCarbs = todayLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
  const todayFat = todayLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="mb-6">
            <div className="h-12 w-64 bg-muted/50 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-40 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          </div>
          <LoadingSkeleton lines={8} />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <EmptyState
          title="Nutrition tracking unavailable"
          description="We're having trouble loading your nutrition data right now"
          onRetry={loadData}
          icon={<Apple className="h-16 w-16" />}
        />
      </div>
    );
  }

  if (showSetupFlow) {
    return (
      <NutritionSetupFlow
        userId={userId}
        existingProgress={setupProgress}
        onComplete={handleSetupComplete}
        onExit={() => setShowSetupFlow(false)}
      />
    );
  }

  if (showMealPlan) {
    return <WeeklyMealPlanView userId={userId} onBack={() => setShowMealPlan(false)} />;
  }

  return (
    <div className="space-y-6">
      {showEmmaChat && (
        <NutritionChatWithEmma
          userId={userId}
          onClose={() => setShowEmmaChat(false)}
          onMealLogged={() => {
            loadTodayMeals();
            calculateDailyAchievement();
          }}
          onGoalsUpdated={() => {
            loadNutritionPlan();
          }}
        />
      )}

      {setupProgress && !setupProgress.isCompleted && (
        <div className="bg-gradient-to-r from-[#4e8f71]/20 to-[#364d89]/20 rounded-2xl p-6 border border-[#4e8f71]/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#323e48] mb-1">Complete Your Nutrition Setup</h3>
              <p className="text-sm text-[#323e48]/70">
                {setupProgress.stepsCompleted.length}/6 steps completed
              </p>
              <div className="h-2 bg-white/60 rounded-full mt-2 w-64">
                <div 
                  className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] rounded-full transition-all"
                  style={{ width: `${(setupProgress.stepsCompleted.length / 6) * 100}%` }}
                ></div>
              </div>
            </div>
            <Button 
              onClick={() => setShowSetupFlow(true)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
            >
              Continue Setup
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Apple className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Diet & Nutrition</h2>
              <p className="text-sm text-[#4e8f71]">Track meals & reach your goals</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowMealPlan(true)}
              className="bg-gradient-to-r from-[#364d89] to-[#6656cb] text-white"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Meal Plan
            </Button>
            <Button 
              onClick={() => setShowEmmaChat(true)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Emma
            </Button>
            {setupProgress?.isCompleted && (
              <Button 
                onClick={() => setShowSetupFlow(true)}
                variant="outline"
                className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
            )}
            <Button 
              onClick={() => setShowFoodAsMedicine(!showFoodAsMedicine)}
              variant="outline"
              className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
            >
              <Info className="w-4 h-4 mr-2" />
              Food as Health
            </Button>
          </div>
        </div>

        {nutritionPlan && (
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#4e8f71]" />
                <h3 className="text-xl font-bold text-[#323e48]">Your Nutrition Plan</h3>
              </div>
              <Button
                onClick={() => setShowDetailedStats(!showDetailedStats)}
                variant="ghost"
                size="sm"
                className="text-[#4e8f71] hover:bg-[#4e8f71]/10"
              >
                {showDetailedStats ? "Hide Details" : "View Details"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {nutritionStats && (
                <>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-[#323e48]/60 mb-1">Days Achieved</p>
                    <p className="text-2xl font-bold text-[#4e8f71]">
                      {nutritionStats.days_achieved}/{nutritionStats.total_days_tracked}
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-[#323e48]/60 mb-1">Current Streak</p>
                    <p className="text-2xl font-bold text-[#364d89]">
                      {nutritionStats.current_streak} 🔥
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-[#323e48]/60 mb-1">Today's Progress</p>
                    <p className="text-2xl font-bold text-[#323e48]">
                      {dailyAchievement?.overall_percentage || 0}%
                    </p>
                  </div>
                </>
              )}
            </div>

            {showDetailedStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-[#323e48]/60 mb-1">Calories</p>
                <p className="text-2xl font-bold text-[#323e48]">
                  {Math.round(todayCalories)}/{nutritionPlan.calorie_target || "?"}
                </p>
                <div className="h-2 bg-white/90 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89]"
                    style={{ width: `${Math.min((todayCalories / (nutritionPlan.calorie_target || 2000)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-[#323e48]/60 mb-1">Protein (g)</p>
                <p className="text-2xl font-bold text-[#323e48]">
                  {Math.round(todayProtein)}/{nutritionPlan.protein_target_g || "?"}
                </p>
                <div className="h-2 bg-white/90 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89]"
                    style={{ width: `${Math.min((todayProtein / (nutritionPlan.protein_target_g || 150)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-[#323e48]/60 mb-1">Carbs (g)</p>
                <p className="text-2xl font-bold text-[#323e48]">
                  {Math.round(todayCarbs)}/{nutritionPlan.carbs_target_g || "?"}
                </p>
                <div className="h-2 bg-white/90 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89]"
                    style={{ width: `${Math.min((todayCarbs / (nutritionPlan.carbs_target_g || 200)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-[#323e48]/60 mb-1">Fat (g)</p>
                <p className="text-2xl font-bold text-[#323e48]">
                  {Math.round(todayFat)}/{nutritionPlan.fat_target_g || "?"}
                </p>
                <div className="h-2 bg-white/90 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89]"
                    style={{ width: `${Math.min((todayFat / (nutritionPlan.fat_target_g || 65)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              </div>
            )}

            {showDetailedStats && nutritionPlan.goals && nutritionPlan.goals.length > 0 && (
              <div className="bg-white/60 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#4e8f71] mb-2">Your Goals:</p>
                <div className="flex flex-wrap gap-2">
                  {nutritionPlan.goals.map((goal, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#4e8f71]/20 rounded-full text-sm text-[#323e48]">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showFoodAsMedicine && (
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#323e48]">Food as Health Program</h3>
              <Button 
                onClick={() => setShowFoodAsMedicine(false)}
                variant="ghost"
                size="sm"
                className="text-[#323e48]/60 hover:text-[#323e48]"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4 text-[#323e48]">
              <p className="leading-relaxed">
                The <strong>Food as Health</strong> program recognizes that healthy food is essential for preventing and managing chronic diseases. This initiative helps provide access to nutritious foods as part of medical care.
              </p>
              
              <div className="bg-white/60 rounded-xl p-4">
                <h4 className="font-semibold mb-2 text-[#4e8f71]">Program Benefits:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Access to fresh fruits and vegetables</li>
                  <li>• Nutrition counseling and education</li>
                  <li>• Meal planning support</li>
                  <li>• Assistance with dietary management for chronic conditions</li>
                  <li>• Connection to local food resources</li>
                </ul>
              </div>

              <div className="bg-white/60 rounded-xl p-4">
                <h4 className="font-semibold mb-2 text-[#4e8f71]">Who Qualifies:</h4>
                <p className="text-sm leading-relaxed">
                  Patients with diet-related chronic conditions such as diabetes, hypertension, or heart disease may qualify. Speak with your healthcare provider to learn more about enrollment.
                </p>
              </div>

              <div className="bg-white/60 rounded-xl p-4">
                <h4 className="font-semibold mb-2 text-[#4e8f71]">How to Get Started:</h4>
                <p className="text-sm leading-relaxed">
                  Contact your healthcare provider or care coordinator to discuss whether the Food as Health program is right for you. They can help assess your eligibility and connect you with available resources.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Button 
              onClick={() => setShowImageCapture(!showImageCapture)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Photo Track Meal
            </Button>
            {showImageCapture && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setMealType("breakfast")}
                    variant={mealType === "breakfast" ? "default" : "outline"}
                    size="sm"
                    className={mealType === "breakfast" ? "bg-[#4e8f71] text-white" : ""}
                  >
                    Breakfast
                  </Button>
                  <Button
                    onClick={() => setMealType("lunch")}
                    variant={mealType === "lunch" ? "default" : "outline"}
                    size="sm"
                    className={mealType === "lunch" ? "bg-[#4e8f71] text-white" : ""}
                  >
                    Lunch
                  </Button>
                  <Button
                    onClick={() => setMealType("dinner")}
                    variant={mealType === "dinner" ? "default" : "outline"}
                    size="sm"
                    className={mealType === "dinner" ? "bg-[#4e8f71] text-white" : ""}
                  >
                    Dinner
                  </Button>
                  <Button
                    onClick={() => setMealType("snack")}
                    variant={mealType === "snack" ? "default" : "outline"}
                    size="sm"
                    className={mealType === "snack" ? "bg-[#4e8f71] text-white" : ""}
                  >
                    Snack
                  </Button>
                </div>
                <FoodImageUpload
                  userId={userId}
                  imageType="meal"
                  mealType={mealType}
                  onAnalysisComplete={handleMealImageAnalysis}
                />
              </div>
            )}
          </div>
          
          <div>
            <Button 
              onClick={() => setShowRefrigeratorScan(!showRefrigeratorScan)}
              variant="outline"
              className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10 w-full"
            >
              <Refrigerator className="w-4 h-4 mr-2" />
              Scan Refrigerator
            </Button>
            {showRefrigeratorScan && (
              <div className="mt-3">
                <FoodImageUpload
                  userId={userId}
                  imageType="refrigerator"
                  onAnalysisComplete={handleRefrigeratorAnalysis}
                />
              </div>
            )}
          </div>
        </div>

        {refrigeratorSuggestions && (
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#323e48]">Meal Suggestions</h3>
              <Button 
                onClick={() => setRefrigeratorSuggestions(null)}
                variant="ghost"
                size="sm"
                className="text-[#323e48]/60 hover:text-[#323e48]"
              >
                ✕
              </Button>
            </div>
            
            {refrigeratorSuggestions.detected_items && refrigeratorSuggestions.detected_items.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#4e8f71] mb-2">Detected Items:</p>
                <div className="flex flex-wrap gap-2">
                  {refrigeratorSuggestions.detected_items.map((item: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-white/60 rounded-lg text-xs text-[#323e48]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {refrigeratorSuggestions.suggested_meals?.map((meal: any, idx: number) => (
                <div key={idx} className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-semibold text-[#323e48] mb-1">{meal.name}</h4>
                  <p className="text-sm text-[#323e48]/80 mb-2">{meal.description}</p>
                  <p className="text-xs text-[#4e8f71] mb-2">⏱️ {meal.estimated_prep_time}</p>
                  <div className="flex flex-wrap gap-1">
                    {meal.ingredients?.map((ingredient: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-[#4e8f71]/10 rounded text-xs text-[#323e48]">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showAddMeal && (
          <Button 
            onClick={() => setShowAddMeal(true)}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white w-full mb-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Manual Log Meal
          </Button>
        )}

        {showAddMeal && (
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-[#323e48] mb-3">Log a Meal</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setMealType("breakfast")}
                  variant={mealType === "breakfast" ? "default" : "outline"}
                  size="sm"
                  className={mealType === "breakfast" ? "bg-[#4e8f71] text-white" : ""}
                >
                  Breakfast
                </Button>
                <Button
                  onClick={() => setMealType("lunch")}
                  variant={mealType === "lunch" ? "default" : "outline"}
                  size="sm"
                  className={mealType === "lunch" ? "bg-[#4e8f71] text-white" : ""}
                >
                  Lunch
                </Button>
                <Button
                  onClick={() => setMealType("dinner")}
                  variant={mealType === "dinner" ? "default" : "outline"}
                  size="sm"
                  className={mealType === "dinner" ? "bg-[#4e8f71] text-white" : ""}
                >
                  Dinner
                </Button>
                <Button
                  onClick={() => setMealType("snack")}
                  variant={mealType === "snack" ? "default" : "outline"}
                  size="sm"
                  className={mealType === "snack" ? "bg-[#4e8f71] text-white" : ""}
                >
                  Snack
                </Button>
              </div>
              <Input
                placeholder="What did you eat?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/90"
              />
              <Input
                placeholder="Water intake (oz)"
                type="number"
                value={waterIntake}
                onChange={(e) => setWaterIntake(e.target.value)}
                className="bg-white/90"
              />
              <div className="flex gap-2">
                <Button
                  onClick={logMeal}
                  className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setShowAddMeal(false);
                    setDescription("");
                    setWaterIntake("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-[#323e48]">Today's Meals</h3>
          {todayLogs.length === 0 ? (
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
              <p className="text-[#323e48]/60">No meals logged today</p>
            </div>
          ) : (
            todayLogs.map((log) => {
              const Icon = getMealIcon(log.meal_type);
              return (
                <div key={log.id} className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-[#364d89]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#323e48] capitalize">{log.meal_type}</h3>
                      <p className="text-xs text-[#323e48]/60">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {log.analyzed && <span className="text-xs text-[#4e8f71]">📸 AI Analyzed</span>}
                  </div>
                  <p className="text-sm text-[#323e48] mb-2">{log.description}</p>
                  {(log.calories || log.protein_g || log.carbs_g || log.fat_g) && (
                    <div className="flex gap-3 text-xs text-[#4e8f71]">
                      {log.calories && <span>Cal: {Math.round(log.calories)}</span>}
                      {log.protein_g && <span>Protein: {Math.round(log.protein_g)}g</span>}
                      {log.carbs_g && <span>Carbs: {Math.round(log.carbs_g)}g</span>}
                      {log.fat_g && <span>Fat: {Math.round(log.fat_g)}g</span>}
                    </div>
                  )}
                  {log.water_intake_oz && (
                    <p className="text-xs text-[#4e8f71] mt-2">Water: {log.water_intake_oz}oz</p>
                  )}
                </div>
              );
            })
          )}

          <div className="bg-gradient-to-r from-[#4e8f71]/5 to-[#364d89]/5 rounded-2xl p-4">
            <h3 className="font-semibold text-[#323e48] mb-2">Water Intake Today</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-white/90 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] rounded-full transition-all" 
                  style={{ width: `${waterProgress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-[#323e48]">{totalWater}/{waterGoalOz} oz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
