import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import type { DeletePatientRequest, DeletePatientResponse } from "./types";

export const deletePatient = api<DeletePatientRequest, DeletePatientResponse>(
  { method: "DELETE", path: "/patients/:patient_id", expose: true },
  async (req): Promise<DeletePatientResponse> => {
    const { token, patient_id, permanent = false } = req;

    if (!token) {
      throw APIError.unauthenticated("Missing authorization token");
    }

    const providerToken = token.replace("Bearer ", "");
    const providerData = verifyProviderToken(providerToken);

    const existingPatient = await db.queryRow<{ created_by_provider_id: string }>`
      SELECT created_by_provider_id FROM patients WHERE id = ${patient_id}::uuid
    `;

    if (!existingPatient) {
      throw APIError.notFound("Patient not found");
    }

    if (existingPatient.created_by_provider_id !== providerData.providerId) {
      throw APIError.permissionDenied("You do not have permission to delete this patient");
    }

    if (permanent) {
      await db.exec`
        DELETE FROM patients WHERE id = ${patient_id}::uuid
      `;
    } else {
      await db.exec`
        UPDATE patients 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${patient_id}::uuid
      `;
    }

    return { success: true };
  }
);
