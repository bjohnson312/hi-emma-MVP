import { Heart, Plus, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarePlanDashboardTileProps {
  hasPlan: boolean;
  completedCount: number;
  totalCount: number;
  upcomingTasks: Array<{ label: string; time_of_day?: string }>;
  onCreatePlan: () => void;
  onViewPlan: () => void;
}

export default function CarePlanDashboardTile({
  hasPlan,
  completedCount,
  totalCount,
  upcomingTasks,
  onCreatePlan,
  onViewPlan
}: CarePlanDashboardTileProps) {
  if (!hasPlan) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#323e48]">Care Plan</h3>
              <p className="text-sm text-[#323e48]/60">No active plan</p>
            </div>
          </div>
        </div>

        <p className="text-[#323e48]/70 mb-4">
          Create a personalized care plan to track medications, activities, and health goals.
        </p>

        <Button
          onClick={onCreatePlan}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your Care Plan
        </Button>
      </div>
    );
  }

  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div 
      onClick={onViewPlan}
      className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40 cursor-pointer hover:shadow-2xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#323e48]">Care Plan</h3>
            <p className="text-sm text-[#323e48]/60">
              {completedCount} of {totalCount} tasks complete
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
          <div className="text-xs text-[#323e48]/60">Today</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-[#323e48]/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {upcomingTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#323e48]/60 mb-2">Upcoming Tasks:</p>
          {upcomingTasks.slice(0, 2).map((task, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-[#323e48]">
              <Clock className="w-3 h-3 text-blue-600" />
              <span className="flex-1">{task.label}</span>
              {task.time_of_day && (
                <span className="text-xs text-[#323e48]/60">{task.time_of_day}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">All tasks completed!</span>
        </div>
      )}
    </div>
  );
}
