export function calculateFreshnessScore(
  publishedAt: Date | null,
  now: Date = new Date(),
): number {
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return 0;

  const ageMinutes = Math.max(0, (now.getTime() - publishedAt.getTime()) / 60_000);

  if (ageMinutes < 15) return 100;
  if (ageMinutes < 30) return 85;
  if (ageMinutes < 60) return 70;
  if (ageMinutes < 120) return 50;
  if (ageMinutes < 360) return 30;
  if (ageMinutes < 720) return 15;
  if (ageMinutes < 1_440) return 5;
  return 0;
}
