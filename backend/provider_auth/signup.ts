import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import db from "../db";
import type { ProviderAuthResponse, ProviderSignupParams } from "./types";
import { generateProviderToken } from "./utils";

export const signup = api<ProviderSignupParams, ProviderAuthResponse>(
  { method: "POST", path: "/provider/signup", expose: true },
  async (req): Promise<ProviderAuthResponse> => {
    const params = req;
    const passwordHash = await bcrypt.hash(params.password, 10);

    try {
      const result = await db.queryRow<{
        id: string;
        email: string;
        full_name: string;
        role: string;
      }>`
        INSERT INTO healthcare_providers (
          email, password_hash, full_name, credentials, 
          specialty, organization, license_number
        )
        VALUES (
          ${params.email}, ${passwordHash}, ${params.fullName},
          ${params.credentials || null}, ${params.specialty || null},
          ${params.organization || null}, ${params.licenseNumber || null}
        )
        RETURNING id, email, full_name, role
      `;

      if (!result) {
        throw APIError.internal("Failed to create provider");
      }

      const token = generateProviderToken(result.id, result.email, result.role);

      return {
        token,
        providerId: result.id,
        email: result.email,
        fullName: result.full_name,
        role: result.role as any,
      };
    } catch (err: any) {
      if (err.message?.includes("duplicate key")) {
        throw APIError.alreadyExists("Provider with this email already exists");
      }
      throw err;
    }
  }
);
