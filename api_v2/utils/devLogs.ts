export const devLogBuffer: string[] = [];

export function addDevLog(message: any) {
  const timestamp = new Date().toISOString();
  devLogBuffer.push(`[DEV_LOG] ${timestamp} ${JSON.stringify(message)}`);

  if (devLogBuffer.length > 500) {
    devLogBuffer.shift();
  }
}
