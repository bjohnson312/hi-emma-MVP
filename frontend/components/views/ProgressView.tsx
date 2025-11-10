import { useState, useEffect } from "react";
import { TrendingUp, Target, Award, Calendar, Sparkles, CheckCircle2, Circle, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import type { GetJourneySetupResponse, WellnessMilestone } from "~backend/journey/types";

export default function ProgressView() {
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [journeySetup, setJourneySetup] = useState<GetJourneySetupResponse | null>(null);
  const [milestones, setMilestones] = useState<WellnessMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  async function loadProgressData() {
    setLoading(true);
    try {
      const userId = localStorage.getItem("emma_user_id") || "";
      const [setupResult, milestonesResult] = await Promise.all([
        backend.journey.getJourneySetup({ user_id: userId }),
        backend.journey.getMilestones({ user_id: userId, limit: 20 })
      ]);

      setJourneySetup(setupResult);
      setMilestones(milestonesResult.milestones);
    } catch (error) {
      console.error("Failed to load progress data:", error);
    } finally {
      setLoading(false);
    }
  }

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

  const setupSections = [
    {
      key: 'wellness_journal_setup',
      label: 'Wellness Journal',
      description: 'Track your health journey',
      icon: '📖',
      color: 'from-green-500 to-green-600'
    },
    {
      key: 'wellness_journal_chapter_created',
      label: 'Wellness Chapter',
      description: 'Create your first goal chapter',
      icon: '📚',
      color: 'from-teal-500 to-teal-600'
    },
    {
      key: 'morning_routine_completed',
      label: 'Morning Routine',
      description: 'Start your day with Emma',
      icon: '🌅',
      color: 'from-orange-500 to-orange-600'
    },
    {
      key: 'evening_routine_completed',
      label: 'Evening Routine',
      description: 'Wind down before bed',
      icon: '🌙',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      key: 'diet_nutrition_setup',
      label: 'Diet & Nutrition',
      description: 'Track meals and nutrition',
      icon: '🥗',
      color: 'from-lime-500 to-lime-600'
    },
    {
      key: 'doctors_orders_added',
      label: "Doctor's Orders",
      description: 'Add medical guidance',
      icon: '💊',
      color: 'from-red-500 to-red-600'
    },
    {
      key: 'care_team_added',
      label: 'Care Team',
      description: 'Connect with your providers',
      icon: '👥',
      color: 'from-pink-500 to-pink-600'
    },
    {
      key: 'notifications_configured',
      label: 'Notifications',
      description: 'Stay on track with reminders',
      icon: '🔔',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      key: 'user_profile_completed',
      label: 'User Profile',
      description: 'Complete your information',
      icon: '👤',
      color: 'from-purple-500 to-purple-600'
    },
    {
      key: 'first_conversation',
      label: 'First Conversation',
      description: 'Chat with Emma',
      icon: '💬',
      color: 'from-blue-500 to-blue-600'
    }
  ];

  function getBadgeColorClass(color?: string) {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'orange': return 'from-orange-500 to-orange-600';
      case 'indigo': return 'from-indigo-500 to-indigo-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'teal': return 'from-teal-500 to-teal-600';
      case 'lime': return 'from-lime-500 to-lime-600';
      case 'pink': return 'from-pink-500 to-pink-600';
      case 'yellow': return 'from-yellow-500 to-yellow-600';
      case 'red': return 'from-red-500 to-red-600';
      case 'gold': return 'from-yellow-400 to-yellow-500';
      default: return 'from-[#4e8f71] to-[#364d89]';
    }
  }

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

        {journeySetup && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#323e48]">Wellness Journey Setup</h3>
                    <p className="text-sm text-[#323e48]/70">
                      {journeySetup.completion_percentage === 100 
                        ? "🎉 You've completed your wellness journey setup!" 
                        : `${journeySetup.setup_steps_completed} of ${journeySetup.total_setup_steps} steps completed`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{journeySetup.completion_percentage}%</div>
                  <div className="text-xs text-[#323e48]/60">Complete</div>
                </div>
              </div>

              <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${journeySetup.completion_percentage}%` }}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {setupSections.map((section) => {
                  const isComplete = journeySetup.setup && (journeySetup.setup as any)[section.key] === true;
                  return (
                    <div
                      key={section.key}
                      className={`rounded-xl p-4 border-2 transition-all ${
                        isComplete
                          ? "bg-white/90 border-green-200"
                          : "bg-white/60 border-[#323e48]/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-xl">{section.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-[#323e48] text-sm truncate">{section.label}</h4>
                            {isComplete ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#323e48]/20 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#323e48]/60">{section.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {milestones.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#4e8f71]" />
              <h3 className="font-bold text-[#323e48] text-lg">Milestones & Achievements</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="bg-white/90 rounded-2xl p-4 border border-[#323e48]/10 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getBadgeColorClass(milestone.badge_color)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl">{milestone.badge_icon || '🏅'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#323e48] mb-1">{milestone.milestone_name}</h4>
                      <p className="text-xs text-[#323e48]/70 mb-2">{milestone.milestone_description}</p>
                      <p className="text-xs text-[#323e48]/50">
                        {new Date(milestone.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#4e8f71]/10 to-[#4e8f71]/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-[#4e8f71]" />
                <h3 className="font-semibold text-[#323e48]">Setup Progress</h3>
              </div>
              <p className="text-3xl font-bold text-[#4e8f71]">
                {journeySetup?.setup_steps_completed || 0}/{journeySetup?.total_setup_steps || 10}
              </p>
              <p className="text-xs text-[#323e48]/60 mt-1">Steps completed</p>
            </div>

            <div className="bg-gradient-to-br from-[#364d89]/10 to-[#364d89]/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-[#364d89]" />
                <h3 className="font-semibold text-[#323e48]">Milestones</h3>
              </div>
              <p className="text-3xl font-bold text-[#364d89]">{milestones.length}</p>
              <p className="text-xs text-[#323e48]/60 mt-1">Achievements earned</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-[#323e48]">Journey Status</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {journeySetup?.completion_percentage || 0}%
              </p>
              <p className="text-xs text-[#323e48]/60 mt-1">Overall completion</p>
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
        </div>
      </div>
    </div>
  );
}
