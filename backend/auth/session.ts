export function verifyToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    
    if (!payload.sub) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}
