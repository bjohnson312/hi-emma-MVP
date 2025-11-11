import { api } from "encore.dev/api";
import type { SystemInfoResponse } from "./admin_types";

const VERSION = "1.0.0";
const RELEASE_TIMESTAMP = new Date().toISOString();
const START_TIME = Date.now();

export const getSystemInfo = api(
  { method: "GET", path: "/admin/system-info", expose: true, auth: false },
  async (): Promise<SystemInfoResponse> => {
    const uptime = Date.now() - START_TIME;

    return {
      info: {
        version: VERSION,
        releaseTimestamp: RELEASE_TIMESTAMP,
        environment: process.env.NODE_ENV || "development",
        uptime: Math.floor(uptime / 1000),
      },
    };
  }
);
