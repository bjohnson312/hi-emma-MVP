import db from "../db";

export interface AuditLogEntry {
  actorType: "provider" | "patient" | "system";
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  patientUserId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "failure" | "error";
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  await db.exec`
    INSERT INTO audit_logs (
      actor_type, actor_id, action, resource_type, resource_id,
      patient_user_id, details, ip_address, user_agent, status
    )
    VALUES (
      ${entry.actorType}, ${entry.actorId}, ${entry.action},
      ${entry.resourceType}, ${entry.resourceId || null},
      ${entry.patientUserId || null}, ${JSON.stringify(entry.details || {})},
      ${entry.ipAddress || null}, ${entry.userAgent || null},
      ${entry.status || "success"}
    )
  `;
}
