import { api } from "encore.dev/api";
import { getAllPresets } from "./presets";
import type { PresetTemplate } from "./presets";

interface GetPresetsResponse {
  presets: PresetTemplate[];
}

export const getPresets = api<void, GetPresetsResponse>(
  { expose: true, method: "GET", path: "/care_plans/presets" },
  async () => {
    return {
      presets: getAllPresets()
    };
  }
);
