import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface GrantProviderAccessRequest {
  userId: string;
  providerEmail: string;
  accessLevel: "read" | "write" | "full";
  expiresInDays?: number;
}

export const grantProviderAccess = api<GrantProviderAccessRequest, { success: boolean; message: string }>(
  { method: "POST", path: "/patient/grant-access", expose: true },
  async (req): Promise<{ success: boolean; message: string }> => {
    const { providerEmail, accessLevel, expiresInDays, userId } = req;

    const provider = await db.queryRow<{ id: string; full_name: string }>`
      SELECT id, full_name FROM healthcare_providers
      WHERE email = ${providerEmail} AND is_active = true
    `;

    if (!provider) {
      throw APIError.notFound("Provider not found or inactive");
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await db.exec`
      INSERT INTO provider_patient_access (
        provider_id, patient_user_id, access_level, 
        granted_by, expires_at, patient_consent_given, consent_timestamp
      )
      VALUES (
        ${provider.id}::uuid, ${userId}, ${accessLevel},
        ${userId}, ${expiresAt}, true, NOW()
      )
      ON CONFLICT (provider_id, patient_user_id)
      DO UPDATE SET
        access_level = ${accessLevel},
        expires_at = ${expiresAt},
        is_active = true,
        patient_consent_given = true,
        consent_timestamp = NOW()
    `;

    await db.exec`
      INSERT INTO audit_logs (
        actor_type, actor_id, action, resource_type, 
        resource_id, patient_user_id, details, status
      )
      VALUES (
        'patient', ${userId}, 'grant_provider_access', 'patient_access',
        ${provider.id}, ${userId}, 
        ${JSON.stringify({ providerEmail, accessLevel })},
        'success'
      )
    `;

    return {
      success: true,
      message: `Access granted to ${provider.full_name}`,
    };
  }
);
