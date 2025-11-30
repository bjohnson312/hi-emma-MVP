import { Activity, TrendingUp, Target, Calendar } from "lucide-react";

export default function StayActiveTab() {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Activity className="w-7 h-7 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#323e48]">Stay Active</h2>
          <p className="text-sm text-[#323e48]/60">Movement and exercise tracking</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-200/50">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-[#323e48] mb-3">
            Coming Soon: Movement & Exercise Tracking
          </h3>
          
          <p className="text-[#323e48]/70 mb-6 max-w-md mx-auto">
            We're building comprehensive activity tracking to help you stay active and reach your fitness goals.
          </p>

          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/90 rounded-xl p-4 border border-orange-200/50">
              <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-[#323e48] mb-1">Activity Tracking</h4>
              <p className="text-xs text-[#323e48]/60">
                Log steps, workouts, and daily movement
              </p>
            </div>

            <div className="bg-white/90 rounded-xl p-4 border border-orange-200/50">
              <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-[#323e48] mb-1">Set Goals</h4>
              <p className="text-xs text-[#323e48]/60">
                Create and track fitness milestones
              </p>
            </div>

            <div className="bg-white/90 rounded-xl p-4 border border-orange-200/50">
              <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-[#323e48] mb-1">Progress History</h4>
              <p className="text-xs text-[#323e48]/60">
                View your activity trends over time
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-[#323e48]/80 text-center">
          💡 <strong>Tip:</strong> You can already track activities in your Care Plan above! Add walking, stretching, or other movement as daily tasks.
        </p>
      </div>
    </div>
  );
}
