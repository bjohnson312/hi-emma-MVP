import { api } from "encore.dev/api";
import { devLogBuffer } from "../../api_v2/utils/devLogs";

export const devLogs = api(
  { method: "GET", path: "/api/v2/dev/logs", expose: true, auth: false },
  async (): Promise<{ logs: string[] }> => {
    return { logs: devLogBuffer };
  }
);
