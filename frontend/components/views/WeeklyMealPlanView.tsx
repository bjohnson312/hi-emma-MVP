import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, RefreshCw, ShoppingCart, Edit2, Save, X, Sparkles, Download, Star, Heart, List } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { WeeklyMealPlan, MealItem, DayMealPlan, ShoppingList } from "~backend/wellness/meal_plan_types";

interface WeeklyMealPlanViewProps {
  userId: string;
  onBack: () => void;
}

export default function WeeklyMealPlanView({ userId, onBack }: WeeklyMealPlanViewProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planId, setPlanId] = useState<number | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<string>("");
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [editedMealData, setEditedMealData] = useState<MealItem | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [savedMealPlans, setSavedMealPlans] = useState<any[]>([]);
  const [savedShoppingLists, setSavedShoppingLists] = useState<any[]>([]);
  const { toast } = useToast();

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    setLoading(true);
    try {
      const response = await backend.wellness.getMealPlan({ user_id: userId });
      if (response.has_plan && response.plan_data) {
        setPlanId(response.plan_id);
        setWeekStartDate(response.week_start_date);
        setMealPlan(response.plan_data);
      } else {
        setWeekStartDate(response.week_start_date);
      }
    } catch (error) {
      console.error("Failed to load meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to load meal plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    setGenerating(true);
    try {
      const response = await backend.wellness.generateMealPlan({ user_id: userId });
      setPlanId(response.plan_id);
      setWeekStartDate(response.week_start_date);
      setMealPlan(response.plan_data);
      toast({
        title: "Meal Plan Generated!",
        description: "Your personalized weekly meal plan is ready",
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to generate meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const startEditingMeal = (day: string, mealType: string, meal: MealItem) => {
    setEditingDay(day);
    setEditingMeal(mealType);
    setEditedMealData({ ...meal });
  };

  const cancelEditing = () => {
    setEditingDay(null);
    setEditingMeal(null);
    setEditedMealData(null);
  };

  const saveMealEdit = async () => {
    if (!mealPlan || !editingDay || !editingMeal || !editedMealData || !planId) return;

    const updatedPlan = { ...mealPlan };
    const dayPlan = updatedPlan[editingDay as keyof WeeklyMealPlan] as DayMealPlan;
    
    if (editingMeal === 'snacks') {
      return;
    } else {
      (dayPlan as any)[editingMeal] = editedMealData;
    }

    try {
      await backend.wellness.updateMealPlan({
        plan_id: planId,
        user_id: userId,
        plan_data: updatedPlan
      });
      
      setMealPlan(updatedPlan);
      cancelEditing();
      
      toast({
        title: "Meal Updated!",
        description: "Your changes have been saved",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to update meal:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  const generateShoppingList = async () => {
    if (!planId) return;
    
    setLoading(true);
    try {
      const response = await backend.wellness.generateShoppingList({
        plan_id: planId,
        user_id: userId
      });
      
      setShoppingList(response.shopping_list);
      setShowShoppingList(true);
      
      toast({
        title: "Shopping List Generated!",
        description: "Your grocery list is ready",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to generate shopping list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMealPlan = async () => {
    if (!mealPlan) return;
    
    try {
      await backend.wellness.saveMealPlan({
        user_id: userId,
        title: `Meal Plan - ${new Date(weekStartDate).toLocaleDateString()}`,
        mealPlanId: planId || undefined,
        mealPlanData: mealPlan
      });
      
      toast({
        title: "Saved!",
        description: "Meal plan saved successfully",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to save meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to save meal plan",
        variant: "destructive"
      });
    }
  };

  const saveShoppingList = async () => {
    if (!shoppingList) return;
    
    try {
      await backend.wellness.saveShoppingList({
        user_id: userId,
        title: `Shopping List - ${new Date(weekStartDate).toLocaleDateString()}`,
        mealPlanId: planId || undefined,
        shoppingListData: shoppingList
      });
      
      toast({
        title: "Saved!",
        description: "Shopping list saved successfully",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to save shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to save shopping list",
        variant: "destructive"
      });
    }
  };

  const downloadMealPlan = async (format: "pdf" | "csv") => {
    if (!mealPlan) return;
    
    try {
      const response = await backend.wellness.downloadMealPlan({
        mealPlanData: mealPlan,
        format
      });
      
      const blob = new Blob([response.content], { type: response.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: `Meal plan downloaded as ${format.toUpperCase()}`,
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to download meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to download meal plan",
        variant: "destructive"
      });
    }
  };

  const downloadShoppingList = async (format: "pdf" | "csv") => {
    if (!shoppingList) return;
    
    try {
      const response = await backend.wellness.downloadShoppingList({
        shoppingListData: shoppingList,
        format
      });
      
      const blob = new Blob([response.content], { type: response.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: `Shopping list downloaded as ${format.toUpperCase()}`,
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to download shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to download shopping list",
        variant: "destructive"
      });
    }
  };

  const loadSavedItems = async () => {
    try {
      const [plansResponse, listsResponse] = await Promise.all([
        backend.wellness.listSavedMealPlans({ user_id: userId, favoritesOnly: false }),
        backend.wellness.listSavedShoppingLists({ user_id: userId, favoritesOnly: false })
      ]);
      setSavedMealPlans(plansResponse.plans);
      setSavedShoppingLists(listsResponse.lists);
    } catch (error) {
      console.error("Failed to load saved items:", error);
    }
  };

  const toggleFavoriteMealPlan = async (id: number, isFavorite: boolean) => {
    try {
      await backend.wellness.toggleFavoriteMealPlan({ user_id: userId, id, isFavorite });
      await loadSavedItems();
      toast({
        title: isFavorite ? "Added to favorites" : "Removed from favorites",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive"
      });
    }
  };

  const toggleFavoriteShoppingList = async (id: number, isFavorite: boolean) => {
    try {
      await backend.wellness.toggleFavoriteShoppingList({ user_id: userId, id, isFavorite });
      await loadSavedItems();
      toast({
        title: isFavorite ? "Added to favorites" : "Removed from favorites",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive"
      });
    }
  };

  const deleteSavedMealPlan = async (id: number) => {
    try {
      await backend.wellness.deleteSavedMealPlan({ user_id: userId, id });
      await loadSavedItems();
      toast({
        title: "Deleted",
        description: "Meal plan removed",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({
        title: "Error",
        description: "Failed to delete meal plan",
        variant: "destructive"
      });
    }
  };

  const deleteSavedShoppingList = async (id: number) => {
    try {
      await backend.wellness.deleteSavedShoppingList({ user_id: userId, id });
      await loadSavedItems();
      toast({
        title: "Deleted",
        description: "Shopping list removed",
        duration: 2000
      });
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({
        title: "Error",
        description: "Failed to delete shopping list",
        variant: "destructive"
      });
    }
  };

  const loadSavedMealPlan = (plan: any) => {
    setMealPlan(plan.mealPlanData);
    setShowSavedItems(false);
    toast({
      title: "Loaded!",
      description: "Meal plan loaded successfully",
      duration: 2000
    });
  };

  const loadSavedShoppingList = (list: any) => {
    setShoppingList(list.shoppingListData);
    setShowShoppingList(true);
    setShowSavedItems(false);
    toast({
      title: "Loaded!",
      description: "Shopping list loaded successfully",
      duration: 2000
    });
  };

  const getMealTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderMealCard = (day: string, mealType: string, meal: MealItem) => {
    const isEditing = editingDay === day && editingMeal === mealType;

    return (
      <div key={mealType} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/60">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-[#4e8f71]">{getMealTypeLabel(mealType)}</h4>
          {!isEditing && (
            <Button
              onClick={() => startEditingMeal(day, mealType, meal)}
              size="sm"
              variant="ghost"
              className="text-[#364d89] hover:bg-[#364d89]/10"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isEditing && editedMealData ? (
          <div className="space-y-3">
            <Input
              value={editedMealData.name}
              onChange={(e) => setEditedMealData({ ...editedMealData, name: e.target.value })}
              placeholder="Meal name"
              className="text-sm"
            />
            <Input
              value={editedMealData.description}
              onChange={(e) => setEditedMealData({ ...editedMealData, description: e.target.value })}
              placeholder="Description"
              className="text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={editedMealData.calories || ''}
                onChange={(e) => setEditedMealData({ ...editedMealData, calories: parseInt(e.target.value) || 0 })}
                placeholder="Calories"
                className="text-sm"
              />
              <Input
                type="number"
                value={editedMealData.protein_g || ''}
                onChange={(e) => setEditedMealData({ ...editedMealData, protein_g: parseInt(e.target.value) || 0 })}
                placeholder="Protein (g)"
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveMealEdit} size="sm" className="flex-1 bg-[#4e8f71] hover:bg-[#3d7259]">
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button onClick={cancelEditing} size="sm" variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h5 className="font-medium text-[#323e48] mb-1">{meal.name}</h5>
            <p className="text-sm text-[#323e48]/70 mb-2">{meal.description}</p>
            <div className="flex gap-3 text-xs text-[#323e48]/60">
              {meal.calories && <span>{meal.calories} cal</span>}
              {meal.protein_g && <span>{meal.protein_g}g protein</span>}
              {meal.carbs_g && <span>{meal.carbs_g}g carbs</span>}
              {meal.fat_g && <span>{meal.fat_g}g fat</span>}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading && !mealPlan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#4e8f71] mx-auto mb-2" />
          <p className="text-[#323e48]/70">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (showSavedItems) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowSavedItems(false)} variant="ghost" className="text-[#4e8f71]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold text-[#323e48]">Saved Items</h2>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-[#4e8f71] mb-4">Saved Meal Plans</h3>
            {savedMealPlans.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center text-[#323e48]/60">
                No saved meal plans yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedMealPlans.map((plan) => (
                  <div key={plan.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-white/60">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#323e48] mb-1">{plan.title}</h4>
                        <p className="text-xs text-[#323e48]/60">Saved {new Date(plan.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button
                        onClick={() => toggleFavoriteMealPlan(plan.id, !plan.isFavorite)}
                        size="sm"
                        variant="ghost"
                        className="text-[#e85d75]"
                      >
                        <Heart className={`w-4 h-4 ${plan.isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => loadSavedMealPlan(plan)} size="sm" className="flex-1 bg-[#4e8f71] hover:bg-[#3d7259]">
                        Load
                      </Button>
                      <Button onClick={() => deleteSavedMealPlan(plan.id)} size="sm" variant="outline" className="text-red-600 border-red-600">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[#4e8f71] mb-4">Saved Shopping Lists</h3>
            {savedShoppingLists.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center text-[#323e48]/60">
                No saved shopping lists yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedShoppingLists.map((list) => (
                  <div key={list.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-white/60">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#323e48] mb-1">{list.title}</h4>
                        <p className="text-xs text-[#323e48]/60">Saved {new Date(list.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button
                        onClick={() => toggleFavoriteShoppingList(list.id, !list.isFavorite)}
                        size="sm"
                        variant="ghost"
                        className="text-[#e85d75]"
                      >
                        <Heart className={`w-4 h-4 ${list.isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => loadSavedShoppingList(list)} size="sm" className="flex-1 bg-[#4e8f71] hover:bg-[#3d7259]">
                        Load
                      </Button>
                      <Button onClick={() => deleteSavedShoppingList(list.id)} size="sm" variant="outline" className="text-red-600 border-red-600">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showShoppingList && shoppingList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowShoppingList(false)} variant="ghost" className="text-[#4e8f71]">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold text-[#323e48]">Shopping List</h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveShoppingList} variant="outline" className="border-[#4e8f71] text-[#4e8f71]">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => downloadShoppingList("csv")} variant="outline" className="border-[#364d89] text-[#364d89]">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => downloadShoppingList("pdf")} variant="outline" className="border-[#364d89] text-[#364d89]">
              <Download className="w-4 h-4 mr-2" />
              HTML
            </Button>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/40">
          <p className="text-sm text-[#323e48]/70 mb-6">Week of {new Date(weekStartDate).toLocaleDateString()}</p>
          
          {Object.entries(shoppingList).map(([category, items]) => (
            items.length > 0 && (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold text-[#4e8f71] mb-3 capitalize">{category}</h3>
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#4e8f71]" />
                      <span className="flex-1 text-[#323e48]">{item.item}</span>
                      <span className="text-sm text-[#323e48]/60">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" className="text-[#4e8f71]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold text-[#323e48]">Weekly Meal Plan</h2>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-12 border border-white/40 text-center">
          <Sparkles className="w-16 h-16 text-[#4e8f71] mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-[#323e48] mb-3">Create Your Weekly Meal Plan</h3>
          <p className="text-[#323e48]/70 mb-6 max-w-md mx-auto">
            Get a personalized meal plan with 3 meals and snacks for each day of the week, 
            tailored to your dietary preferences and nutrition goals.
          </p>
          <Button
            onClick={generateNewPlan}
            disabled={generating}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white px-8 py-6 text-lg"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Meal Plan
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" className="text-[#4e8f71]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Weekly Meal Plan</h2>
            <p className="text-sm text-[#323e48]/60">Week of {new Date(weekStartDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              loadSavedItems();
              setShowSavedItems(true);
            }}
            variant="outline"
            className="border-[#6656cb] text-[#6656cb]"
          >
            <List className="w-4 h-4 mr-2" />
            Saved
          </Button>
          <Button onClick={saveMealPlan} variant="outline" className="border-[#4e8f71] text-[#4e8f71]">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={() => downloadMealPlan("csv")} variant="outline" className="border-[#364d89] text-[#364d89]">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button onClick={() => downloadMealPlan("pdf")} variant="outline" className="border-[#364d89] text-[#364d89]">
            <Download className="w-4 h-4 mr-2" />
            HTML
          </Button>
          <Button
            onClick={generateShoppingList}
            disabled={loading}
            className="bg-gradient-to-r from-[#364d89] to-[#6656cb] hover:from-[#2a3d6f] hover:to-[#5545ba] text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Shopping List
          </Button>
          <Button
            onClick={generateNewPlan}
            disabled={generating}
            variant="outline"
            className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {days.map(({ key, label }) => {
          const dayPlan = mealPlan[key as keyof WeeklyMealPlan] as DayMealPlan;
          if (!dayPlan) return null;

          return (
            <div key={key} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/40">
              <h3 className="text-xl font-bold text-[#323e48] mb-4">{label}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderMealCard(key, 'breakfast', dayPlan.breakfast)}
                {renderMealCard(key, 'lunch', dayPlan.lunch)}
                {renderMealCard(key, 'dinner', dayPlan.dinner)}
              </div>

              {dayPlan.snacks && dayPlan.snacks.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-[#4e8f71] mb-2">Snacks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dayPlan.snacks.map((snack, idx) => (
                      <div key={idx} className="bg-white/70 rounded-lg p-3 border border-white/60">
                        <h5 className="font-medium text-[#323e48] text-sm mb-1">{snack.name}</h5>
                        <p className="text-xs text-[#323e48]/70 mb-1">{snack.description}</p>
                        <div className="flex gap-2 text-xs text-[#323e48]/60">
                          {snack.calories && <span>{snack.calories} cal</span>}
                          {snack.protein_g && <span>{snack.protein_g}g protein</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
