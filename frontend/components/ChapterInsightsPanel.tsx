import { useState } from "react";
import { Sparkles, TrendingUp, Flame, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend-client";
import type { ChapterInsight } from "~backend/wellness_journal/types";
import { useToast } from "@/components/ui/use-toast";

interface ChapterInsightsPanelProps {
  chapterId: number;
  userId: string;
  chapterTitle: string;
}

export default function ChapterInsightsPanel({ chapterId, userId, chapterTitle }: ChapterInsightsPanelProps) {
  const { toast } = useToast();
  const [insights, setInsights] = useState<ChapterInsight[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  async function handleGenerateInsights() {
    setLoading(true);
    try {
      const result = await backend.wellness_journal.generateChapterInsights({
        chapter_id: chapterId,
        user_id: userId,
        days: 30
      });

      setInsights(result.insights);
      setSummary(result.summary);
      setHasGenerated(true);

      if (result.insights.length > 0) {
        toast({
          title: "Insights Generated",
          description: `Found ${result.insights.length} insight${result.insights.length !== 1 ? 's' : ''} about your progress!`,
        });
      } else {
        toast({
          title: "Keep Going!",
          description: "Track more habits to unlock personalized insights.",
        });
      }
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate chapter insights.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function getInsightIcon(metricType: string) {
    switch (metricType) {
      case "streak":
        return <Flame className="w-5 h-5 text-orange-600" />;
      case "mood_trend":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case "completion_rate":
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-[#4e8f71]" />;
    }
  }

  function getInsightColor(metricType: string) {
    switch (metricType) {
      case "streak":
        return "from-orange-50 to-orange-100 border-orange-200";
      case "mood_trend":
        return "from-blue-50 to-blue-100 border-blue-200";
      case "completion_rate":
        return "from-purple-50 to-purple-100 border-purple-200";
      default:
        return "from-[#4e8f71]/10 to-[#364d89]/10 border-[#4e8f71]/20";
    }
  }

  if (!hasGenerated) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-[#323e48] mb-2">Generate Chapter Insights</h3>
        <p className="text-[#323e48]/70 mb-6">
          Let Emma analyze your progress in "{chapterTitle}" and discover patterns in your wellness journey.
        </p>
        <Button
          onClick={handleGenerateInsights}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Your Progress...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-blue-100 border border-purple-200 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold text-[#323e48]">Emma's Insights</h3>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={loading}
            variant="outline"
            className="border-purple-300"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-[#323e48]/80">{summary}</p>
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${getInsightColor(insight.metric_type)} rounded-2xl p-5 border`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getInsightIcon(insight.metric_type)}
                </div>
                <div className="flex-1">
                  <p className="text-[#323e48] font-medium">{insight.insight_text}</p>
                  <p className="text-xs text-[#323e48]/60 mt-2">
                    {new Date(insight.generated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {insights.length === 0 && hasGenerated && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-md border border-white/40 text-center">
          <p className="text-[#323e48]/70">
            No insights yet. Keep tracking your habits to unlock personalized feedback from Emma!
          </p>
        </div>
      )}
    </div>
  );
}
