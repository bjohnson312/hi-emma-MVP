import { api } from "encore.dev/api";
import type { CareTeamMember } from "./types";
import * as storage from "./storage";

export interface GetMembersNeedingEmailRequest {
  userId: string;
}

export interface GetMembersNeedingEmailResponse {
  members: CareTeamMember[];
}

export const getMembersNeedingEmail = api<GetMembersNeedingEmailRequest, GetMembersNeedingEmailResponse>(
  { method: "GET", path: "/care-team/members-needing-email/:userId", expose: true },
  async (req) => {
    const allMembers = await storage.listMembers(req.userId, true);
    const members = allMembers.filter(m => m.emailPending);
    return { members };
  }
);
