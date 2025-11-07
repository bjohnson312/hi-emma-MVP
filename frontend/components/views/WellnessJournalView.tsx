import { useState, useEffect } from "react";
import { BookOpen, Calendar, Sparkles, TrendingUp, Heart, Filter, RefreshCw, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import backend from "~backend/client";
import type { WellnessJournalEntry, JournalStats } from "~backend/wellness_journal/types";
import { useToast } from "@/components/ui/use-toast";

interface WellnessJournalViewProps {
  userId: string;
}

export default function WellnessJournalView({ userId }: WellnessJournalViewProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WellnessJournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "daily_summary" | "event" | "insight">("all");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", tags: "" });
  const [addingEntry, setAddingEntry] = useState(false);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);

  useEffect(() => {
    loadJournalData();
  }, [filter]);

  async function loadJournalData() {
    setLoading(true);
    try {
      const [entriesResult, statsResult] = await Promise.all([
        backend.wellness_journal.getJournalEntries({
          user_id: userId,
          entry_type: filter === "all" ? undefined : filter,
          limit: 100
        }),
        backend.wellness_journal.getJournalStats({
          user_id: userId
        })
      ]);

      setEntries(entriesResult.entries);
      setStats(statsResult);
    } catch (error) {
      console.error("Failed to load journal:", error);
      toast({
        title: "Error",
        description: "Failed to load wellness journal.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDailySummary() {
    setGeneratingSummary(true);
    try {
      await backend.wellness_journal.generateDailySummary({
        user_id: userId,
        date: new Date()
      });

      toast({
        title: "Daily Summary Generated",
        description: "Your wellness summary for today has been created.",
      });

      await loadJournalData();
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate daily summary.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function handleAddManualEntry() {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both a title and content for your entry.",
        variant: "destructive"
      });
      return;
    }

    setAddingEntry(true);
    try {
      const tags = newEntry.tags.split(",").map(t => t.trim()).filter(t => t);
      
      await backend.wellness_journal.addManualEntry({
        user_id: userId,
        entry_type: "event",
        title: newEntry.title,
        content: newEntry.content,
        tags: tags.length > 0 ? tags : undefined
      });

      toast({
        title: "Entry Added",
        description: "Your wellness journal entry has been created.",
      });

      setShowAddEntry(false);
      setNewEntry({ title: "", content: "", tags: "" });
      await loadJournalData();
    } catch (error) {
      console.error("Failed to add entry:", error);
      toast({
        title: "Error",
        description: "Failed to create journal entry.",
        variant: "destructive"
      });
    } finally {
      setAddingEntry(false);
    }
  }

  async function handleAnalyzeTrends() {
    setAnalyzingTrends(true);
    try {
      const analysis = await backend.wellness_journal.analyzeTrends({
        user_id: userId,
        days: 30
      });

      let message = `Analyzed ${analysis.insights_generated} trends. `;
      if (analysis.sleep_trend) {
        message += `Sleep: ${analysis.sleep_trend.pattern}. `;
      }
      if (analysis.mood_trend) {
        message += `Mood trending ${analysis.mood_trend.improving ? "up" : "stable"}. `;
      }

      toast({
        title: "Trend Analysis Complete",
        description: message,
      });

      await loadJournalData();
    } catch (error) {
      console.error("Failed to analyze trends:", error);
      toast({
        title: "Error",
        description: "Failed to analyze wellness trends.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingTrends(false);
    }
  }

  function groupEntriesByDate(entries: WellnessJournalEntry[]): Map<string, WellnessJournalEntry[]> {
    const grouped = new Map<string, WellnessJournalEntry[]>();
    
    entries.forEach(entry => {
      const dateKey = new Date(entry.entry_date).toLocaleDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    });

    return grouped;
  }

  const groupedEntries = groupEntriesByDate(entries);

  function getEntryIcon(entryType: string) {
    switch (entryType) {
      case "daily_summary":
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case "insight":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case "milestone":
        return <Heart className="w-5 h-5 text-pink-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-[#4e8f71]" />;
    }
  }

  function getEntryColor(entryType: string) {
    switch (entryType) {
      case "daily_summary":
        return "from-purple-50 to-purple-100 border-purple-200";
      case "insight":
        return "from-blue-50 to-blue-100 border-blue-200";
      case "milestone":
        return "from-pink-50 to-pink-100 border-pink-200";
      default:
        return "from-[#4e8f71]/10 to-[#364d89]/10 border-[#4e8f71]/20";
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Wellness Journal</h2>
              <p className="text-sm text-[#4e8f71]">Your ongoing health story</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowAddEntry(!showAddEntry)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <Button
              onClick={handleAnalyzeTrends}
              disabled={analyzingTrends}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {analyzingTrends ? "Analyzing..." : "Analyze Trends"}
            </Button>
            <Button
              onClick={handleGenerateDailySummary}
              disabled={generatingSummary}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingSummary ? "Generating..." : "Generate Summary"}
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-[#4e8f71]" />
                <span className="text-xs text-[#323e48]/60">Total Entries</span>
              </div>
              <p className="text-2xl font-bold text-[#4e8f71]">{stats.total_entries}</p>
            </div>

            <div className="bg-white/90 border border-[#364d89]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#364d89]" />
                <span className="text-xs text-[#323e48]/60">Streak</span>
              </div>
              <p className="text-2xl font-bold text-[#364d89]">{stats.streak_days} days</p>
            </div>

            {stats.avg_mood_rating && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-[#323e48]/60">Avg Mood</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats.avg_mood_rating}/10</p>
              </div>
            )}

            {stats.avg_energy_level && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-[#323e48]/60">Avg Energy</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{stats.avg_energy_level}/5</p>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-[#323e48]/60">Insights</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.entries_by_type.insight || 0}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-[#323e48]/60" />
          <span className="text-sm text-[#323e48]/60">Filter:</span>
          {["all", "daily_summary", "event", "insight"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                  : "bg-white/90 text-[#323e48]/60 hover:bg-[#4e8f71]/10"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {showAddEntry && (
          <div className="mt-6 bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 border border-[#4e8f71]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#323e48] text-lg">Add Manual Entry</h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-[#323e48]/60 hover:text-[#323e48] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#323e48] mb-1 block">Title</label>
                <Input
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="What happened today?"
                  className="bg-white/90 border-[#4e8f71]/20"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#323e48] mb-1 block">Content</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="Describe your experience, feelings, or observations..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/90 border border-[#4e8f71]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#323e48] mb-1 block">Tags (comma-separated)</label>
                <Input
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                  placeholder="wellness, personal, reflection"
                  className="bg-white/90 border-[#4e8f71]/20"
                />
              </div>
              
              <Button
                onClick={handleAddManualEntry}
                disabled={addingEntry}
                className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
              >
                {addingEntry ? "Adding Entry..." : "Add Entry"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <RefreshCw className="w-8 h-8 text-[#4e8f71] animate-spin mx-auto mb-4" />
          <p className="text-[#323e48]/60">Loading your wellness journal...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <BookOpen className="w-16 h-16 text-[#323e48]/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#323e48] mb-2">No Journal Entries Yet</h3>
          <p className="text-[#323e48]/60 mb-6">
            Your wellness journal will automatically populate as you use the app.
          </p>
          <Button
            onClick={handleGenerateDailySummary}
            disabled={generatingSummary}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Your First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedEntries.entries()).map(([date, dateEntries]) => (
            <div key={date} className="relative">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 mb-4 shadow-md border border-white/40 inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4e8f71]" />
                <span className="font-semibold text-[#323e48]">{date}</span>
                <span className="text-xs text-[#323e48]/60">({dateEntries.length} {dateEntries.length === 1 ? "entry" : "entries"})</span>
              </div>

              <div className="space-y-4 pl-6 border-l-2 border-[#4e8f71]/30">
                {dateEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`bg-gradient-to-r ${getEntryColor(entry.entry_type)} rounded-2xl p-5 shadow-md border relative -ml-6`}
                  >
                    <div className="absolute -left-3 top-6 bg-white rounded-full p-1.5 border-2 border-[#4e8f71]/30 shadow-md">
                      {getEntryIcon(entry.entry_type)}
                    </div>

                    <div className="ml-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-[#323e48] mb-1">{entry.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-[#323e48]/80"
                              >
                                {tag}
                              </span>
                            ))}
                            {entry.ai_generated && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Generated
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-[#323e48]/60 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-[#323e48] whitespace-pre-wrap">{entry.content}</p>

                      {(entry.mood_rating || entry.energy_level || entry.sleep_quality) && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/40">
                          {entry.mood_rating && (
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-[#323e48]">Mood: {entry.mood_rating}/10</span>
                            </div>
                          )}
                          {entry.energy_level && (
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-[#323e48]">Energy: {entry.energy_level}/5</span>
                            </div>
                          )}
                          {entry.sleep_quality && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#323e48]">Sleep: {entry.sleep_quality}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
