import db from "../db/index";
import type { CareTeamMember, CareTeamSetupProgress } from "./types";

export async function addMember(userId: string, memberData: Omit<CareTeamMember, "id" | "userId" | "addedAt" | "updatedAt">): Promise<CareTeamMember> {
  const row = await db.queryRow<{
    id: string;
    user_id: string;
    member_type: string;
    relationship: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    fax: string | null;
    specialty: string | null;
    organization: string | null;
    address: string | null;
    notes: string | null;
    is_primary: boolean;
    email_pending: boolean;
    is_active: boolean;
    added_at: Date;
    updated_at: Date;
  }>`
    INSERT INTO care_team_members (
      user_id, member_type, relationship, name, phone, email, fax, 
      specialty, organization, address, notes, is_primary, email_pending, is_active
    ) VALUES (
      ${userId}, ${memberData.memberType}, ${memberData.relationship ?? null}, ${memberData.name}, 
      ${memberData.phone ?? null}, ${memberData.email ?? null}, ${memberData.fax ?? null},
      ${memberData.specialty ?? null}, ${memberData.organization ?? null}, ${memberData.address ?? null},
      ${memberData.notes ?? null}, ${memberData.isPrimary}, ${memberData.email ? true : false}, ${memberData.isActive}
    )
    RETURNING *
  `;

  if (!row) {
    throw new Error("Failed to insert care team member");
  }

  return {
    id: row.id,
    userId: row.user_id,
    memberType: row.member_type as any,
    relationship: row.relationship ?? undefined,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    fax: row.fax ?? undefined,
    specialty: row.specialty ?? undefined,
    organization: row.organization ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    isPrimary: row.is_primary,
    emailPending: row.email_pending,
    isActive: row.is_active,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  };
}

export async function listMembers(userId: string, activeOnly: boolean = true): Promise<CareTeamMember[]> {
  const rows = activeOnly
    ? await db.queryAll<{
        id: string;
        user_id: string;
        member_type: string;
        relationship: string | null;
        name: string;
        phone: string | null;
        email: string | null;
        fax: string | null;
        specialty: string | null;
        organization: string | null;
        address: string | null;
        notes: string | null;
        is_primary: boolean;
        email_pending: boolean;
        is_active: boolean;
        added_at: Date;
        updated_at: Date;
      }>`
        SELECT * FROM care_team_members
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY is_primary DESC, added_at DESC
      `
    : await db.queryAll<{
        id: string;
        user_id: string;
        member_type: string;
        relationship: string | null;
        name: string;
        phone: string | null;
        email: string | null;
        fax: string | null;
        specialty: string | null;
        organization: string | null;
        address: string | null;
        notes: string | null;
        is_primary: boolean;
        email_pending: boolean;
        is_active: boolean;
        added_at: Date;
        updated_at: Date;
      }>`
        SELECT * FROM care_team_members
        WHERE user_id = ${userId}
        ORDER BY is_primary DESC, added_at DESC
      `;

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    memberType: row.member_type as any,
    relationship: row.relationship ?? undefined,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    fax: row.fax ?? undefined,
    specialty: row.specialty ?? undefined,
    organization: row.organization ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    isPrimary: row.is_primary,
    emailPending: row.email_pending,
    isActive: row.is_active,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  }));
}

export async function getMember(id: string): Promise<CareTeamMember | null> {
  const row = await db.queryRow<{
    id: string;
    user_id: string;
    member_type: string;
    relationship: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    fax: string | null;
    specialty: string | null;
    organization: string | null;
    address: string | null;
    notes: string | null;
    is_primary: boolean;
    email_pending: boolean;
    is_active: boolean;
    added_at: Date;
    updated_at: Date;
  }>`
    SELECT * FROM care_team_members WHERE id = ${id}
  `;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    memberType: row.member_type as any,
    relationship: row.relationship ?? undefined,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    fax: row.fax ?? undefined,
    specialty: row.specialty ?? undefined,
    organization: row.organization ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    isPrimary: row.is_primary,
    emailPending: row.email_pending,
    isActive: row.is_active,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  };
}

