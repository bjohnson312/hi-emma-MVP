import { api } from "encore.dev/api";
import db from "../db";

export interface ProviderAccessItem {
  providerId: string;
  providerName: string;
  providerEmail: string;
  credentials?: string;
  specialty?: string;
  organization?: string;
  accessLevel: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface ListProviderAccessRequest {
  userId: string;
}

export interface ProviderAccessResponse {
  providers: ProviderAccessItem[];
}

export const listProviderAccess = api<ListProviderAccessRequest, ProviderAccessResponse>(
  { method: "GET", path: "/patient/provider-access/:userId", expose: true },
  async (req): Promise<ProviderAccessResponse> => {
    const { userId } = req;

    const providers = await db.query<{
      provider_id: string;
      provider_name: string;
      provider_email: string;
      credentials: string | null;
      specialty: string | null;
      organization: string | null;
      access_level: string;
      granted_at: Date;
      expires_at: Date | null;
      is_active: boolean;
    }>`
      SELECT 
        a.provider_id,
        p.full_name as provider_name,
        p.email as provider_email,
        p.credentials,
        p.specialty,
        p.organization,
        a.access_level,
        a.granted_at,
        a.expires_at,
        a.is_active
      FROM provider_patient_access a
      JOIN healthcare_providers p ON a.provider_id = p.id
      WHERE a.patient_user_id = ${userId}
      ORDER BY a.granted_at DESC
    `;

    const providersList: ProviderAccessItem[] = [];
    for await (const p of providers) {
      providersList.push({
        providerId: p.provider_id,
        providerName: p.provider_name,
        providerEmail: p.provider_email,
        credentials: p.credentials || undefined,
        specialty: p.specialty || undefined,
        organization: p.organization || undefined,
        accessLevel: p.access_level,
        grantedAt: p.granted_at,
        expiresAt: p.expires_at || undefined,
        isActive: p.is_active,
      });
    }
    
    return {
      providers: providersList,
    };
  }
);
