import { useState, useEffect } from "react";
import { Apple, Plus, Coffee, Utensils, Salad, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { DietNutritionLog } from "~backend/wellness/types";

interface DietNutritionViewProps {
  userId: string;
}

export default function DietNutritionView({ userId }: DietNutritionViewProps) {
  const [todayLogs, setTodayLogs] = useState<DietNutritionLog[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showFoodAsMedicine, setShowFoodAsMedicine] = useState(false);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [description, setDescription] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTodayMeals();
  }, [userId]);

  const loadTodayMeals = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await backend.wellness.getMealLogs({
        user_id: userId,
        start_date: today,
        limit: 20
      });
      setTodayLogs(response.logs);
    } catch (error) {
      console.error("Failed to load meals:", error);
      toast({
        title: "Error",
        description: "Failed to load meal logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logMeal = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please describe what you ate",
        variant: "destructive"
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
      loadTodayMeals();
    } catch (error) {
      console.error("Failed to log meal:", error);
      toast({
        title: "Error",
        description: "Failed to log meal",
        variant: "destructive"
      });
    }
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
  const waterProgress = Math.min((totalWater / 80) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#4e8f71]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Apple className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Diet & Nutrition</h2>
              <p className="text-sm text-[#4e8f71]">Today's meals & tracking</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowFoodAsMedicine(!showFoodAsMedicine)}
              variant="outline"
              className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
            >
              <Info className="w-4 h-4 mr-2" />
              Food as Health
            </Button>
            {!showAddMeal && (
              <Button 
                onClick={() => setShowAddMeal(true)}
                className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
            )}
          </div>
        </div>

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
                  </div>
                  <p className="text-sm text-[#323e48]">{log.description}</p>
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
              <span className="text-sm font-medium text-[#323e48]">{totalWater}/80 oz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
