import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { verifyProviderToken } from "../provider_auth/utils";
import type { UpdatePatientRequest, UpdatePatientResponse, Patient } from "./types";

export const updatePatient = api<UpdatePatientRequest, UpdatePatientResponse>(
  { method: "PUT", path: "/patients/:patient_id/update", expose: true },
  async (req): Promise<UpdatePatientResponse> => {
    const { token, patient_id, full_name, email, phone, date_of_birth, medical_record_number, address, notes } = req;

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
      throw APIError.permissionDenied("You do not have permission to update this patient");
    }

    if (email && email.trim()) {
      const duplicateEmail = await db.queryRow<{ id: string }>`
        SELECT id FROM patients 
        WHERE created_by_provider_id = ${providerData.providerId}::uuid 
          AND email = ${email.trim()}
          AND id != ${patient_id}::uuid
          AND is_active = true
      `;

      if (duplicateEmail) {
        throw APIError.alreadyExists("Another patient with this email already exists");
      }
    }

    if (medical_record_number && medical_record_number.trim()) {
      const duplicateMRN = await db.queryRow<{ id: string }>`
        SELECT id FROM patients 
        WHERE created_by_provider_id = ${providerData.providerId}::uuid 
          AND medical_record_number = ${medical_record_number.trim()}
          AND id != ${patient_id}::uuid
          AND is_active = true
      `;

      if (duplicateMRN) {
        throw APIError.alreadyExists("Another patient with this medical record number already exists");
      }
    }

    const current = await db.queryRow<Patient>`
      SELECT * FROM patients WHERE id = ${patient_id}::uuid
    `;

    if (!current) {
      throw APIError.notFound("Patient not found");
    }

    const updatedFullName = full_name !== undefined ? full_name.trim() : current.full_name;
    const updatedEmail = email !== undefined ? (email?.trim() || null) : current.email;
    const updatedPhone = phone !== undefined ? (phone?.trim() || null) : current.phone;
    const updatedDOB = date_of_birth !== undefined ? (date_of_birth ? new Date(date_of_birth) : null) : current.date_of_birth;
    const updatedMRN = medical_record_number !== undefined ? (medical_record_number?.trim() || null) : current.medical_record_number;
    const updatedAddress = address !== undefined ? (address?.trim() || null) : current.address;
    const updatedNotes = notes !== undefined ? (notes?.trim() || null) : current.notes;

    const patient = await db.queryRow<Patient>`
      UPDATE patients 
      SET 
        full_name = ${updatedFullName},
        email = ${updatedEmail},
        phone = ${updatedPhone},
        date_of_birth = ${updatedDOB},
        medical_record_number = ${updatedMRN},
        address = ${updatedAddress},
        notes = ${updatedNotes},
        updated_at = NOW()
      WHERE id = ${patient_id}::uuid
      RETURNING *
    `;

    if (!patient) {
      throw APIError.internal("Failed to update patient");
    }

    return { patient };
  }
);
