import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import db from "../db";
import type { ProviderAuthParams, ProviderAuthResponse } from "./types";
import { generateProviderToken } from "./utils";

export const login = api(
  { method: "POST", path: "/provider/login", expose: true },
  async (params: ProviderAuthParams): Promise<ProviderAuthResponse> => {
    const result = await db.queryRow<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: string;
      is_active: boolean;
    }>`
      SELECT id, email, password_hash, full_name, role, is_active
      FROM healthcare_providers
      WHERE email = ${params.email}
    `;

    if (!result) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    if (!result.is_active) {
      throw APIError.permissionDenied("Provider account is inactive");
    }

    const validPassword = await bcrypt.compare(params.password, result.password_hash);
    if (!validPassword) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    const token = generateProviderToken(result.id, result.email, result.role);

    return {
      token,
      providerId: result.id,
      email: result.email,
      fullName: result.full_name,
      role: result.role as any,
    };
  }
);
