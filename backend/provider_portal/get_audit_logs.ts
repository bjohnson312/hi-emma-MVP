import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";

export interface AuditLog {
  id: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  patientUserId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  createdAt: Date;
}

export interface GetAuditLogsRequest {
  patientUserId?: string;
  limit?: number;
  token: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
}

export const getAuditLogs = api<GetAuditLogsRequest, AuditLogsResponse>(
  { method: "GET", path: "/provider/audit-logs", expose: true },
  async (req): Promise<AuditLogsResponse> => {
    const { patientUserId, limit = 100, token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    if (providerData.role !== "admin" && providerData.role !== "provider") {
      throw APIError.permissionDenied("Insufficient permissions to view audit logs");
    }

    type LogRow = {
      id: string;
      actor_type: string;
      actor_id: string;
      action: string;
      resource_type: string;
      resource_id: string | null;
      patient_user_id: string | null;
      details: any;
      ip_address: string | null;
      user_agent: string | null;
      status: string;
      created_at: Date;
    };

    let logsQuery;
    if (patientUserId) {
      logsQuery = await db.query<LogRow>`
        SELECT *
        FROM audit_logs
        WHERE patient_user_id = ${patientUserId}
          AND actor_id = ${providerData.providerId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      logsQuery = await db.query<LogRow>`
        SELECT *
        FROM audit_logs
        WHERE actor_id = ${providerData.providerId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    const logs: AuditLog[] = [];
    for await (const log of logsQuery) {
      logs.push({
        id: log.id,
        actorType: log.actor_type,
        actorId: log.actor_id,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id || undefined,
        patientUserId: log.patient_user_id || undefined,
        details: log.details || {},
        ipAddress: log.ip_address || undefined,
        userAgent: log.user_agent || undefined,
        status: log.status,
        createdAt: log.created_at,
      });
    }

    return {
      logs,
    };
  }
);
