export interface NetCollectionParams {
  grossCollection: number;
  national: number;
  district: number;
  nonRemittableExpenses: number;
}

export function computeNetCollection({
  grossCollection,
  national,
  district,
  nonRemittableExpenses,
}: NetCollectionParams): number {
  return grossCollection - national - district - nonRemittableExpenses;
}

export function computeRemittanceDeductions(
  grossCollection: number,
  nationalRate: number,
  districtRate: number,
): { national: number; district: number } {
  return {
    national: grossCollection * nationalRate,
    district: grossCollection * districtRate,
  };
}
