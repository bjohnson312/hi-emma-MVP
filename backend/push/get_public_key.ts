import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { GetPublicKeyResponse } from "./types";

const vapidPublicKey = secret("VAPIDPublicKey");

export const getPublicKey = api(
  { method: "GET", path: "/push/public-key", expose: true, auth: false },
  async (): Promise<GetPublicKeyResponse> => {
    try {
      const key = vapidPublicKey();
      if (!key) {
        throw new Error("VAPID public key not configured");
      }
      return {
        publicKey: key
      };
    } catch (error) {
      throw new Error("Push notifications are not configured. Please add VAPID keys to secrets.");
    }
  }
);
