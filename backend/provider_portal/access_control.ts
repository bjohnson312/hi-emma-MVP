import { APIError } from "encore.dev/api";
import db from "../db";

export async function checkProviderAccess(
  providerId: string,
  patientUserId: string,
  requiredLevel: "read" | "write" | "full"
): Promise<void> {
  const access = await db.queryRow<{
    access_level: string;
    expires_at: Date | null;
    is_active: boolean;
  }>`
    SELECT access_level, expires_at, is_active
    FROM provider_patient_access
    WHERE provider_id = ${providerId}::uuid
      AND patient_user_id = ${patientUserId}
  `;

  if (!access || !access.is_active) {
    throw APIError.permissionDenied("No active access to this patient");
  }

  if (access.expires_at && new Date(access.expires_at) < new Date()) {
    throw APIError.permissionDenied("Access to this patient has expired");
  }

  const accessLevels = ["read", "write", "full"];
  const currentLevel = accessLevels.indexOf(access.access_level);
  const required = accessLevels.indexOf(requiredLevel);

  if (currentLevel < required) {
    throw APIError.permissionDenied(
      `Insufficient access level. Required: ${requiredLevel}, Current: ${access.access_level}`
    );
  }
}
