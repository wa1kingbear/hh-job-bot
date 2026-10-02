function assertScore(name: string, score: number): void {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(`${name} must be between 0 and 100`);
  }
}

export function calculatePriorityScore(
  matchScore: number,
  freshnessScore: number,
  competitionScore: number | null,
): number {
  assertScore("matchScore", matchScore);
  assertScore("freshnessScore", freshnessScore);
  if (competitionScore !== null) assertScore("competitionScore", competitionScore);

  const score =
    competitionScore === null
      ? matchScore * 0.75 + freshnessScore * 0.25
      : matchScore * 0.65 + freshnessScore * 0.2 + competitionScore * 0.15;

  return Math.round(score * 100) / 100;
}
