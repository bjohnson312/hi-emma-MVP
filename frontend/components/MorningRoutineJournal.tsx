import { useState, useEffect } from "react";
import { Clock, CheckCircle2, Plus, Edit2, Sparkles } from "lucide-react";
import backend from "@/lib/backend-client";
import type { MorningJournalEntry, MorningJournalEntryType } from "~backend/morning/journal_types";

interface MorningRoutineJournalProps {
  userId: string;
  days?: number;
}

const entryTypeIcons: Record<MorningJournalEntryType, React.ReactElement> = {
  activity_added: <Plus className="w-4 h-4" />,
  activity_completed: <CheckCircle2 className="w-4 h-4" />,
  routine_created: <Sparkles className="w-4 h-4" />,
  routine_edited: <Edit2 className="w-4 h-4" />,
  routine_selected: <Sparkles className="w-4 h-4" />,
  all_activities_completed: <CheckCircle2 className="w-4 h-4" />
};

const entryTypeColors: Record<MorningJournalEntryType, string> = {
  activity_added: "text-purple-600 bg-purple-50",
  activity_completed: "text-green-600 bg-green-50",
  routine_created: "text-blue-600 bg-blue-50",
  routine_edited: "text-orange-600 bg-orange-50",
  routine_selected: "text-indigo-600 bg-indigo-50",
  all_activities_completed: "text-emerald-600 bg-emerald-50"
};

export default function MorningRoutineJournal({ userId, days = 7 }: MorningRoutineJournalProps) {
  const [entries, setEntries] = useState<MorningJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [userId, days]);

  async function loadEntries() {
    setLoading(true);
    try {
      const response = await backend.morning.getJournalEntries({
        user_id: userId,
        days
      });
      setEntries(response.entries);
    } catch (error) {
      console.error("Failed to load journal entries:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatDate(date: Date): string {
    const entryDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (entryDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (entryDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return entryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  function groupEntriesByDate(entries: MorningJournalEntry[]): Map<string, MorningJournalEntry[]> {
    const grouped = new Map<string, MorningJournalEntry[]>();
    
    entries.forEach(entry => {
      const dateKey = new Date(entry.created_at).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    });

    return grouped;
  }

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-[#4e8f71]" />
          <h3 className="text-xl font-bold text-[#323e48]">Morning Routine Journal</h3>
        </div>
        <div className="text-center py-8 text-[#323e48]/60">
          Loading journal...
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-[#4e8f71]" />
          <h3 className="text-xl font-bold text-[#323e48]">Morning Routine Journal</h3>
        </div>
        <div className="text-center py-8 text-[#323e48]/60">
          <p className="mb-2">Your morning routine journey starts here!</p>
          <p className="text-sm">Activities and changes will be logged automatically.</p>
        </div>
      </div>
    );
  }

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-[#4e8f71]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#323e48]">Morning Routine Journal</h3>
          <p className="text-sm text-[#323e48]/60">Your routine activity log</p>
        </div>
      </div>

      <div className="space-y-6">
        {Array.from(groupedEntries.entries()).map(([dateKey, dayEntries]) => (
          <div key={dateKey}>
            <div className="text-sm font-semibold text-[#323e48]/70 mb-3 sticky top-0 bg-white/95 backdrop-blur-md py-2">
              {formatDate(new Date(dateKey))}
            </div>
            <div className="space-y-2">
              {dayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-white/50 to-white/30 border border-[#323e48]/10 hover:border-[#4e8f71]/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl ${entryTypeColors[entry.entry_type]} flex items-center justify-center flex-shrink-0`}>
                    {entryTypeIcons[entry.entry_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#323e48] font-medium">
                      {entry.entry_text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-[#323e48]/40" />
                      <span className="text-xs text-[#323e48]/60">
                        {formatTime(entry.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
