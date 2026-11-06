# Project Rules

## Financial computations are load-bearing (FROZEN)

Do **not** modify, refactor, "simplify", "clean up", or rename any computation listed in this file
unless the user explicitly requests that change in the current task.

- This includes: changing a formula, changing a sign/term, moving logic out of a function,
  splitting or merging functions, changing function signatures, and inlining the shared helpers
  back into components.
- Layout, wording, styling, and adding *new separate* features are allowed without permission.
- If a component is not listed, its computations are also frozen — ask before touching math.
- When adding a new computation or changing one **with explicit user approval**, update this file
  in the same change so the inventory stays authoritative.

## Canonical shared helpers

`src/services/financial-calculations.service.ts` is the single source of truth for financial math.
Every reporting view delegates here; do not re-implement this math inside components.

`computeYtdRowFinancials(row, nationalPercent, districtPercent)` — per-date rules:

- Legacy-only date (`legacyCollection > 0 && normalCollection === 0`):
  `gross = national = district = car = 0`, `net = legacyCollection` (no deductions).
- Collection-less date (zero collections, non-zero expenses): `net = -expenses`.
- Normal dates: `gross = normalCollection - remittableExpenses`.
- Covered date (`hasActiveRemittanceConfig === 1`, inside active remittance config range):
  deduction base = `collection` (Gross), `car = base - national - district`, `net = car - expenses`.
- Uncovered date (outside config range): deduction base = `gross` (CAE),
  `net = gross + legacyCollection - national - district - nonRemittableExpenses - centralFundExpenses`.
- Deductions: `national = base × nationalPercent`, `district = base × districtPercent`.

`sumYtdRowFinancials(rows, ...)` — summary totals are ALWAYS the sum of per-date computed values.
Never replace a summary with a single rolled-up aggregate or a period-level boolean:
a row's remittance base is decided per date (mixed covered/uncovered/legacy regimes can coexist).

## View-by-view inventory (implemented and verified against the reference Sheet)

### YTD Collections — `src/components/YTDCollections/IndexComponent.vue`

- Each table row: `computeYtdRowFinancials` in `mapPaginatedRows`; `isLegacy` is derived from
  `legacyCollection > 0 && normalCollection === 0`. Legacy rows display ₱0.00 for
  gross/national/district/car and `net = collection`.
- Overall Net / summary cards: `sumYtdRowFinancials` over `fetchYtdAll` (all dates in range) —
  must keep summing per-date nets so the card equals the sum of visible NET values.
- Central-fund expenses ARE subtracted from net here (no Previous Year NET add-back).

### Finance Dashboard — `src/components/FinanceDashboard/DashboardComponent.vue`

- `buildFinancialTotals` (summary card AND comparison totals):
  `net = financials.net + financials.centralFundExpenses` — Previous Year NET (central-fund
  expenses) must not reduce current-year NET.
- Comparison totals filter aggregate rows by `row.date <= month-end cutoff`.
- Expense cards show non-central expenses only: `expenses - centralFundExpenses`.

### Year-over-Year Comparison — `src/components/FinanceDashboard/YearOverYearComparisonComponent.vue`

- `buildAggregateTotals`: same central-fund add-back as Dashboard; same `row.date <= cutoff`
  filtering for both years (compared over the same month range).

### Monthly Report — `src/components/Reports/MonthlyComponent.vue`

- `periodFinancials` = `sumYtdRowFinancials` over the selected month's aggregates.
- `isRemittanceConfigActive` (any covered row in the month) switches deduction
  labels/amounts between Gross-base (covered) and CAE-base (uncovered) display.
- `summaryTotals.expenses = expenses - centralFundExpenses`; `net` has NO central-fund add-back.

### Annual Report — `src/components/Reports/AnnualComponent.vue`

- `summaryTotals` = `sumYtdRowFinancials` over the year's aggregates;
  `net = financials.net + financials.centralFundExpenses` (Previous Year NET excluded).
- Expenses shown are non-central only (`expenses - centralFundExpenses`).
- Hidden-not-removed UI flags (keep code, flip flag to re-show; do not delete):
  `showGrossCollection = ref(false)` (Gross card + Financial Breakdown bar entry),
  `showNonRemittableExpenses = ref(false)` (Deductions entry).
- Chart data derives from one `breakdownItems` list (label/color/value/hidden) —
  categories, colors, and series stay index-aligned through it.

### Data layer — `src/databases/repositories/transaction.repository.ts`

- `findYtdAllWithRemittanceFlag`, `findYtdByDatePaginatedWithRemittanceFlag`,
  `getYtdSummaryTotalsWithRemittanceFlag`: LEFT JOIN `remittance_configurations rc`
  `ON rc.status = 1 AND rc.start_date <= t.date AND rc.end_date >= t.date` — the flag is
  per transaction date, so mixed regimes keep working. Keep the
  `isLegacy = COALESCE(MAX(t.is_legacy), 0)` fix in summary totals.
- `fetchYtdAll` feeds summary computations as ONE aggregate query per view/range,
  run in parallel (Promise.all) with other fetches. Never introduce per-row queries (N+1 ban).

### Non-remittable expenses — `src/utils/non-remittable.ts`

- `isNonRemittableActive(effectiveDate, referenceDate)`: an expense is non-remittable when
  `effective_date <= referenceDate` (future-effective expenses are not yet active).

## Verification before declaring done

- `npm run lint` and `npx vue-tsc --noEmit -p tsconfig.json` must pass.
- If a computation was touched (even with approval), replay golden reference numbers:
  overall NET total `199,363.47` from the FCL Finance System Sheet, spot rows
  Apr 26 (`-242.40 / -48.48 / -3,125.12` CAE-based), Oct 4 (`2,667.90 / 533.58` Gross-based),
  expense-only Sundays (May 1 `-154,316`, Apr 30 `-36,000`).
- Users view the app on `localhost:9000`; stale bundles are a common false alarm (hard refresh).
