import { useState } from "react";
import { Sun, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConversationalCheckIn from "../ConversationalCheckIn";

interface MorningRoutineViewProps {
  userId: string;
}

export default function MorningRoutineView({ userId }: MorningRoutineViewProps) {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#323e48]">Morning Chat</h2>
            <Button onClick={() => setShowChat(false)} variant="outline">Back</Button>
          </div>
        </div>
        <ConversationalCheckIn 
          userId={userId} 
          sessionType="morning" 
          title="Morning Chat with Emma"
          onNameUpdate={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Sun className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#323e48]">Morning Routine</h2>
            <p className="text-sm text-[#4e8f71]">Start your day with Emma</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
          <h3 className="font-semibold text-[#323e48] mb-3">Daily Check-In</h3>
          <p className="text-sm text-[#323e48]/70 mb-4">
            Chat with Emma about your sleep, set your intentions, and start your day right.
          </p>
          <Button
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-xl"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Morning Check-In
          </Button>
        </div>
      </div>
    </div>
  );
}
