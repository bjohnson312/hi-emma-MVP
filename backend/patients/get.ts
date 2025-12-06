import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import type { GetPatientRequest, GetPatientResponse, Patient } from "./types";

export const getPatient = api<GetPatientRequest, GetPatientResponse>(
  { method: "GET", path: "/patients/:patient_id", expose: true },
  async (req): Promise<GetPatientResponse> => {
    const { token, patient_id } = req;

    if (!token) {
      throw APIError.unauthenticated("Missing authorization token");
    }

    const providerToken = token.replace("Bearer ", "");
    const providerData = verifyProviderToken(providerToken);

    const patient = await db.queryRow<Patient>`
      SELECT * FROM patients 
      WHERE id = ${patient_id}::uuid 
        AND created_by_provider_id = ${providerData.providerId}::uuid
    `;

    if (!patient) {
      throw APIError.notFound("Patient not found");
    }

    return { patient };
  }
);
