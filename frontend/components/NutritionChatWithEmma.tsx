import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, X, RefreshCw, Sparkles, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import AutoExpandTextarea from "@/components/AutoExpandTextarea";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import Tooltip from "@/components/Tooltip";
import { USE_NEW_CONVERSATION_FLOW } from "@/config";

interface NutritionChatWithEmmaProps {
  userId: string;
  onClose: () => void;
  onMealLogged?: () => void;
  onGoalsUpdated?: () => void;
}

interface Message {
  sender: "user" | "emma";
  text: string;
  timestamp: Date;
}

export default function NutritionChatWithEmma({ 
  userId, 
  onClose, 
  onMealLogged,
  onGoalsUpdated 
}: NutritionChatWithEmmaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [conversationComplete, setConversationComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasSpokenInitial, setHasSpokenInitial] = useState(false);
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking
  } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const initializeConversation = async () => {
      if (USE_NEW_CONVERSATION_FLOW) {
        try {
          const response = await backend.api_v2_gateway.conversationStart({
            userId,
            sessionType: "nutrition",
            isFirstCheckIn: true
          });
          setSessionId(Number(response.sessionId));
          setMessages([{
            sender: "emma",
            text: response.greeting,
            timestamp: new Date()
          }]);
          setHasSpokenInitial(false);
        } catch (error) {
          console.error("Failed to start conversation:", error);
          setMessages([{
            sender: "emma",
            text: "Hi! I'm Emma, your nutrition coach. I'm here to help you with your nutrition journey. How can I assist you today?",
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          sender: "emma",
          text: "Hi! I'm Emma, your nutrition coach. I'm here to help you with your nutrition journey. How can I assist you today?",
          timestamp: new Date()
        }]);
      }
    };
    initializeConversation();
  }, [userId]);

  useEffect(() => {
    if (voiceEnabled && messages.length > 0 && !hasSpokenInitial) {
      const firstMessage = messages[0];
      if (firstMessage.sender === "emma") {
        speak(firstMessage.text);
        setHasSpokenInitial(true);
      }
    }
  }, [voiceEnabled, messages.length]);

  useEffect(() => {
    scrollToBottom();

    if (voiceEnabled && messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === "emma") {
        speak(lastMessage.text);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, voiceEnabled, speak]);

  useEffect(() => {
    if (transcript) {
      setCurrentInput(transcript);
    }
  }, [transcript]);

  const sendMessage = async () => {
    if (!currentInput.trim() || loading) return;

    const userMessage: Message = {
      sender: "user",
      text: currentInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput("");
    setLoading(true);

    try {
      if (USE_NEW_CONVERSATION_FLOW) {
        const response = await backend.api_v2_gateway.conversationSend({
          userId,
          sessionType: "nutrition",
          message: userMessage.text,
          sessionId: sessionId?.toString() || ""
        });

        if (!sessionId) {
          setSessionId(Number(response.sessionId));
        }

        const emmaMessage: Message = {
          sender: "emma",
          text: response.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, emmaMessage]);
      } else {
        const response = await backend.wellness.nutritionChat({
          user_id: userId,
          session_type: "nutrition",
          user_message: userMessage.text,
          session_id: sessionId || undefined
        });

        if (!sessionId) {
          setSessionId(response.session_id);
        }

        const emmaMessage: Message = {
          sender: "emma",
          text: response.emma_reply,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, emmaMessage]);
        setConversationComplete(response.conversation_complete || false);

        if (response.meal_logged) {
          toast({
            title: "Meal Logged!",
            description: "I've added that to your nutrition tracker",
            duration: 3000
          });
          onMealLogged?.();
        }

        if (response.goals_updated) {
          toast({
            title: "Goals Updated!",
            description: "I've updated your nutrition targets",
            duration: 3000
          });
          onGoalsUpdated?.();
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = async () => {
    stopSpeaking();
    setSessionId(null);
    setConversationComplete(false);
    setHasSpokenInitial(false);
    
    if (USE_NEW_CONVERSATION_FLOW) {
      try {
        const response = await backend.api_v2_gateway.conversationStart({
          userId,
          sessionType: "nutrition",
          isFirstCheckIn: false
        });
        setSessionId(Number(response.sessionId));
        setMessages([{
          sender: "emma",
          text: response.greeting,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error("Failed to reset conversation:", error);
        setMessages([{
          sender: "emma",
          text: "Hi! I'm Emma, your nutrition coach. How can I help you today?",
          timestamp: new Date()
        }]);
      }
    } else {
      setMessages([{
        sender: "emma",
        text: "Hi! I'm Emma, your nutrition coach. How can I help you today?",
        timestamp: new Date()
      }]);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 bg-gradient-to-r from-[#4e8f71] to-[#364d89] rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Chat with Emma</h2>
              <p className="text-sm text-white/80">Your nutrition coach</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleVoiceOutput}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              title={voiceEnabled ? "Mute Emma's voice" : "Enable Emma's voice"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              onClick={resetConversation}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                      : "bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 text-[#323e48]"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                {message.sender === "emma" && index === messages.length - 1 && !loading && (
                  <Tooltip content="Replay message" side="right">
                    <Button
                      onClick={() => speak(message.text)}
                      size="sm"
                      variant="ghost"
                      className="text-[#4e8f71] hover:bg-[#4e8f71]/10 rounded-full w-8 h-8 p-0 flex items-center justify-center"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4e8f71] animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-[#4e8f71] animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-[#4e8f71] animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {conversationComplete ? (
          <div className="p-6 bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 border-t border-[#4e8f71]/20">
            <p className="text-center text-[#323e48] mb-4">
              ✨ Conversation completed! Feel free to start a new one anytime.
            </p>
            <Button
              onClick={resetConversation}
              className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
            >
              Start New Conversation
            </Button>
          </div>
        ) : (
          <div className="p-6 border-t border-[#4e8f71]/20">
            <div className="flex gap-2">
              {isSupported && (
                <Button
                  onClick={toggleVoiceInput}
                  variant={isListening ? "default" : "outline"}
                  className={isListening ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <AutoExpandTextarea
                value={currentInput}
                onChange={setCurrentInput}
                onSend={sendMessage}
                placeholder={isListening ? "Listening..." : "Type your message to Emma..."}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !currentInput.trim()}
                className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[#323e48]/60 mt-2 text-center">
              💡 Try: "I had oatmeal for breakfast" or "Can you help me plan a healthy lunch?"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
