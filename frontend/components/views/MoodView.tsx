import { useState, useEffect } from "react";
import { Smile, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { MoodLog } from "~backend/wellness/types";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface MoodViewProps {
  userId: string;
}

interface MoodOption {
  rating: number;
  emoji: string;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { rating: 5, emoji: "😊", label: "Great", color: "bg-green-500" },
  { rating: 4, emoji: "🙂", label: "Good", color: "bg-blue-500" },
  { rating: 3, emoji: "😐", label: "Okay", color: "bg-yellow-500" },
  { rating: 2, emoji: "😟", label: "Not Great", color: "bg-orange-500" },
  { rating: 1, emoji: "😢", label: "Struggling", color: "bg-red-500" }
];

export default function MoodView({ userId }: MoodViewProps) {
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMoodHistory();
  }, [userId]);

  const loadMoodHistory = async () => {
    try {
      setLoading(true);
      const response = await backend.wellness.getMoodLogs({
        user_id: userId,
        limit: 7
      });
      setMoodHistory(response.logs);
      
      const today = response.logs.find(log => {
        const logDate = new Date(log.date);
        const now = new Date();
        return logDate.toDateString() === now.toDateString();
      });
      if (today) {
        setSelectedMood(today.mood_rating);
        setNotes(today.notes || "");
      }
    } catch (error) {
      console.error("Failed to load mood history:", error);
      toast({
        title: "Error",
        description: "Failed to load mood history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logMood = async (rating: number) => {
    try {
      await backend.wellness.logMood({
        user_id: userId,
        mood_rating: rating,
        notes: notes || undefined
      });
      
      setSelectedMood(rating);
      toast({
        title: "Success",
        description: "Mood logged successfully"
      });
      
      loadMoodHistory();
    } catch (error) {
      console.error("Failed to log mood:", error);
      toast({
        title: "Error",
        description: "Failed to log mood",
        variant: "destructive"
      });
    }
  };

  const getMoodLabel = (rating: number) => {
    const mood = moodOptions.find(m => m.rating === rating);
    return mood ? mood.label : "Unknown";
  };

  const getMoodColor = (rating: number) => {
    const mood = moodOptions.find(m => m.rating === rating);
    return mood ? mood.color : "bg-gray-500";
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === now.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    const daysAgo = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysAgo} days ago`;
  };

  if (showChat) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => setShowChat(false)}
          variant="outline"
          className="mb-4"
        >
          ← Back to Quick Mood
        </Button>
        <ConversationalCheckIn 
          userId={userId} 
          sessionType="mood" 
          title="Mood Check-In"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#4e8f71]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Smile className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">How Are You Feeling</h2>
              <p className="text-sm text-[#4e8f71]">Track your emotional wellness</p>
            </div>
          </div>
          <Button
            onClick={() => setShowChat(true)}
            variant="outline"
            className="bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white shadow-lg"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat About It
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[#323e48] mb-4 text-center">How are you feeling today?</h3>
            <div className="flex justify-center gap-3 mb-4">
              {moodOptions.map((mood) => (
                <button
                  key={mood.rating}
                  onClick={() => setSelectedMood(mood.rating)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedMood === mood.rating 
                      ? 'bg-white shadow-lg scale-110' 
                      : 'hover:bg-white/60'
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-[#323e48]">{mood.label}</span>
                </button>
              ))}
            </div>
            
            <div className="bg-white/90 rounded-xl p-4 mb-4">
              <label className="text-sm font-medium text-[#323e48] mb-2 block">
                Want to share more about how you're feeling?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional: Tell me what's on your mind..."
                className="w-full text-sm text-[#323e48] bg-transparent border border-[#4e8f71]/20 rounded-lg p-3 outline-none focus:border-[#4e8f71] resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={() => selectedMood && logMood(selectedMood)}
              disabled={!selectedMood}
              className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              Save Mood
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#4e8f71]" />
              <h3 className="font-semibold text-[#323e48]">Mood History</h3>
            </div>
            <div className="space-y-2">
              {moodHistory.length === 0 ? (
                <div className="bg-white/90 rounded-2xl p-6 text-center">
                  <p className="text-[#323e48]/60">No mood history yet</p>
                </div>
              ) : (
                moodHistory.map((entry) => (
                  <div key={entry.id} className="bg-white/90 rounded-2xl p-3 border border-[#4e8f71]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#323e48]">{formatDate(entry.date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#323e48]">{getMoodLabel(entry.mood_rating)}</span>
                        <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood_rating)}`}></div>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-[#323e48]/70 italic mt-1">{entry.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
