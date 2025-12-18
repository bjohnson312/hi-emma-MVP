import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { TodayTask } from "~backend/care_plans/types";
import { logErrorSilently } from "@/lib/silent-error-handler";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface TodayCareTasksProps {
  userId: string;
}

const TASK_TYPE_ICONS: Record<string, string> = {
  medication: "💊",
  activity: "🏃",
  measurement: "📊",
  habit: "✨"
};

export default function TodayCareTasks({ userId }: TodayCareTasksProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [userId]);

  async function loadTasks() {
    setLoading(true);
    setHasError(false);
    try {
      const response = await backend.care_plans.getTodayTasks({ user_id: userId });
      setTasks(response.tasks);
      setCompletedCount(response.completed_count);
      setTotalCount(response.total_count);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'TodayCareTasks',
        errorType: 'api_failure',
        apiEndpoint: '/care_plans/today-tasks',
        severity: 'low',
      });
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(taskId: number, currentlyCompleted: boolean) {
    if (currentlyCompleted) {
      return;
    }

    try {
      await backend.care_plans.markTaskComplete({
        user_id: userId,
        task_id: taskId
      });

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, completed: true } : task
      ));
      setCompletedCount(completedCount + 1);

      if (completedCount + 1 === totalCount) {
        toast({
          title: "🎉 All Tasks Complete!",
          description: "Great job completing your care plan today!",
        });
      }
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'TodayCareTasks',
        errorType: 'api_failure',
        apiEndpoint: '/care_plans/mark-complete',
        severity: 'low',
      });
      toast({
        title: "Unable to update task",
        description: "Please try again in a moment",
        variant: "default"
      });
    }
  }

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <EmptyState
          title="Unable to load tasks"
          description="We're having trouble loading your care tasks"
          onRetry={loadTasks}
          icon={<Clock className="h-16 w-16" />}
        />
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#323e48]">Doctor's Orders: Today's Tasks</h3>
          <p className="text-sm text-[#323e48]/60">
            {completedCount} of {totalCount} complete
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="h-2 bg-[#323e48]/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const isCompleted = task.completed;
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id!, isCompleted)}
              disabled={isCompleted}
              className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                isCompleted
                  ? "bg-green-50 cursor-default"
                  : "bg-[#f8f9fa] hover:bg-white hover:shadow-sm cursor-pointer"
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-green-500 border-green-500"
                  : "bg-white border-[#323e48]/30 group-hover:border-blue-600"
              }`}>
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <span className="text-lg mr-2">{TASK_TYPE_ICONS[task.type] || "📋"}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-[#323e48] ${isCompleted ? 'line-through opacity-60' : ''}`}>
                    {task.label}
                  </span>
                  {task.time_of_day && (
                    <span className="text-xs text-[#323e48]/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.time_of_day}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#323e48]/50">
                  {task.frequency}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <h4 className="font-bold">Excellent Work!</h4>
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-sm">You've completed all your care tasks today! 🎉</p>
        </div>
      )}
    </div>
  );
}
