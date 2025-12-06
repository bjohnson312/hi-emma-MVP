import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import type { LinkUserRequest, LinkUserResponse, Patient } from "./types";

export const linkUser = api<LinkUserRequest, LinkUserResponse>(
  { method: "POST", path: "/patients/:patient_id/link-user", expose: true },
  async (req): Promise<LinkUserResponse> => {
    const { token, patient_id, user_id } = req;

    if (!token) {
      throw APIError.unauthenticated("Missing authorization token");
    }

    const providerToken = token.replace("Bearer ", "");
    const providerData = verifyProviderToken(providerToken);

    const existingPatient = await db.queryRow<{ created_by_provider_id: string; user_id: string | null }>`
      SELECT created_by_provider_id, user_id FROM patients WHERE id = ${patient_id}::uuid
    `;

    if (!existingPatient) {
      throw APIError.notFound("Patient not found");
    }

    if (existingPatient.created_by_provider_id !== providerData.providerId) {
      throw APIError.permissionDenied("You do not have permission to modify this patient");
    }

    const userExists = await db.queryRow<{ id: string }>`
      SELECT id FROM users WHERE id = ${user_id}
    `;

    if (!userExists) {
      throw APIError.notFound("User not found");
    }

    const alreadyLinked = await db.queryRow<{ id: string }>`
      SELECT id FROM patients 
      WHERE user_id = ${user_id} 
        AND id != ${patient_id}::uuid
        AND is_active = true
    `;

    if (alreadyLinked) {
      throw APIError.alreadyExists("This user is already linked to another patient");
    }

    const patient = await db.queryRow<Patient>`
      UPDATE patients 
      SET user_id = ${user_id}, updated_at = NOW()
      WHERE id = ${patient_id}::uuid
      RETURNING *
    `;

    if (!patient) {
      throw APIError.internal("Failed to link user to patient");
    }

    return { patient };
  }
);
