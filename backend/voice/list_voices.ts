import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { ElevenLabsVoice, VoiceOption } from "./types";

const elevenLabsApiKey = secret("ElevenLabsAPIKey");

export const listVoices = api(
  { method: "GET", path: "/voice/list", expose: true },
  async (): Promise<{ voices: VoiceOption[] }> => {
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": elevenLabsApiKey(),
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch ElevenLabs voices:", response.statusText);
        return { voices: [] };
      }

      const data = await response.json() as { voices: ElevenLabsVoice[] };
      const voices: VoiceOption[] = data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        type: 'elevenlabs' as const,
        category: voice.category,
        description: voice.description,
      }));

      const order = ['Trinity', 'Sarah', 'George', 'Will'];
      voices.sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      return { voices };
    } catch (error) {
      console.error("Error fetching ElevenLabs voices:", error);
      return { voices: [] };
    }
  }
);