export async function updateMember(id: string, updates: Partial<CareTeamMember>): Promise<CareTeamMember | null> {
  const existing = await getMember(id);
  if (!existing) return null;

  const row = await db.queryRow<{
    id: string;
    user_id: string;
    member_type: string;
    relationship: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    fax: string | null;
    specialty: string | null;
    organization: string | null;
    address: string | null;
    notes: string | null;
    is_primary: boolean;
    email_pending: boolean;
    is_active: boolean;
    added_at: Date;
    updated_at: Date;
  }>`
    UPDATE care_team_members
    SET
      member_type = ${updates.memberType ?? existing.memberType},
      relationship = ${updates.relationship !== undefined ? updates.relationship : existing.relationship},
      name = ${updates.name ?? existing.name},
      phone = ${updates.phone !== undefined ? updates.phone : existing.phone},
      email = ${updates.email !== undefined ? updates.email : existing.email},
      fax = ${updates.fax !== undefined ? updates.fax : existing.fax},
      specialty = ${updates.specialty !== undefined ? updates.specialty : existing.specialty},
      organization = ${updates.organization !== undefined ? updates.organization : existing.organization},
      address = ${updates.address !== undefined ? updates.address : existing.address},
      notes = ${updates.notes !== undefined ? updates.notes : existing.notes},
      is_primary = ${updates.isPrimary ?? existing.isPrimary},
      email_pending = ${updates.emailPending ?? existing.emailPending},
      is_active = ${updates.isActive ?? existing.isActive},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    memberType: row.member_type as any,
    relationship: row.relationship ?? undefined,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    fax: row.fax ?? undefined,
    specialty: row.specialty ?? undefined,
    organization: row.organization ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    isPrimary: row.is_primary,
    emailPending: row.email_pending,
    isActive: row.is_active,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  };
}

export async function deleteMember(id: string): Promise<boolean> {
  const row = await db.queryRow<{ id: string }>`
    UPDATE care_team_members
    SET is_active = false, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `;

  return row !== null;
}

export async function getProgress(userId: string): Promise<CareTeamSetupProgress> {
  let row = await db.queryRow<{
    user_id: string;
    current_step: number;
    total_steps: number;
    steps_completed: string[];
    is_completed: boolean;
    started_at: Date;
    completed_at: Date | null;
    last_updated: Date;
  }>`
    SELECT * FROM care_team_setup_progress WHERE user_id = ${userId}
  `;

  if (!row) {
    row = await db.queryRow<{
      user_id: string;
      current_step: number;
      total_steps: number;
      steps_completed: string[];
      is_completed: boolean;
      started_at: Date;
      completed_at: Date | null;
      last_updated: Date;
    }>`
      INSERT INTO care_team_setup_progress (user_id)
      VALUES (${userId})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create care team setup progress");
    }

    return {
      userId: row.user_id,
      currentStep: row.current_step,
      totalSteps: row.total_steps,
      stepsCompleted: row.steps_completed,
      isCompleted: row.is_completed,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      lastUpdated: row.last_updated,
    };
  }

  return {
    userId: row.user_id,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    stepsCompleted: row.steps_completed,
    isCompleted: row.is_completed,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    lastUpdated: row.last_updated,
  };
}

export async function updateProgress(
  userId: string,
  currentStep: number,
  stepsCompleted: string[],
  isCompleted: boolean
): Promise<CareTeamSetupProgress> {
  const row = await db.queryRow<{
    user_id: string;
    current_step: number;
    total_steps: number;
    steps_completed: string[];
    is_completed: boolean;
    started_at: Date;
    completed_at: Date | null;
    last_updated: Date;
  }>`
    INSERT INTO care_team_setup_progress (user_id, current_step, steps_completed, is_completed, completed_at)
    VALUES (${userId}, ${currentStep}, ${stepsCompleted}, ${isCompleted}, ${isCompleted ? new Date() : null})
    ON CONFLICT (user_id)
    DO UPDATE SET
      current_step = ${currentStep},
      steps_completed = ${stepsCompleted},
      is_completed = ${isCompleted},
      completed_at = CASE WHEN ${isCompleted} AND care_team_setup_progress.completed_at IS NULL THEN NOW() ELSE care_team_setup_progress.completed_at END,
      last_updated = NOW()
    RETURNING *
  `;

  if (!row) {
    throw new Error("Failed to update care team setup progress");
  }

  return {
    userId: row.user_id,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    stepsCompleted: row.steps_completed,
    isCompleted: row.is_completed,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    lastUpdated: row.last_updated,
  };
}
