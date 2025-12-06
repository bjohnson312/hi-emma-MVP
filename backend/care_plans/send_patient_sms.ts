import { api } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";

export interface SendPatientSMSRequest {
  token: string;
  patient_id: string;
  message: string;
}

export interface SendPatientSMSResponse {
  success: boolean;
  sid: string;
}

export const sendPatientSMS = api<SendPatientSMSRequest, SendPatientSMSResponse>(
  { expose: true, method: "POST", path: "/care_plans/send_sms" },
  async ({ token, patient_id, message }) => {
    const providerResult = await db.queryRow<{ id: string }>`
      SELECT id FROM provider_credentials WHERE token = ${token}
    `;

    if (!providerResult) {
      throw new Error("Invalid provider token");
    }

    const providerId = providerResult.id;

    const patient = await db.queryRow<{ phone?: string; created_by_provider_id: string }>`
      SELECT phone, created_by_provider_id FROM patients 
      WHERE id = ${patient_id}::uuid AND is_active = true
    `;

    if (!patient) {
      throw new Error("Patient not found");
    }

    if (patient.created_by_provider_id !== providerId) {
      throw new Error("Unauthorized: You can only send SMS to your own patients");
    }

    if (!patient.phone) {
      throw new Error("Patient does not have a phone number on file");
    }

    const result = await sendSMS(patient.phone, message);

    return {
      success: true,
      sid: result.sid
    };
  }
);
