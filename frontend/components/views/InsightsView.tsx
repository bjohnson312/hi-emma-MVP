import { useState, useEffect } from "react";
import backend from "@/lib/backend-client";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, CheckCircle, Award, Lightbulb } from "lucide-react";
import { logErrorSilently } from "@/lib/silent-error-handler";

interface UserInsight {
  id: number;
  insight_type: string;
  insight_category: string;
  title: string;
  description: string;
  recommendations: string[];
  data_points: Record<string, any>;
  generated_at: Date;
  acknowledged: boolean;
}

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  action?: string;
  priority: "high" | "medium" | "low";
  reasoning: string;
}

export function InsightsView() {
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  useEffect(() => {
    loadData();
  }, [showAcknowledged]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("emma_user_id") || "";
      const [insightsRes, recsRes] = await Promise.all([
        backend.profile.getInsights({ 
          user_id: userId,
          limit: 20,
          acknowledged: showAcknowledged ? undefined : false
        }),
        backend.profile.getRecommendations({ user_id: userId })
      ]);
      
      setInsights(insightsRes.insights);
      setRecommendations(recsRes.recommendations);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'InsightsView',
        errorType: 'api_failure',
        severity: 'low',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (insightId: number) => {
    try {
      const userId = localStorage.getItem("emma_user_id") || "";
      await backend.profile.acknowledgeInsight({ user_id: userId, insight_id: insightId });
      await loadData();
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'InsightsView',
        errorType: 'api_failure',
        apiEndpoint: '/profile/acknowledge-insight',
        severity: 'low',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
      case "medium": return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30";
      case "low": return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30";
      default: return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "sleep": return "🌙";
      case "wellness": return "✨";
      case "achievement": return "🏆";
      case "planning": return "🎯";
      default: return "💡";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Your Wellness Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalized insights based on your wellness journey
          </p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            Personalized Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                      <h3 className="font-semibold text-foreground">{rec.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <p className="text-xs text-muted-foreground italic">{rec.reasoning}</p>
                  </div>
                  {rec.action && (
                    <Button size="sm" className="shrink-0">
                      {rec.action}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Recent Insights
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAcknowledged(!showAcknowledged)}
        >
          {showAcknowledged ? "Hide Acknowledged" : "Show All"}
        </Button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {showAcknowledged 
              ? "No insights yet. Keep using the app to build your wellness data!"
              : "All caught up! You've seen all your new insights."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`bg-white dark:bg-gray-900 rounded-lg p-6 border transition-all ${
                insight.acknowledged
                  ? "border-gray-200 dark:border-gray-700 opacity-60"
                  : "border-purple-200 dark:border-purple-800 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {insight.insight_category === "achievement" && <Award className="w-5 h-5 text-yellow-500" />}
                    {insight.insight_category === "wellness" && <Sparkles className="w-5 h-5 text-purple-500" />}
                    {insight.insight_category === "trend" && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    <h3 className="font-semibold text-foreground text-lg">{insight.title}</h3>
                    {insight.acknowledged && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{insight.description}</p>
                  
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-sm text-foreground mb-2">💡 Recommendations:</h4>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(insight.generated_at).toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                
                {!insight.acknowledged && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcknowledge(insight.id)}
                    className="shrink-0"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Got it
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
