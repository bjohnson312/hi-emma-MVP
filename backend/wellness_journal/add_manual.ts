import { api } from "encore.dev/api";
import { createJournalEntry } from "./auto_create";
import type { CreateJournalEntryRequest, WellnessJournalEntry } from "./types";

export const addManualEntry = api<CreateJournalEntryRequest, WellnessJournalEntry>(
  { expose: true, method: "POST", path: "/wellness_journal/add-manual" },
  async (req) => {
    const entry = await createJournalEntry({
      ...req,
      ai_generated: false,
      source_type: req.source_type || "manual"
    });

    return entry;
  }
);

export interface AddFromConversationRequest {
  user_id: string;
  conversation_text: string;
  session_type?: string;
  title?: string;
  tags?: string[];
}

export const addFromConversation = api<AddFromConversationRequest, WellnessJournalEntry>(
  { expose: true, method: "POST", path: "/wellness_journal/add-from-conversation" },
  async (req) => {
    const { user_id, conversation_text, session_type, title, tags } = req;

    const defaultTitle = title || `${session_type ? capitalizeFirst(session_type) : 'Personal'} Reflection`;
    const defaultTags = tags || (session_type ? [session_type, 'conversation', 'reflection'] : ['conversation', 'reflection']);

    const entry = await createJournalEntry({
      user_id,
      entry_type: "event",
      title: defaultTitle,
      content: conversation_text,
      tags: defaultTags,
      source_type: "conversation",
      ai_generated: false
    });

    return entry;
  }
);

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
