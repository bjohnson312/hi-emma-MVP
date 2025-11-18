export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function determineStreak(completions: Date[]): number {
  if (completions.length === 0) return 0;

  const sorted = [...completions].sort((a, b) => b.getTime() - a.getTime());
  let streak = 1;
  let currentDate = new Date(sorted[0]);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i]);
    prevDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      streak++;
      currentDate = prevDate;
    } else if (dayDiff > 1) {
      break;
    }
  }

  return streak;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
