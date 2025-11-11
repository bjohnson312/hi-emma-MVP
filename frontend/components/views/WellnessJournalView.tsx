import { useState, useEffect } from "react";
import { BookOpen, Calendar, Sparkles, TrendingUp, Heart, Filter, RefreshCw, Plus, X, ChevronRight, Target, CheckCircle2, List, BookMarked, Rocket, AlertCircle, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import backend from "~backend/client";
import type { WellnessJournalEntry, JournalStats, WellnessChapter, WellnessSection } from "~backend/wellness_journal/types";
import type { GetJourneySetupResponse } from "~backend/journey/types";
import { useToast } from "@/components/ui/use-toast";
import WellnessJournalOnboarding from "../WellnessJournalOnboarding";
import ChapterInsightsPanel from "../ChapterInsightsPanel";

interface WellnessJournalViewProps {
  userId: string;
  onNavigate?: (view: string) => void;
}

type ViewMode = "journal" | "chapters";

export default function WellnessJournalView({ userId, onNavigate }: WellnessJournalViewProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("journal");
  const [chapters, setChapters] = useState<(WellnessChapter & { section_count?: number; progress_percentage?: number })[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterDetails, setChapterDetails] = useState<{
    chapter: WellnessChapter;
    sections: (WellnessSection & { completion_count?: number; completion_percentage?: number })[];
    recent_entries: WellnessJournalEntry[];
    progress_percentage: number;
  } | null>(null);
  const [entries, setEntries] = useState<WellnessJournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filter, setFilter] = useState<"all" | "daily_summary" | "event" | "insight">("all");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", tags: "" });
  const [addingEntry, setAddingEntry] = useState(false);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [journeySetup, setJourneySetup] = useState<GetJourneySetupResponse | null>(null);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [editingChapter, setEditingChapter] = useState<WellnessChapter | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<number | null>(null);
  const [chapterMenuOpen, setChapterMenuOpen] = useState<number | null>(null);

  useEffect(() => {
    loadJournalData();
  }, [filter]);

  useEffect(() => {
    if (selectedChapter && viewMode === "chapters") {
      loadChapterDetails(selectedChapter);
    }
  }, [selectedChapter, viewMode]);

  async function loadJournalData() {
    setLoading(true);
    try {
      const [chaptersResult, statsResult, entriesResult, setupResult] = await Promise.all([
        backend.wellness_journal.getChapters({
          user_id: userId,
          include_completed: false
        }),
        backend.wellness_journal.getJournalStats({
          user_id: userId
        }),
        backend.wellness_journal.getJournalEntries({
          user_id: userId,
          entry_type: filter === "all" ? undefined : filter,
          limit: 100
        }),
        backend.journey.getJourneySetup({
          user_id: userId
        })
      ]);

      setChapters(chaptersResult.chapters);
      setStats(statsResult);
      setEntries(entriesResult.entries);
      setJourneySetup(setupResult);

      if (setupResult.completion_percentage < 100) {
        setShowSetupBanner(true);
      }

      if (chaptersResult.chapters.length === 0 && viewMode === "chapters") {
        setShowOnboarding(true);
      } else if (!selectedChapter && chaptersResult.chapters.length > 0 && viewMode === "chapters") {
        setSelectedChapter(chaptersResult.chapters[0].id);
      }
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

  async function loadChapterDetails(chapterId: number) {
    try {
      const details = await backend.wellness_journal.getChapterDetails({
        chapter_id: chapterId,
        user_id: userId
      });
      setChapterDetails(details);
    } catch (error) {
      console.error("Failed to load chapter details:", error);
      toast({
        title: "Error",
        description: "Failed to load chapter details.",
        variant: "destructive"
      });
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

  async function handleToggleSectionLog(sectionId: number, completed: boolean) {
    try {
      await backend.wellness_journal.logSectionCompletion({
        section_id: sectionId,
        user_id: userId,
        completed
      });

      if (selectedChapter) {
        await loadChapterDetails(selectedChapter);
      }
    } catch (error) {
      console.error("Failed to log section:", error);
      toast({
        title: "Error",
        description: "Failed to update habit tracking.",
        variant: "destructive"
      });
    }
  }

  async function handleEditChapter(chapter: WellnessChapter) {
    setEditingChapter(chapter);
    setChapterMenuOpen(null);
  }

  async function handleUpdateChapter() {
    if (!editingChapter) return;

    try {
      await backend.wellness_journal.updateChapter({
        chapter_id: editingChapter.id,
        user_id: userId,
        title: editingChapter.title,
        description: editingChapter.description,
        motivation: editingChapter.motivation,
        target_outcome: editingChapter.target_outcome,
        completion_vision: editingChapter.completion_vision
      });

      toast({
        title: "Chapter Updated",
        description: "Your chapter has been updated successfully.",
      });

      setEditingChapter(null);
      await loadJournalData();
      
      if (selectedChapter === editingChapter.id) {
        await loadChapterDetails(editingChapter.id);
      }
    } catch (error) {
      console.error("Failed to update chapter:", error);
      toast({
        title: "Error",
        description: "Failed to update chapter.",
        variant: "destructive"
      });
    }
  }

  async function handleDeleteChapter(chapterId: number) {
    try {
      await backend.wellness_journal.updateChapter({
        chapter_id: chapterId,
        user_id: userId,
        is_active: false
      });

      toast({
        title: "Chapter Deleted",
        description: "Your chapter has been removed.",
      });

      setDeletingChapterId(null);
      setChapterMenuOpen(null);
      
      if (selectedChapter === chapterId) {
        setSelectedChapter(null);
        setChapterDetails(null);
      }
      
      await loadJournalData();
    } catch (error) {
      console.error("Failed to delete chapter:", error);
      toast({
        title: "Error",
        description: "Failed to delete chapter.",
        variant: "destructive"
      });
    }
  }

  async function handleMarkChapterComplete(chapterId: number) {
    try {
      await backend.wellness_journal.updateChapter({
        chapter_id: chapterId,
        user_id: userId,
        is_completed: true
      });

      toast({
        title: "🎉 Chapter Completed!",
        description: "Congratulations on completing this chapter of your wellness journey!",
      });

      setChapterMenuOpen(null);
      await loadJournalData();
      
      if (selectedChapter === chapterId) {
        await loadChapterDetails(chapterId);
      }
    } catch (error) {
      console.error("Failed to complete chapter:", error);
      toast({
        title: "Error",
        description: "Failed to mark chapter as complete.",
        variant: "destructive"
      });
    }
  }

  function navigateToIncompleteStep() {
    if (!journeySetup || !onNavigate) return;

    const setup = journeySetup.setup;

    if (!setup.first_conversation) {
      onNavigate("home");
    } else if (!setup.user_profile_completed) {
      onNavigate("settings");
    } else if (!setup.wellness_journal_setup || !setup.wellness_journal_chapter_created) {
      setViewMode("chapters");
      setShowOnboarding(true);
    } else if (!setup.morning_routine_completed) {
      onNavigate("morning-routine");
    } else if (!setup.evening_routine_completed) {
      onNavigate("evening-routine");
    } else if (!setup.diet_nutrition_setup) {
      onNavigate("diet-nutrition");
    } else if (!setup.doctors_orders_added) {
      onNavigate("doctors-orders");
    } else if (!setup.care_team_added) {
      onNavigate("care-team");
    } else if (!setup.notifications_configured) {
      onNavigate("notifications");
    }
  }

  function getChapterBadge(entry: WellnessJournalEntry) {
    if (!entry.chapter_id) return null;
    
    const chapter = chapters.find(c => c.id === entry.chapter_id);
    if (!chapter) return null;

    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#4e8f71]/20 text-[#4e8f71] border border-[#4e8f71]/30">
        📚 {chapter.title}
      </span>
    );
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

  const groupedEntries = groupEntriesByDate(viewMode === "chapters" && chapterDetails ? chapterDetails.recent_entries : entries);

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

  if (showOnboarding && viewMode === "chapters") {
    return (
      <WellnessJournalOnboarding 
        userId={userId} 
        onComplete={async () => {
          setShowOnboarding(false);
          await backend.journey.updateJourneySetup({
            user_id: userId,
            wellness_journal_chapter_created: true
          });
          loadJournalData();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {showSetupBanner && journeySetup && journeySetup.completion_percentage < 100 && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl p-6 shadow-xl border border-white/40 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Start Your Wellness Journey</h3>
                  <p className="text-sm text-white/90">
                    Complete your profile to unlock Emma's full potential
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Setup Progress</span>
                  <span className="text-sm font-bold">{journeySetup.completion_percentage}% Complete</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${journeySetup.completion_percentage}%` }}
                  />
                </div>
              </div>

              {journeySetup.incomplete_steps.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Still to complete:</p>
                  <div className="flex flex-wrap gap-2">
                    {journeySetup.incomplete_steps.slice(0, 5).map((step, index) => (
                      <span key={index} className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                        {step}
                      </span>
                    ))}
                    {journeySetup.incomplete_steps.length > 5 && (
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                        +{journeySetup.incomplete_steps.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={navigateToIncompleteStep}
                  className="bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Continue Setup
                </Button>
                <Button
                  onClick={() => setShowSetupBanner(false)}
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  Remind Me Later
                </Button>
              </div>
            </div>

            <button
              onClick={() => setShowSetupBanner(false)}
              className="text-white/60 hover:text-white transition-colors ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
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
            <div className="flex bg-white/90 rounded-xl border border-[#323e48]/10 p-1">
              <button
                onClick={() => setViewMode("journal")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "journal"
                    ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white shadow-md"
                    : "text-[#323e48]/60 hover:text-[#323e48]"
                }`}
              >
                <List className="w-4 h-4" />
                Journal
              </button>
              <button
                onClick={() => {
                  setViewMode("chapters");
                  if (chapters.length === 0) {
                    setShowOnboarding(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "chapters"
                    ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white shadow-md"
                    : "text-[#323e48]/60 hover:text-[#323e48]"
                }`}
              >
                <BookMarked className="w-4 h-4" />
                Chapters
              </button>
            </div>
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

            {viewMode === "chapters" && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-[#323e48]/60">Active Chapters</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{chapters.length}</p>
              </div>
            )}

            {stats.avg_mood_rating && (
              <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span className="text-xs text-[#323e48]/60">Avg Mood</span>
                </div>
                <p className="text-2xl font-bold text-pink-600">{stats.avg_mood_rating}/10</p>
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

        {viewMode === "journal" && (
          <>
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
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

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowAddEntry(!showAddEntry)}
                  className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
                <Button
                  onClick={handleAnalyzeTrends}
                  disabled={analyzingTrends}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {analyzingTrends ? "Analyzing..." : "Analyze Trends"}
                </Button>
                <Button
                  onClick={handleGenerateDailySummary}
                  disabled={generatingSummary}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatingSummary ? "Generating..." : "Generate Summary"}
                </Button>
              </div>
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
          </>
        )}

        {viewMode === "chapters" && chapters.length > 0 && (
          <>
            {editingChapter ? (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#323e48]">Edit Chapter</h3>
                  <button
                    onClick={() => setEditingChapter(null)}
                    className="text-[#323e48]/60 hover:text-[#323e48] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#323e48] mb-1 block">Chapter Title</label>
                    <Input
                      value={editingChapter.title}
                      onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                      placeholder="Lower Stress and Anxiety"
                      className="bg-white/90 border-[#4e8f71]/20"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#323e48] mb-1 block">Description</label>
                    <textarea
                      value={editingChapter.description || ""}
                      onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                      placeholder="Develop coping strategies and find moments of calm"
                      rows={2}
                      className="w-full px-3 py-2 bg-white/90 border border-[#4e8f71]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#323e48] mb-1 block">Your Motivation</label>
                    <textarea
                      value={editingChapter.motivation || ""}
                      onChange={(e) => setEditingChapter({ ...editingChapter, motivation: e.target.value })}
                      placeholder="Why is this important to you?"
                      rows={2}
                      className="w-full px-3 py-2 bg-white/90 border border-[#4e8f71]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#323e48] mb-1 block">Target Outcome</label>
                    <Input
                      value={editingChapter.target_outcome || ""}
                      onChange={(e) => setEditingChapter({ ...editingChapter, target_outcome: e.target.value })}
                      placeholder="What do you want to achieve?"
                      className="bg-white/90 border-[#4e8f71]/20"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#323e48] mb-1 block">Completion Vision</label>
                    <textarea
                      value={editingChapter.completion_vision || ""}
                      onChange={(e) => setEditingChapter({ ...editingChapter, completion_vision: e.target.value })}
                      placeholder="How will you feel when you complete this chapter?"
                      rows={2}
                      className="w-full px-3 py-2 bg-white/90 border border-[#4e8f71]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleUpdateChapter}
                      className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setEditingChapter(null)}
                      variant="outline"
                      className="border-[#323e48]/20"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-bold text-[#323e48] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#4e8f71]" />
                    Your Chapters
                  </h3>
                  <Button
                    onClick={() => setShowOnboarding(true)}
                    className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chapter
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="relative">
                      <button
                        onClick={() => setSelectedChapter(chapter.id)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                          selectedChapter === chapter.id
                            ? "border-[#4e8f71] bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 shadow-lg"
                            : "border-[#323e48]/10 bg-white/90 hover:border-[#4e8f71]/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-[#323e48] pr-8">{chapter.title}</h4>
                          <div className="flex items-center gap-1">
                            <ChevronRight className={`w-5 h-5 text-[#4e8f71] transition-transform ${selectedChapter === chapter.id ? "rotate-90" : ""}`} />
                          </div>
                        </div>
                        <p className="text-sm text-[#323e48]/70 mb-3">{chapter.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#323e48]/60">{chapter.section_count || 0} habits</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-[#323e48]/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89]"
                                style={{ width: `${chapter.progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#4e8f71]">{Math.round(chapter.progress_percentage || 0)}%</span>
                          </div>
                        </div>
                      </button>
                      
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChapterMenuOpen(chapterMenuOpen === chapter.id ? null : chapter.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white border border-[#323e48]/10 flex items-center justify-center transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-[#323e48]/60" />
                        </button>
                        
                        {chapterMenuOpen === chapter.id && (
                          <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-[#323e48]/10 py-2 z-10">
                            <button
                              onClick={() => handleEditChapter(chapter)}
                              className="w-full px-4 py-2 text-left text-sm text-[#323e48] hover:bg-[#4e8f71]/10 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Chapter
                            </button>
                            <button
                              onClick={() => handleMarkChapterComplete(chapter.id)}
                              className="w-full px-4 py-2 text-left text-sm text-[#4e8f71] hover:bg-[#4e8f71]/10 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark Complete
                            </button>
                            <button
                              onClick={() => setDeletingChapterId(chapter.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Chapter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {viewMode === "chapters" && chapterDetails && selectedChapter && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-[#323e48] mb-1">{chapterDetails.chapter.title}</h3>
                <p className="text-[#323e48]/70">{chapterDetails.chapter.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#4e8f71] mb-1">{chapterDetails.progress_percentage}%</div>
                <div className="text-xs text-[#323e48]/60">Progress</div>
              </div>
            </div>

            {chapterDetails.chapter.motivation && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Heart className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#323e48] text-sm mb-1">Your Motivation</h4>
                    <p className="text-sm text-[#323e48]/80">{chapterDetails.chapter.motivation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-[#323e48] mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4e8f71]" />
              Habits & Routines
            </h4>
            <div className="space-y-3">
              {chapterDetails.sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-white/90 border border-[#323e48]/10 rounded-xl p-4 hover:border-[#4e8f71]/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleSectionLog(section.id, true)}
                        className="mt-0.5"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#4e8f71]" />
                      </button>
                      <div className="flex-1">
                        <h5 className="font-bold text-[#323e48] mb-1">{section.title}</h5>
                        <p className="text-sm text-[#323e48]/70 mb-2">{section.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-[#323e48]/60">
                            {section.tracking_frequency}
                          </span>
                          {section.target_count && (
                            <span className="text-xs text-[#323e48]/60">
                              {section.completion_count || 0}/{section.target_count} completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {section.completion_percentage !== undefined && (
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-[#4e8f71]">{Math.round(section.completion_percentage)}%</div>
                        <div className="h-1.5 w-16 bg-[#323e48]/10 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-gradient-to-r from-[#4e8f71] to-[#364d89]"
                            style={{ width: `${section.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <ChapterInsightsPanel 
              chapterId={selectedChapter}
              userId={userId}
              chapterTitle={chapterDetails.chapter.title}
            />
          </div>

          {chapterDetails.recent_entries.length > 0 && (
            <div>
              <h4 className="font-bold text-[#323e48] mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4e8f71]" />
                Recent Entries
              </h4>
              <div className="space-y-8">
                {Array.from(groupedEntries.entries()).map(([date, dateEntries]) => (
                  <div key={date} className="relative">
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 mb-4 shadow-md border border-white/40 inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4e8f71]" />
                      <span className="font-semibold text-[#323e48]">{date}</span>
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
            </div>
          )}
        </div>
      )}

      {viewMode === "journal" && (
        <>
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
                                {getChapterBadge(entry)}
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
        </>
      )}

      {deletingChapterId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#323e48]">Delete Chapter?</h3>
                <p className="text-sm text-[#323e48]/60">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-[#323e48]/80 mb-6">
              Are you sure you want to delete this chapter? All associated habits and progress will be removed.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => handleDeleteChapter(deletingChapterId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chapter
              </Button>
              <Button
                onClick={() => setDeletingChapterId(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
