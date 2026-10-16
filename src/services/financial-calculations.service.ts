export interface NetCollectionParams {
  grossCollection: number;
  national: number;
  district: number;
  nonRemittableExpenses: number;
}

export interface YtdAggregateRow {
  date: string;
  collection: number;
  legacyCollection: number;
  normalCollection: number;
  expenses: number;
  remittableExpenses: number;
  nonRemittableExpenses: number;
  centralFundExpenses: number;
  hasActiveRemittanceConfig: number;
}

export interface YtdRowFinancials {
  gross: number;
  national: number;
  district: number;
  car: number;
  net: number;
}

export function computeYtdRowFinancials(
  row: YtdAggregateRow,
  nationalPercent: number,
  districtPercent: number,
): YtdRowFinancials {
  const isLegacyRow = row.legacyCollection > 0 && row.normalCollection === 0;
  if (isLegacyRow) {
    return { gross: 0, national: 0, district: 0, car: 0, net: row.legacyCollection };
  }
  if (row.collection === 0 && row.normalCollection === 0 && row.legacyCollection === 0) {
    return { gross: 0, national: 0, district: 0, car: 0, net: -row.expenses };
  }
  const gross = row.normalCollection - row.remittableExpenses;
  const isRowCovered = Number(row.hasActiveRemittanceConfig) === 1;
  // Covered Sundays (inside config range): deductions on Gross Collection.
  // Uncovered Sundays (outside config range): deductions on CAE.
  const remittanceBase = isRowCovered ? row.collection : gross;
  const { national, district } = computeRemittanceDeductions(
    remittanceBase,
    nationalPercent,
    districtPercent,
  );
  const car = remittanceBase - national - district;
  const net = isRowCovered
    ? car - row.expenses
    : computeNetCollection({
        grossCollection: row.legacyCollection + gross,
        national,
        district,
        nonRemittableExpenses: row.nonRemittableExpenses,
      }) - row.centralFundExpenses;
  return { gross, national, district, car, net };
}

export interface YtdSummedFinancials extends YtdRowFinancials {
  collections: number;
  normalCollections: number;
  legacyCollections: number;
  expenses: number;
  remittableExpenses: number;
  nonRemittableExpenses: number;
  centralFundExpenses: number;
}

export function sumYtdRowFinancials(
  rows: YtdAggregateRow[],
  nationalPercent: number,
  districtPercent: number,
): YtdSummedFinancials {
  let collections = 0;
  let normalCollections = 0;
  let legacyCollections = 0;
  let expenses = 0;
  let remittableExpenses = 0;
  let nonRemittableExpenses = 0;
  let centralFundExpenses = 0;
  let gross = 0;
  let national = 0;
  let district = 0;
  let car = 0;
  let net = 0;
  for (const row of rows) {
    collections += row.collection;
    normalCollections += row.normalCollection;
    legacyCollections += row.legacyCollection;
    expenses += row.expenses;
    remittableExpenses += row.remittableExpenses;
    nonRemittableExpenses += row.nonRemittableExpenses;
    centralFundExpenses += row.centralFundExpenses;
    const financials = computeYtdRowFinancials(row, nationalPercent, districtPercent);
    gross += financials.gross;
    national += financials.national;
    district += financials.district;
    car += financials.car;
    net += financials.net;
  }
  return {
    collections,
    normalCollections,
    legacyCollections,
    expenses,
    remittableExpenses,
    nonRemittableExpenses,
    centralFundExpenses,
    gross,
    national,
    district,
    car,
    net,
  };
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
