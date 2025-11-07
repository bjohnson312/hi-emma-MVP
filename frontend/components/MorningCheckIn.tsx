import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Heart, Wind, Send, Music, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { HabitAction, RoutinePreference } from "~backend/morning/types";
import Tooltip from "@/components/Tooltip";

interface MorningCheckInProps {
  userId: string;
  onNameUpdate?: (name: string) => void;
}

type MessageSender = "emma" | "user";
type ConversationStep = "initial" | "name" | "sleep" | "stretch_offer" | "stretch_guide" | "routine_pref" | "music_input" | "wake_time" | "complete";

interface Message {
  sender: MessageSender;
  text: string;
  timestamp: Date;
  habitSuggestion?: {
    action: HabitAction;
    description: string;
    icon: React.ReactNode;
  };
  stretchSuggestions?: string[];
  showYesNo?: boolean;
  showRoutineOptions?: boolean;
}

export default function MorningCheckIn({ userId, onNameUpdate }: MorningCheckInProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [currentInput, setCurrentInput] = useState<string>("");
  const [conversationStep, setConversationStep] = useState<ConversationStep>("initial");
  const [selectedRoutine, setSelectedRoutine] = useState<RoutinePreference | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationStep === "initial") {
      handleInitialGreeting();
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await backend.profile.get({ user_id: userId });
        if (response.profile && response.profile.name) {
          setUserName(response.profile.name);
          onNameUpdate?.(response.profile.name);
          localStorage.setItem("emma_user_name", response.profile.name);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, [userId]);

  const addMessage = (
    sender: MessageSender, 
    text: string, 
    options?: {
      habitSuggestion?: Message["habitSuggestion"];
      stretchSuggestions?: string[];
      showYesNo?: boolean;
      showRoutineOptions?: boolean;
    }
  ) => {
    setMessages(prev => [...prev, { 
      sender, 
      text, 
      timestamp: new Date(), 
      ...options
    }]);
  };

  const handleInitialGreeting = async () => {
    setLoading(true);
    try {
      const response = await backend.morning.checkIn({
        user_id: userId,
        step: "greeting"
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply);
        if (response.next_step === "sleep_question") {
          setConversationStep("sleep");
        } else {
          setConversationStep("name");
        }
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to start check-in:", error);
      toast({
        title: "Error",
        description: "Failed to connect with Emma. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!currentInput.trim()) return;

    const name = currentInput.trim();
    addMessage("user", name);
    setUserName(name);
    onNameUpdate?.(name);
    localStorage.setItem("emma_user_name", name);
    setCurrentInput("");
    setLoading(true);

    try {
      await backend.profile.create({
        user_id: userId,
        name: name
      });

      const response = await backend.morning.checkIn({
        user_id: userId,
        user_name: name,
        user_response: name,
        step: "process_name"
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply);
        setConversationStep("sleep");
        setLoading(false);
        inputRef.current?.focus();
      }, 800);
    } catch (error) {
      console.error("Failed to process name:", error);
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleSleepSubmit = async () => {
    if (!currentInput.trim()) return;

    const sleepResponse = currentInput.trim();
    addMessage("user", sleepResponse);
    setCurrentInput("");
    setLoading(true);

    try {
      const response = await backend.morning.checkIn({
        user_id: userId,
        user_name: userName,
        user_response: sleepResponse,
        step: "process_response"
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply, {
          showYesNo: response.show_yes_no
        });
        
        if (response.next_step === "offer_stretch") {
          setConversationStep("stretch_offer");
        } else {
          setConversationStep("complete");
        }
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to process response:", error);
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleStretchResponse = async (wantsStretch: boolean) => {
    addMessage("user", wantsStretch ? "Yes, please!" : "Not right now");
    setLoading(true);

    try {
      const response = await backend.morning.checkIn({
        user_id: userId,
        step: "offer_stretch",
        wants_stretch: wantsStretch
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply, {
          stretchSuggestions: response.stretch_suggestions,
          showRoutineOptions: response.show_routine_options
        });
        
        if (response.next_step === "guide_stretch") {
          setConversationStep("stretch_guide");
        } else if (response.next_step === "routine_preference") {
          setConversationStep("routine_pref");
        }
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to process stretch response:", error);
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleContinueAfterStretch = async () => {
    setLoading(true);

    try {
      const response = await backend.morning.checkIn({
        user_id: userId,
        step: "guide_stretch"
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply, {
          showRoutineOptions: response.show_routine_options
        });
        setConversationStep("routine_pref");
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to continue:", error);
      toast({
        title: "Error",
        description: "Failed to continue. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleRoutinePreference = async (preference: RoutinePreference) => {
    const label = preference === "gratitude" ? "Gratitude statements" : "Music suggestions";
    addMessage("user", label);
    setSelectedRoutine(preference);
    
    if (preference === "gratitude") {
      setLoading(true);
      try {
        const response = await backend.morning.checkIn({
          user_id: userId,
          step: "routine_preference",
          routine_preference: preference
        });

        setTimeout(() => {
          addMessage("emma", response.emma_reply);
          setConversationStep("wake_time");
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Failed to process preference:", error);
        toast({
          title: "Error",
          description: "Failed to process your response. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    } else {
      setConversationStep("music_input");
    }
  };

  const handleMusicGenreSubmit = async () => {
    if (!currentInput.trim()) return;

    const genre = currentInput.trim();
    addMessage("user", genre);
    setCurrentInput("");
    setLoading(true);

    try {
      const response = await backend.morning.checkIn({
        user_id: userId,
        step: "routine_preference",
        routine_preference: "music",
        music_genre: genre
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply);
        setConversationStep("wake_time");
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to process music genre:", error);
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleWakeTimeSubmit = async () => {
    if (!currentInput.trim()) return;

    const wakeTime = currentInput.trim();
    addMessage("user", wakeTime);
    setCurrentInput("");
    setLoading(true);

    try {
      const response = await backend.morning.checkIn({
        user_id: userId,
        step: "wake_time",
        wake_up_time: wakeTime,
        routine_preference: selectedRoutine || undefined
      });

      setTimeout(() => {
        addMessage("emma", response.emma_reply);
        setConversationStep("complete");
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to process wake time:", error);
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleInputSubmit = () => {
    if (conversationStep === "name") {
      handleNameSubmit();
    } else if (conversationStep === "sleep") {
      handleSleepSubmit();
    } else if (conversationStep === "music_input") {
      handleMusicGenreSubmit();
    } else if (conversationStep === "wake_time") {
      handleWakeTimeSubmit();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setUserName("");
    setCurrentInput("");
    setSelectedRoutine(null);
    setConversationStep("initial");
  };

  const getPlaceholder = () => {
    if (conversationStep === "name") return "Type your name...";
    if (conversationStep === "sleep") return "Tell me how you slept...";
    if (conversationStep === "music_input") return "What type of music? (e.g., jazz, classical, pop)";
    if (conversationStep === "wake_time") return "What time? (e.g., 7:00 AM, 6:30 AM)";
    return "";
  };

  const showInput = ["name", "sleep", "music_input", "wake_time"].includes(conversationStep);

  return (
    <div className="max-w-3xl mx-auto h-[600px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/40">
      <div className="bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] p-5 flex items-center gap-3 text-white">
        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg">
          <img src="/logo.png" alt="Emma" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1">
          <h2 className="font-medium text-xl tracking-wide">Emma</h2>
          <p className="text-xs text-white/90">Your wellness companion</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/60 to-[#f8fdf9]/80">
        {messages.length === 0 && conversationStep === "initial" && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-[#4e8f71]/50">
              <div className="w-20 h-20 mx-auto mb-4 opacity-40">
                <img src="/logo.png" alt="Emma" className="w-full h-full object-contain" />
              </div>
              <p className="text-lg">Connecting with Emma...</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[80%] ${message.sender === "user" ? "order-2" : "order-1"}`}>
              {message.sender === "emma" && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4e8f71] to-[#364d89] flex items-center justify-center shadow-md">
                    <img src="/logo.png" alt="Emma" className="w-4 h-4 object-contain opacity-90" />
                  </div>
                  <span className="text-xs text-[#4e8f71] font-medium">Emma</span>
                </div>
              )}
              
              <div className={`rounded-3xl px-5 py-3 ${
                message.sender === "user" 
                  ? "bg-gradient-to-br from-[#4e8f71] to-[#364d89] text-white rounded-tr-md shadow-xl" 
                  : "bg-white/95 text-[#323e48] shadow-xl rounded-tl-md border border-white/60 backdrop-blur-sm"
              }`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>

              {message.stretchSuggestions && message.stretchSuggestions.length > 0 && (
                <div className="mt-3 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#4e8f71]" />
                    <h4 className="font-medium text-[#323e48]">Stretch Suggestions</h4>
                  </div>
                  <ul className="space-y-2">
                    {message.stretchSuggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#323e48]">
                        <Check className="w-4 h-4 text-[#4e8f71] mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.showYesNo && (
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => handleStretchResponse(true)}
                    disabled={loading}
                    size="sm"
                    className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl border-0"
                  >
                    Yes, please!
                  </Button>
                  <Button
                    onClick={() => handleStretchResponse(false)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white shadow-xl"
                  >
                    Not right now
                  </Button>
                </div>
              )}

              {message.showRoutineOptions && (
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => handleRoutinePreference("gratitude")}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm hover:bg-white border-[#4e8f71]/30 text-[#4e8f71] shadow-xl"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Gratitude
                  </Button>
                  <Button
                    onClick={() => handleRoutinePreference("music")}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm hover:bg-white border-[#364d89]/30 text-[#364d89] shadow-xl"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Music
                  </Button>
                </div>
              )}

              {message.sender === "user" && (
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-[#4e8f71]/60">You</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-3xl px-5 py-3 shadow-xl border border-white/60">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#4e8f71] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-[#364d89] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-[#6656cb] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/95 backdrop-blur-md border-t border-white/40">
        {conversationStep === "complete" ? (
          <Button 
            onClick={handleReset}
            className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl border-0 py-6 rounded-2xl"
          >
            Start New Check-In
          </Button>
        ) : conversationStep === "stretch_guide" ? (
          <Button 
            onClick={handleContinueAfterStretch}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl border-0 py-6 rounded-2xl"
          >
            Continue
          </Button>
        ) : showInput ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={getPlaceholder()}
              onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
              disabled={loading}
              className="flex-1 border-white/40 focus:border-[#4e8f71] focus:ring-[#4e8f71]/20 rounded-2xl px-4 py-6 bg-white/90 backdrop-blur-sm shadow-lg"
            />
            <Tooltip content="Send response" side="top">
              <Button 
                onClick={handleInputSubmit}
                disabled={loading || !currentInput.trim()}
                size="icon"
                className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl border-0 w-14 h-14 rounded-2xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </Tooltip>
          </div>
        ) : null}
      </div>
    </div>
  );
}
