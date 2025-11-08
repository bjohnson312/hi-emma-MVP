import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { SessionType } from "~backend/conversation/types";

interface Message {
  sender: "emma" | "user";
  text: string;
  timestamp: Date;
}

interface UseConversationSessionReturn {
  messages: Message[];
  sessionId: number | null;
  loading: boolean;
  conversationComplete: boolean;
  addMessage: (sender: "emma" | "user", text: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSessionId: React.Dispatch<React.SetStateAction<number | null>>;
  setConversationComplete: React.Dispatch<React.SetStateAction<boolean>>;
  loadOrStartConversation: () => Promise<void>;
  sendMessage: (userMessage: string) => Promise<void>;
  resetConversation: (isFirstCheckIn?: boolean) => Promise<void>;
}

export function useConversationSession(
  userId: string,
  sessionType: SessionType,
  onNameUpdate?: (name: string) => void
): UseConversationSessionReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const { toast } = useToast();

  const addMessage = useCallback((sender: "emma" | "user", text: string) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }]);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Hi";
  };

  const startConversation = async (isFirstCheckIn: boolean = true) => {
    setLoading(true);
    try {
      const profile = await backend.profile.get({ user_id: userId });
      const userName = profile.profile?.name || "";
      const timeGreeting = getTimeBasedGreeting();

      const firstCheckInGreetings: Record<SessionType, string> = {
        morning: userName 
          ? `${timeGreeting}, ${userName}! How did you sleep?` 
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        evening: userName
          ? `${timeGreeting} ${userName}! How was your day?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        mood: userName
          ? `${timeGreeting} ${userName}, how are you feeling right now?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        diet: userName
          ? `${timeGreeting} ${userName}! What have you eaten today?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        doctors_orders: userName
          ? `${timeGreeting} ${userName}! How are you feeling today?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        nutrition: userName
          ? `${timeGreeting} ${userName}! I'm here to help with your nutrition. What's on your mind?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        general: userName
          ? `${timeGreeting} ${userName}! What's on your mind?`
          : "Hi, Emma here, your personal wellness companion. What's your name?"
      };

      const resumeGreetings: Record<SessionType, string> = {
        morning: userName 
          ? `Welcome back, ${userName}! How are you feeling?` 
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        evening: userName
          ? `Welcome back, ${userName}! What can I help you with?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        mood: userName
          ? `Hi again ${userName}, how are you feeling now?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        diet: userName
          ? `Welcome back ${userName}! What can I help you with?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        doctors_orders: userName
          ? `Hi again ${userName}! What can I help you with?`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        nutrition: userName
          ? `Welcome back ${userName}! Let's talk about your nutrition.`
          : "Hi, Emma here, your personal wellness companion. What's your name?",
        general: userName
          ? `Welcome back ${userName}! What can I help you with?`
          : "Hi, Emma here, your personal wellness companion. What's your name?"
      };

      const greetings = isFirstCheckIn ? firstCheckInGreetings : resumeGreetings;
      const greeting = greetings[sessionType] || greetings.general;
      
      setTimeout(() => {
        addMessage("emma", greeting);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const loadOrStartConversation = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await backend.conversation.getConversationByDate({
        user_id: userId,
        session_type: sessionType,
        date: today
      });

      if (response.conversation && response.conversation.messages.length > 0) {
        const loadedMessages: Message[] = [];
        response.conversation.messages.forEach(entry => {
          if (entry.user_message) {
            loadedMessages.push({ 
              sender: "user", 
              text: entry.user_message, 
              timestamp: new Date(entry.created_at) 
            });
          }
          loadedMessages.push({ 
            sender: "emma", 
            text: entry.emma_response, 
            timestamp: new Date(entry.created_at) 
          });
        });
        setMessages(loadedMessages);
        setSessionId(response.conversation.session.id);
        setConversationComplete(response.conversation.session.completed);
        setLoading(false);
      } else {
        await startConversation(true);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      await startConversation(true);
    }
  };

  const sendMessage = async (userMessage: string) => {
    addMessage("user", userMessage);
    setLoading(true);

    try {
      if (!sessionId && userMessage && !userMessage.includes("@")) {
        const profile = await backend.profile.get({ user_id: userId });
        if (!profile.profile) {
          await backend.profile.create({
            user_id: userId,
            name: userMessage
          });
          onNameUpdate?.(userMessage);
        }
      }

      const response = await backend.conversation.chat({
        user_id: userId,
        session_type: sessionType,
        user_message: userMessage,
        session_id: sessionId || undefined
      });

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      if (response.journal_entry_created) {
        toast({
          title: "✨ Added to Journal",
          description: "This moment has been saved to your wellness journal.",
        });
      }

      setTimeout(() => {
        addMessage("emma", response.emma_reply);
        setConversationComplete(response.conversation_complete || false);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const resetConversation = async (isFirstCheckIn: boolean = false) => {
    setMessages([]);
    setSessionId(null);
    setConversationComplete(false);
    await startConversation(isFirstCheckIn);
  };

  return {
    messages,
    sessionId,
    loading,
    conversationComplete,
    addMessage,
    setMessages,
    setSessionId,
    setConversationComplete,
    loadOrStartConversation,
    sendMessage,
    resetConversation
  };
}
