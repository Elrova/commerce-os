export type ProductIntelligenceSignal =
  | "amazonCompetition"
  | "ebayCompetition"
  | "googleShopping"
  | "keepaHistory"
  | "salesHistory"
  | "aiAssessment";

export type ProductIntelligenceFactor = {
  signal: ProductIntelligenceSignal;
  label: string;
  status: "pending" | "available";
  contribution: number;
};

const pendingFactors: ProductIntelligenceFactor[] = [
  { signal: "amazonCompetition", label: "Concurrence Amazon", status: "pending", contribution: 0 },
  { signal: "ebayCompetition", label: "Concurrence eBay", status: "pending", contribution: 0 },
  { signal: "googleShopping", label: "Google Shopping", status: "pending", contribution: 0 },
  { signal: "keepaHistory", label: "Historique Keepa", status: "pending", contribution: 0 },
  { signal: "salesHistory", label: "Historique ELROVA", status: "pending", contribution: 0 },
  { signal: "aiAssessment", label: "Analyse IA", status: "pending", contribution: 0 },
];

export function calculateElrovaProductScore(
  factors: ProductIntelligenceFactor[] = pendingFactors,
) {
  const baseScore = 50;
  const contribution = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  return {
    score: Math.max(0, Math.min(100, Math.round(baseScore + contribution))),
    baseScore,
    factors,
    confidence: "neutral" as const,
    disclaimer: "Score neutre provisoire. Aucun signal marketplace, historique ou IA n’est encore connecté.",
  };
}
