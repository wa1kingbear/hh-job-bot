export function calculateCompetitionScore(responsesCount: number | null): number | null {
  if (responsesCount === null) return null;
  if (!Number.isInteger(responsesCount) || responsesCount < 0) {
    throw new RangeError("responsesCount must be a non-negative integer or null");
  }

  if (responsesCount <= 5) return 100;
  if (responsesCount <= 15) return 80;
  if (responsesCount <= 30) return 60;
  if (responsesCount <= 50) return 35;
  if (responsesCount <= 100) return 15;
  return 0;
}
