import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { SessionType } from "~backend/conversation/types";
import type { ConversationEntry } from "~backend/profile/types";

interface Message {
  sender: "emma" | "user";
  text: string;
  timestamp: Date;
}

interface UseConversationHistoryReturn {
  pastConversations: { date: string; messages: ConversationEntry[] }[];
  loadPastConversations: () => Promise<void>;
  loadConversationByDate: (date: string) => Promise<{ messages: Message[]; sessionId: number; completed: boolean } | null>;
}

export function useConversationHistory(
  userId: string,
  sessionType: SessionType
): UseConversationHistoryReturn {
  const [pastConversations, setPastConversations] = useState<{ date: string; messages: ConversationEntry[] }[]>([]);
  const { toast } = useToast();

  const loadPastConversations = async () => {
    try {
      const response = await backend.conversation.getPastConversations({
        user_id: userId,
        session_type: sessionType,
        days: 7
      });

      const grouped = new Map<string, ConversationEntry[]>();
      response.conversations.forEach(conv => {
        const dateKey = conv.session.conversation_date 
          ? new Date(conv.session.conversation_date).toISOString().split('T')[0]
          : new Date(conv.session.started_at).toISOString().split('T')[0];
        
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(...conv.messages);
      });

      const result = Array.from(grouped.entries())
        .map(([date, messages]) => ({ date, messages }))
        .sort((a, b) => b.date.localeCompare(a.date));

      setPastConversations(result);
    } catch (error) {
      console.error("Failed to load past conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load past conversations.",
        variant: "destructive"
      });
    }
  };

  const loadConversationByDate = async (date: string) => {
    try {
      const response = await backend.conversation.getConversationByDate({
        user_id: userId,
        session_type: sessionType,
        date
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
        
        return {
          messages: loadedMessages,
          sessionId: response.conversation.session.id,
          completed: response.conversation.session.completed
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to load conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation.",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    pastConversations,
    loadPastConversations,
    loadConversationByDate
  };
}
