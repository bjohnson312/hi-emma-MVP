import { api, APIError } from "encore.dev/api";

import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import { logAudit } from "./audit";


export interface GrantAccessRequest {
  patientUserId: string;
  accessLevel: "read" | "write" | "full";
  expiresAt?: Date;
  token: string;
}

export const grantAccess = api<GrantAccessRequest, { success: boolean; message: string }>(
  { method: "POST", path: "/provider/patients/:patientUserId/access", expose: true },
  async (req): Promise<{ success: boolean; message: string }> => {
    const { patientUserId, accessLevel, expiresAt, token: authorization } = req;
    if (!authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authorization.replace("Bearer ", "");
    const providerData = verifyProviderToken(token);

    const userExists = await db.queryRow<{ id: string }>`
      SELECT id FROM users WHERE id = ${patientUserId}
    `;

    if (!userExists) {
      throw APIError.notFound("Patient not found");
    }

    await db.exec`
      INSERT INTO provider_patient_access (
        provider_id, patient_user_id, access_level, expires_at
      )
      VALUES (
        ${providerData.providerId}::uuid, ${patientUserId}, 
        ${accessLevel}, ${expiresAt || null}
      )
      ON CONFLICT (provider_id, patient_user_id) 
      DO UPDATE SET 
        access_level = ${accessLevel},
        expires_at = ${expiresAt || null},
        is_active = true
    `;

    await logAudit({
      actorType: "provider",
      actorId: providerData.providerId,
      action: "grant_access",
      resourceType: "patient_access",
      resourceId: patientUserId,
      patientUserId,
      details: { accessLevel },
    });

    return {
      success: true,
      message: "Access granted successfully",
    };
  }
);
