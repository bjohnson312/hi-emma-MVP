import { api, APIError } from "encore.dev/api";
import * as storage from "./storage";

export interface DeleteMemberRequest {
  userId: string;
  id: string;
}

export interface DeleteMemberResponse {
  success: boolean;
}

export const deleteMember = api<DeleteMemberRequest, DeleteMemberResponse>(
  { method: "DELETE", path: "/care-team/members/:id", expose: true },
  async (req) => {
    const existing = await storage.getMember(req.id);
    
    if (!existing || existing.userId !== req.userId) {
      throw APIError.notFound("Care team member not found");
    }
    
    const success = await storage.deleteMember(req.id);
    
    if (!success) {
      throw APIError.internal("Failed to delete member");
    }
    
    return { success: true };
  }
);
