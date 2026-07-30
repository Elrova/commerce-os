import type { SupplierCapabilities } from "./schemas";
type ScoreInput = { purchasePrice: number; targetSalePrice: number; deliveryMaxDays: number | null; moq: number; stock: number; shipsFromCountry: string | null; apiQuality?: number; capabilities: SupplierCapabilities; reliability?: number };
export function calculateSupplierCompetitiveness(input: ScoreInput) {
  const missing: string[] = [], warnings: string[] = [];
  if (input.deliveryMaxDays == null) missing.push("délai");
  if (input.reliability == null) missing.push("fiabilité");
  const margin = input.targetSalePrice > 0 ? (input.targetSalePrice - input.purchasePrice) / input.targetSalePrice : 0;
  const automationCount = Object.values(input.capabilities).filter(Boolean).length;
  const criteria = [
    ["Prix compétitif", Math.max(0, Math.min(15, margin * 25)), 15],
    ["Marge potentielle", Math.max(0, Math.min(20, margin * 40)), 20],
    ["Délai", input.deliveryMaxDays == null ? 0 : Math.max(0, 12 - input.deliveryMaxDays * .6), 12],
    ["MOQ", Math.max(0, 8 - (input.moq - 1) * 1.5), 8],
    ["Stock", input.stock === 0 ? 0 : Math.min(10, 4 + input.stock / 20), 10],
    ["Pays d’expédition", ["FR","DE","NL","PL","ES","IT","BE"].includes(input.shipsFromCountry ?? "") ? 8 : 2, 8],
    ["Qualité API", Math.min(8, (input.apiQuality ?? 60) * .08), 8],
    ["Automatisation", Math.min(8, automationCount / 12 * 8), 8],
    ["Colis neutre", input.capabilities.neutralPackaging ? 5 : 0, 5],
    ["Fiabilité", (input.reliability ?? 0) * .06, 6],
  ].map(([label, points, maximum]) => ({ label: String(label), points: Number(Number(points).toFixed(1)), maximum: Number(maximum) }));
  if (!input.capabilities.marketplaceCompatible) warnings.push("Compatibilité marketplace non confirmée.");
  if (input.stock === 0) warnings.push("Produit indisponible.");
  if (input.moq > 1) warnings.push(`MOQ de ${input.moq} unités.`);
  return { score: Math.round(criteria.reduce((sum, item) => sum + item.points, 0)), criteria, warnings, missingCriteria: missing, confidence: missing.length === 0 ? "élevée" : missing.length <= 2 ? "moyenne" : "faible", disclaimer: "Indicateur d’aide à la décision fondé sur les données disponibles, pas une garantie commerciale." };
}
