import { useState, useEffect } from "react";
import { TrendingUp, Target, Award, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";

export default function ProgressView() {
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const userId = localStorage.getItem("emma_user_id") || "";
      await backend.wellness_journal.analyzeTrends({ user_id: userId, days: 30 });
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">My Progress</h2>
              <p className="text-sm text-[#4e8f71]">Analytics & insights</p>
            </div>
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {analyzing ? "Analyzing..." : "Generate Insights"}
          </Button>
        </div>
        
        {lastAnalyzed && (
          <div className="mb-4 text-sm text-[#4e8f71]">
            Last analyzed: {lastAnalyzed.toLocaleString()}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#4e8f71]/10 to-[#4e8f71]/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-[#4e8f71]" />
                <h3 className="font-semibold text-[#323e48]">Daily Goals</h3>
              </div>
              <p className="text-3xl font-bold text-[#4e8f71]">8/10</p>
              <p className="text-xs text-[#323e48]/60 mt-1">Completed this week</p>
            </div>

            <div className="bg-gradient-to-br from-[#364d89]/10 to-[#364d89]/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-[#364d89]" />
                <h3 className="font-semibold text-[#323e48]">Current Streak</h3>
              </div>
              <p className="text-3xl font-bold text-[#364d89]">7 days</p>
              <p className="text-xs text-[#323e48]/60 mt-1">Keep it up!</p>
            </div>

            <div className="bg-gradient-to-br from-[#6656cb]/10 to-[#6656cb]/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#6656cb]" />
                <h3 className="font-semibold text-[#323e48]">This Month</h3>
              </div>
              <p className="text-3xl font-bold text-[#6656cb]">24/30</p>
              <p className="text-xs text-[#323e48]/60 mt-1">Check-ins completed</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Weekly Overview</h3>
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
              <div className="flex justify-between items-end h-32 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                  const heights = [80, 90, 75, 95, 85, 70, 100];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gradient-to-t from-[#4e8f71] to-[#364d89] rounded-t-lg transition-all hover:opacity-80" 
                        style={{ height: `${heights[index]}%` }}
                      />
                      <span className="text-xs text-[#323e48]/60">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Recent Achievements</h3>
            <div className="space-y-2">
              <div className="bg-white/90 rounded-2xl p-3 border border-[#4e8f71]/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4e8f71] to-[#364d89] flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#323e48]">7-Day Streak!</p>
                  <p className="text-xs text-[#323e48]/60">Completed 7 days in a row</p>
                </div>
              </div>
              
              <div className="bg-white/90 rounded-2xl p-3 border border-[#364d89]/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#364d89] to-[#6656cb] flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#323e48]">Goal Master</p>
                  <p className="text-xs text-[#323e48]/60">Hit all daily goals 5 times</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
