import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { TextToSpeechRequest } from "./types";

const elevenLabsApiKey = secret("ElevenLabsAPIKey");

export const generateSpeech = api(
  { method: "POST", path: "/voice/speak", expose: true },
  async (req: TextToSpeechRequest): Promise<{ audioUrl: string }> => {
    const { text, voiceId } = req;

    const apiKey = elevenLabsApiKey();
    if (!apiKey) {
      throw new Error("ElevenLabs API key not configured. Please set the ElevenLabsAPIKey secret in Settings.");
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return { audioUrl };
  }
);
