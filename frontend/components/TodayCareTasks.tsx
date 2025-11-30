import { useState, useEffect } from "react";
import { Check, Clock, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend-client";
import type { TodayTask } from "~backend/care_plans/types";

interface TodayCareTasksProps {
  userId: string;
  onNavigate?: () => void;
}

export default function TodayCareTasks({ userId, onNavigate }: TodayCareTasksProps) {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const loadTasks = async () => {
    try {
      const response = await backend.care_plans.getTodayTasks({ user_id: userId });
      setTasks(response.tasks);
      setTotalCount(response.total_count);
      setCompletedCount(response.completed_count);
    } catch (error) {
      console.error("Failed to load care tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
        <p className="text-[#323e48]/60">Loading...</p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
        <Stethoscope className="w-12 h-12 text-[#4e8f71] mx-auto mb-3" />
        <p className="text-[#323e48] mb-2">No care plan added yet</p>
        <p className="text-sm text-[#323e48]/60 mb-4">Create medications & movement plan</p>
        {onNavigate && (
          <Button onClick={onNavigate} size="sm" className="bg-[#4e8f71] text-white">
            Get Started
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#323e48]">Today's Care Tasks</h3>
        <span className="text-sm text-[#4e8f71]">
          {completedCount}/{totalCount} completed
        </span>
      </div>

      <div className="space-y-2">
        {tasks.slice(0, 3).map((task) => (
          <div
            key={task.item.id}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              task.completed
                ? "bg-[#4e8f71]/10"
                : "bg-gradient-to-r from-[#4e8f71]/5 to-[#364d89]/5"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                task.completed ? "bg-[#4e8f71] text-white" : "bg-white border-2 border-gray-300"
              }`}
            >
              {task.completed && <Check className="w-3 h-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#323e48] truncate">{task.item.label}</p>
              {task.scheduled_time && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#323e48]/60" />
                  <p className="text-xs text-[#323e48]/60">{task.scheduled_time}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {tasks.length > 3 && (
        <p className="text-sm text-[#323e48]/60 text-center">
          +{tasks.length - 3} more tasks
        </p>
      )}

      {onNavigate && (
        <Button onClick={onNavigate} variant="outline" size="sm" className="w-full">
          View All Tasks
        </Button>
      )}
    </div>
  );
}
