import { api } from "encore.dev/api";
import type { CareTeamMember, CareTeamMemberType } from "./types";
import * as storage from "./storage";

export interface AddMemberRequest {
  userId: string;
  memberType: CareTeamMemberType;
  relationship?: string;
  name: string;
  phone?: string;
  email?: string;
  fax?: string;
  specialty?: string;
  organization?: string;
  address?: string;
  notes?: string;
  isPrimary?: boolean;
}

export const addMember = api<AddMemberRequest, CareTeamMember>(
  { method: "POST", path: "/care-team/members", expose: true },
  async (req) => {
    const member = await storage.addMember(req.userId, {
      memberType: req.memberType,
      relationship: req.relationship,
      name: req.name,
      phone: req.phone,
      email: req.email,
      fax: req.fax,
      specialty: req.specialty,
      organization: req.organization,
      address: req.address,
      notes: req.notes,
      isPrimary: req.isPrimary || false,
      emailPending: !!req.email,
      isActive: true,
    });
    
    return member;
  }
);
