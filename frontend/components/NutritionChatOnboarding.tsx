import { useState, useEffect, useRef } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { NutritionChatMessage } from "~backend/wellness/types";

interface NutritionChatOnboardingProps {
  userId: string;
  onComplete: () => void;
}

export default function NutritionChatOnboarding({ userId, onComplete }: NutritionChatOnboardingProps) {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<NutritionChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [completed, setCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    startChat();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async () => {
    try {
      setInitializing(true);
      const response = await backend.wellness.startNutritionChat({ user_id: userId });
      setSessionId(response.session_id);
      setMessages([{
        role: "assistant",
        content: response.initial_message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Failed to start nutrition chat:", error);
      toast({
        title: "Error",
        description: "Failed to start nutrition chat",
        variant: "destructive"
      });
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: NutritionChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await backend.wellness.sendChatMessage({
        session_id: sessionId,
        user_id: userId,
        message: userMessage.content
      });

      const assistantMessage: NutritionChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.plan_ready) {
        setCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-[#4e8f71] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
          <span className="text-2xl">🥗</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#323e48]">Create Your Nutrition Plan</h2>
          <p className="text-sm text-[#4e8f71]">Let's chat about your goals and preferences</p>
        </div>
      </div>

      <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto pr-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                  : "bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 text-[#323e48]"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <p className="text-xs opacity-60 mt-2">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
              <Loader2 className="w-5 h-5 text-[#4e8f71] animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {completed ? (
        <div className="bg-gradient-to-r from-[#4e8f71]/20 to-[#364d89]/20 rounded-2xl p-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#4e8f71] mx-auto mb-2" />
          <p className="text-[#323e48] font-semibold">Plan Created! Redirecting...</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-white/90"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !inputMessage.trim()}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
