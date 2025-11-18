export function formatRoutineTime(date: Date, timezone: string): string {
  throw new Error('formatRoutineTime() not implemented');
}

export function isWithinQuietHours(
  time: Date,
  quietHours?: { start: string; end: string }
): boolean {
  throw new Error('isWithinQuietHours() not implemented');
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  throw new Error('getWeekRange() not implemented');
}

export function formatDate(date: Date, format: string): string {
  throw new Error('formatDate() not implemented');
}

export function parseDateSafe(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function differenceInDays(date1: Date, date2: Date): number {
  const ms = date1.getTime() - date2.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
