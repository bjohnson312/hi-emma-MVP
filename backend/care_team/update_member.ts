import { api, APIError } from "encore.dev/api";
import type { CareTeamMember } from "./types";
import * as storage from "./storage";

export interface UpdateMemberRequest {
  userId: string;
  id: string;
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  fax?: string;
  specialty?: string;
  organization?: string;
  address?: string;
  notes?: string;
  isPrimary?: boolean;
}

export const updateMember = api<UpdateMemberRequest, CareTeamMember>(
  { method: "PATCH", path: "/care-team/members/:id", expose: true },
  async (req) => {
    const existing = await storage.getMember(req.id);
    
    if (!existing || existing.userId !== req.userId) {
      throw APIError.notFound("Care team member not found");
    }
    
    const updated = await storage.updateMember(req.id, {
      name: req.name,
      relationship: req.relationship,
      phone: req.phone,
      email: req.email,
      fax: req.fax,
      specialty: req.specialty,
      organization: req.organization,
      address: req.address,
      notes: req.notes,
      isPrimary: req.isPrimary,
      emailPending: req.email ? false : existing.emailPending,
    });
    
    if (!updated) {
      throw APIError.internal("Failed to update member");
    }
    
    return updated;
  }
);
