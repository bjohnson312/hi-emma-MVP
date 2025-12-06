import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import type { CreatePatientRequest, CreatePatientResponse, Patient } from "./types";

export const createPatient = api<CreatePatientRequest, CreatePatientResponse>(
  { method: "POST", path: "/patients/create", expose: true },
  async (req): Promise<CreatePatientResponse> => {
    const { token, full_name, email, phone, date_of_birth, medical_record_number, address, notes } = req;

    if (!token) {
      throw APIError.unauthenticated("Missing authorization token");
    }

    const providerToken = token.replace("Bearer ", "");
    const providerData = verifyProviderToken(providerToken);

    if (!full_name || !full_name.trim()) {
      throw APIError.invalidArgument("Full name is required");
    }

    if (email && email.trim()) {
      const existingByEmail = await db.queryRow<{ id: string }>`
        SELECT id FROM patients 
        WHERE created_by_provider_id = ${providerData.providerId}::uuid 
          AND email = ${email.trim()}
          AND is_active = true
      `;

      if (existingByEmail) {
        throw APIError.alreadyExists("A patient with this email already exists");
      }
    }

    if (medical_record_number && medical_record_number.trim()) {
      const existingByMRN = await db.queryRow<{ id: string }>`
        SELECT id FROM patients 
        WHERE created_by_provider_id = ${providerData.providerId}::uuid 
          AND medical_record_number = ${medical_record_number.trim()}
          AND is_active = true
      `;

      if (existingByMRN) {
        throw APIError.alreadyExists("A patient with this medical record number already exists");
      }
    }

    const dobDate = date_of_birth ? new Date(date_of_birth) : null;

    const patient = await db.queryRow<Patient>`
      INSERT INTO patients (
        created_by_provider_id, 
        full_name, 
        email, 
        phone, 
        date_of_birth, 
        medical_record_number, 
        address, 
        notes,
        is_active
      )
      VALUES (
        ${providerData.providerId}::uuid,
        ${full_name.trim()},
        ${email?.trim() || null},
        ${phone?.trim() || null},
        ${dobDate},
        ${medical_record_number?.trim() || null},
        ${address?.trim() || null},
        ${notes?.trim() || null},
        true
      )
      RETURNING *
    `;

    if (!patient) {
      throw APIError.internal("Failed to create patient");
    }

    return { patient };
  }
);
