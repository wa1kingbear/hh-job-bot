const clampScore = (score: number): number => Math.min(100, Math.max(0, score));

export function calculateFinalMatchScore(
  ruleScore: number,
  llmResult?: { score: number; confidence: number } | null,
): number {
  const normalizedRuleScore = clampScore(ruleScore);

  if (!llmResult || llmResult.confidence < 0.6) {
    return Math.round(normalizedRuleScore);
  }

  const llmScore = clampScore(llmResult.score);
  return Math.round(normalizedRuleScore * 0.7 + llmScore * 0.3);
}

export function applyPrimaryStackPenalty(score: number, primaryStack: string): number {
  if (primaryStack === "react-native") return clampScore(score - 10);
  return clampScore(score);
}
