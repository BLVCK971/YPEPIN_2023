// Traduction d'une estimation lue en lignes de chiffrage, reprise de
// apps/api/src/modules/archives/archive.service.ts (buildRepairLines,
// collectSuggestedZones) : la démo applique les mêmes règles que le vrai
// import — barème par opération, ingrédients en poste global, contrôle contre
// le total imprimé — avec les mêmes fonctions de lecture des libellés.
import {
  cleanPartLabel,
  operationFromFrenchLabel,
  partTypeFromFrenchLabel,
  zoneFromFrenchLabel,
  type EstimateRates,
  type LaborScale,
  type ParsedEstimate,
  type PartType,
  type RepairOperation,
  type SuggestedZone,
  type VehicleZone,
} from "@/../../../packages/domain/dist/index.js";

export type RepairLineDraft = {
  operation: RepairOperation;
  partType: PartType;
  laborScale: LaborScale | null;
  partRef: string | null;
  partLabel: string | null;
  partCostCents: number;
  laborMinutes: number;
  laborCostCents: number;
  paintCostCents: number;
  zone: VehicleZone | null;
};

function rateFor(scale: LaborScale | null, rates: EstimateRates): number | null {
  switch (scale) {
    case "t2":
      return rates.bodyworkT2Cents;
    case "t3":
      return rates.bodyworkT3Cents;
    case "paint":
      return rates.paintCents;
    default:
      return rates.bodyworkT1Cents;
  }
}

function laborCents(minutes: number, hourlyCents: number | null): number {
  if (hourlyCents === null || minutes <= 0) return 0;
  return Math.round((minutes / 60) * hourlyCents);
}

export function buildRepairLines(estimate: ParsedEstimate): { lines: RepairLineDraft[]; warnings: string[] } {
  const lines: RepairLineDraft[] = [];
  const warnings: string[] = [];
  const { rates } = estimate;

  for (const part of estimate.parts) {
    lines.push({
      operation: "replace",
      partType: partTypeFromFrenchLabel(part.label),
      laborScale: null,
      partRef: part.reference,
      partLabel: cleanPartLabel(part.label),
      partCostCents: part.totalCents,
      laborMinutes: 0,
      laborCostCents: 0,
      paintCostCents: 0,
      zone: zoneFromFrenchLabel(part.label),
    });
  }

  if (!estimate.operations.some((op) => op.scale !== null) && estimate.operations.length > 0) {
    warnings.push(
      "Colonnes T1/T2/T3 introuvables dans ce modèle de PDF : toute la main-d'œuvre est valorisée au taux T1, à vérifier.",
    );
  }

  for (const op of estimate.operations) {
    const scale = op.scale ?? "t1";
    lines.push({
      operation: operationFromFrenchLabel(op.label),
      partType: "none",
      laborScale: scale,
      partRef: op.code,
      partLabel: op.label,
      partCostCents: 0,
      laborMinutes: op.minutes,
      laborCostCents: laborCents(op.minutes, rateFor(scale, rates)),
      paintCostCents: 0,
      zone: zoneFromFrenchLabel(op.label),
    });
  }

  for (const op of estimate.paintOperations) {
    lines.push({
      operation: "paint",
      partType: "none",
      laborScale: "paint",
      partRef: op.code,
      partLabel: op.label,
      partCostCents: 0,
      laborMinutes: op.minutes,
      laborCostCents: 0,
      paintCostCents: laborCents(op.minutes, rates.paintCents),
      zone: zoneFromFrenchLabel(op.label),
    });
  }

  const ingredients = estimate.totals.ingredientsCents ?? 0;
  if (ingredients > 0) {
    lines.push({
      operation: "paint",
      partType: "none",
      laborScale: "ingredients",
      partRef: null,
      partLabel: "Ingrédients peinture",
      partCostCents: 0,
      laborMinutes: 0,
      laborCostCents: 0,
      paintCostCents: ingredients,
      zone: null,
    });
  }

  // Seul garde-fou contre une erreur de lecture : la somme des lignes doit
  // retomber sur le total HT imprimé. Un écart est signalé, jamais corrigé.
  const computed = lines.reduce((sum, l) => sum + l.partCostCents + l.laborCostCents + l.paintCostCents, 0);
  const printed = estimate.totals.totalHtCents;
  if (printed !== null && computed !== printed) {
    warnings.push(
      `Le total reconstitué (${(computed / 100).toFixed(2)} €) diffère du total HT du PDF (${(printed / 100).toFixed(2)} €) de ${((computed - printed) / 100).toFixed(2)} € — chiffrage à vérifier.`,
    );
  }

  return { lines, warnings };
}

export function collectSuggestedZones(lines: RepairLineDraft[]): SuggestedZone[] {
  const byZone = new Map<VehicleZone, SuggestedZone>();
  for (const line of lines) {
    if (line.zone === null) continue;
    const cost = line.partCostCents + line.laborCostCents + line.paintCostCents;
    const existing = byZone.get(line.zone);
    if (existing === undefined) {
      byZone.set(line.zone, { zone: line.zone, labels: line.partLabel === null ? [] : [line.partLabel], totalCents: cost });
      continue;
    }
    existing.totalCents += cost;
    if (line.partLabel !== null && !existing.labels.includes(line.partLabel)) existing.labels.push(line.partLabel);
  }
  return [...byZone.values()].sort((a, b) => b.totalCents - a.totalCents);
}

/** Année de première mise en circulation, pour le champ « année » du dossier. */
export function registrationYear(firstRegistration: string | null): number | null {
  if (firstRegistration === null) return null;
  const year = Number.parseInt(firstRegistration.slice(0, 4), 10);
  return Number.isFinite(year) && year >= 1950 && year <= 2100 ? year : null;
}

/** Immatriculation au format AA-123-AA lue dans le nom de l'archive, comme le vrai import. */
export function plateFromArchiveName(name: string): string | null {
  const base = name.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
  const match = /([A-Z]{2}-?\d{3}-?[A-Z]{2})/i.exec(base);
  if (match === null) return null;
  const plate = match[1].toUpperCase().replace(/-/g, "");
  return `${plate.slice(0, 2)}-${plate.slice(2, 5)}-${plate.slice(5, 7)}`;
}
