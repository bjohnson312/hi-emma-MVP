import { api } from "encore.dev/api";

export const check = api(
  { expose: true, method: "GET", path: "/health" },
  async (): Promise<{ status: string }> => {
    return { status: "ok" };
  }
);
