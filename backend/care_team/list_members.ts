import { api } from "encore.dev/api";
import type { CareTeamMember } from "./types";
import * as storage from "./storage";

export interface ListMembersRequest {
  userId: string;
  activeOnly?: boolean;
}

export interface ListMembersResponse {
  members: CareTeamMember[];
}

export const listMembers = api<ListMembersRequest, ListMembersResponse>(
  { method: "GET", path: "/care-team/members/:userId", expose: true },
  async (req) => {
    const members = await storage.listMembers(req.userId, req.activeOnly !== false);
    return { members };
  }
);
