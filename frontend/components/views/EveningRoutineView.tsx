import { useState } from "react";
import { Moon, BookOpen, Wind, Music, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface EveningRoutineViewProps {
  userId: string;
}

interface Activity {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

const activities: Activity[] = [
  { id: "reading", name: "Reading", icon: BookOpen, color: "border-[#4e8f71]/20" },
  { id: "meditation", name: "Meditation", icon: Wind, color: "border-[#364d89]/20" },
  { id: "music", name: "Calm Music", icon: Music, color: "border-[#6656cb]/20" },
  { id: "stretch", name: "Light Stretch", icon: Wind, color: "border-[#4e8f71]/20" }
];

export default function EveningRoutineView({ userId }: EveningRoutineViewProps) {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [bedtime, setBedtime] = useState("");
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const saveReflection = async () => {
    if (!reflection && !gratitude && selectedActivities.length === 0) {
      toast({
        title: "Error",
        description: "Please fill out at least one field",
        variant: "destructive"
      });
      return;
    }

    try {
      const notes = [
        reflection && `Reflection: ${reflection}`,
        gratitude && `Gratitude: ${gratitude}`
      ].filter(Boolean).join("\n");

      await backend.wellness.logEveningRoutine({
        user_id: userId,
        wind_down_activities: selectedActivities,
        bedtime: bedtime || undefined,
        notes: notes || undefined
      });

      toast({
        title: "Success",
        description: "Evening reflection saved"
      });

      setReflection("");
      setGratitude("");
      setBedtime("");
      setSelectedActivities([]);
    } catch (error) {
      console.error("Failed to save reflection:", error);
      toast({
        title: "Error",
        description: "Failed to save reflection",
        variant: "destructive"
      });
    }
  };

  if (showChat) {
    return <ConversationalCheckIn userId={userId} sessionType="evening" title="Evening Reflection" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Moon className="w-6 h-6 text-[#364d89]" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#323e48]">Evening Routine</h2>
            <p className="text-sm text-[#4e8f71]">Wind down & reflect</p>
          </div>
          <Button
            onClick={() => setShowChat(true)}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-lg"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Emma
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#364d89]/10 to-[#6656cb]/10 rounded-2xl p-6">
            <h3 className="font-semibold text-[#323e48] mb-4">Bedtime Reflection</h3>
            <p className="text-sm text-[#323e48]/70 mb-4">Take a moment to reflect on your day</p>
            
            <div className="space-y-3">
              <div className="bg-white/90 rounded-xl p-3">
                <p className="text-sm font-medium text-[#323e48] mb-1">What went well today?</p>
                <textarea 
                  className="w-full text-sm text-[#323e48] bg-transparent border-none outline-none resize-none"
                  rows={2}
                  placeholder="Share your thoughts..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
              
              <div className="bg-white/90 rounded-xl p-3">
                <p className="text-sm font-medium text-[#323e48] mb-1">What are you grateful for?</p>
                <textarea 
                  className="w-full text-sm text-[#323e48] bg-transparent border-none outline-none resize-none"
                  rows={2}
                  placeholder="Share your thoughts..."
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                />
              </div>

              <div className="bg-white/90 rounded-xl p-3">
                <p className="text-sm font-medium text-[#323e48] mb-1">Bedtime</p>
                <Input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="bg-transparent border-none outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Wind-Down Activities</h3>
            <div className="grid grid-cols-2 gap-3">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const isSelected = selectedActivities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    onClick={() => toggleActivity(activity.id)}
                    className={`bg-white/90 rounded-2xl p-4 border ${activity.color} hover:bg-white hover:shadow-lg transition-all relative ${
                      isSelected ? 'ring-2 ring-[#4e8f71]' : ''
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-[#4e8f71]" />
                      </div>
                    )}
                    <Icon className="w-6 h-6 text-[#4e8f71] mb-2" />
                    <p className="text-sm font-medium text-[#323e48]">{activity.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button 
            onClick={saveReflection}
            className="w-full bg-gradient-to-r from-[#364d89] to-[#6656cb] hover:from-[#2a3d6f] hover:to-[#5545a8] text-white shadow-xl"
          >
            Save Evening Reflection
          </Button>
        </div>
      </div>
    </div>
  );
}
