import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface RevokeProviderAccessRequest {
  userId: string;
  providerId: string;
}

export const revokeProviderAccess = api<RevokeProviderAccessRequest, { success: boolean; message: string }>(
  { method: "POST", path: "/patient/revoke-access/:providerId", expose: true },
  async (req): Promise<{ success: boolean; message: string }> => {
    const { userId, providerId } = req;

    await db.exec`
      UPDATE provider_patient_access
      SET is_active = false
      WHERE provider_id = ${providerId}::uuid
        AND patient_user_id = ${userId}
    `;

    await db.exec`
      INSERT INTO audit_logs (
        actor_type, actor_id, action, resource_type, 
        resource_id, patient_user_id, details, status
      )
      VALUES (
        'patient', ${userId}, 'revoke_provider_access', 'patient_access',
        ${providerId}, ${userId}, 
        ${JSON.stringify({ providerId })},
        'success'
      )
    `;

    return {
      success: true,
      message: "Access revoked successfully",
    };
  }
);
