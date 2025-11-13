import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { GetPublicKeyResponse } from "./types";

const vapidPublicKey = secret("VAPIDPublicKey");

export const getPublicKey = api(
  { method: "GET", path: "/push/public-key", expose: true, auth: false },
  async (): Promise<GetPublicKeyResponse> => {
    return {
      publicKey: vapidPublicKey()
    };
  }
);
