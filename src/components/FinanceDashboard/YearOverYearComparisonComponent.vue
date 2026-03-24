<template>
  <div>
    <div v-if="isSharingReport" class="report-loading-overlay">
      <div class="report-loading-content">
        <q-spinner size="56px" color="primary" />
        <div class="q-mt-md text-body2">Preparing report...</div>
      </div>
    </div>

    <div ref="reportRef">
      <div class="row full-width q-mb-md items-start">
        <div class="col">
          <div class="text-h5 text-weight-bold">Year-over-year comparison</div>
          <div class="text-body1 text-grey-7">
            Annual trend analysis for {{ previousYearLabel }} vs {{ selectedYear }}
          </div>
          <div v-if="comparisonCutoffLabel" class="text-caption text-weight-medium">
            {{ comparisonCutoffLabel }}
          </div>
        </div>
        <div class="col-auto">
          <div class="row q-col-gutter-sm">
            <div class="col-auto">
              <q-btn
                color="positive"
                icon="download"
                label="Download Report"
                unelevated
                rounded
                class="report-download-button"
                no-caps
                :loading="isSharingReport"
                :disable="isLoading || !hasAnyData"
                @click="shareReportPdf"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-previous text-white" flat>
            <q-card-section>
              <div class="text-subtitle2">{{ previousYearLabel }} net collection</div>
              <div class="text-h4 text-weight-bold">₱{{ formatCurrency(previousYearNet) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-current text-white" flat>
            <q-card-section>
              <div class="text-subtitle2">{{ selectedYear }} net collection</div>
              <div class="text-h4 text-weight-bold">₱{{ formatCurrency(currentYearNet) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-growth text-white" flat>
            <q-card-section>
              <div class="text-subtitle2">Growth</div>
              <div class="text-h4 text-weight-bold">{{ growthLabel }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card class="rounded-borders" flat bordered>
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="trending_up"></q-icon>
            Monthly Collections - {{ previousYearLabel }} vs {{ selectedYear }}
          </div>

          <div v-if="!hasAnyData" class="text-body2 text-grey-6">
            No transactions found for {{ previousYearLabel }} and {{ selectedYear }}.
          </div>

          <div v-else class="comparison-table-wrap">
            <q-table
              class="comparison-q-table"
              :rows="monthlyRows"
              :columns="columns"
              row-key="monthIndex"
              flat
              hide-pagination
              :rows-per-page-options="[0]"
              :loading="isLoading"
            >
              <template v-slot:body-cell-monthLabel="props">
                <q-td :props="props" class="text-weight-medium">{{ props.row.monthLabel }}</q-td>
              </template>

              <template v-slot:body-cell-previousCollections="props">
                <q-td :props="props" class="text-right">
                  {{
                    formatMetricCell(
                      props.row.previousCollections,
                      props.row.hasPreviousCollections,
                    )
                  }}
                </q-td>
              </template>

              <template v-slot:body-cell-currentCollections="props">
                <q-td :props="props" class="text-right text-weight-medium">
                  {{
                    formatMetricCell(props.row.currentCollections, props.row.hasCurrentCollections)
                  }}
                </q-td>
              </template>

              <template v-slot:body-cell-changeLabel="props">
                <q-td :props="props">
                  <q-badge
                    v-if="props.row.changeLabel && props.row.changeLabel !== '--'"
                    class="change-pill"
                    :class="props.row.changeClass"
                    rounded
                  >
                    {{ props.row.changeLabel }}
                  </q-badge>
                  <span v-else>{{ props.row.changeLabel || '--' }}</span>
                </q-td>
              </template>

              <template v-slot:body-cell-previousExpenses="props">
                <q-td :props="props" class="text-right">
                  {{ formatMetricCell(props.row.previousExpenses, props.row.hasPreviousExpenses) }}
                </q-td>
              </template>

              <template v-slot:body-cell-currentExpenses="props">
                <q-td :props="props" class="text-right text-weight-medium">
                  {{ formatMetricCell(props.row.currentExpenses, props.row.hasCurrentExpenses) }}
                </q-td>
              </template>
            </q-table>
          </div>

          <div class="comparison-legend q-mt-md">
            <div class="legend-item">
              <span class="legend-dot legend-dot-previous"></span>
              <span>{{ previousYearLabel }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot-current"></span>
              <span>{{ selectedYear }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar, type QTableColumn } from 'quasar';
import { printReportAsPdf } from 'src/services/print.service';
import {
  computeNetCollection,
  computeRemittanceDeductions,
} from 'src/services/financial-calculations.service';
import type { Transaction } from 'src/databases/entities/transaction';
import { useAnalyticsStore } from 'src/stores/analytics-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useTransactionsStore } from 'src/stores/transactions-store';

interface MonthlyBucket {
  monthIndex: number;
  monthLabel: string;
  collections: number;
  expenses: number;
  nonRemittableExpenses: number;
  hasCollections: boolean;
  hasExpenses: boolean;
}

interface MonthlyComparisonRow {
  monthIndex: number;
  monthLabel: string;
  previousCollections: number;
  currentCollections: number;
  previousExpenses: number;
  currentExpenses: number;
  hasPreviousCollections: boolean;
  hasCurrentCollections: boolean;
  hasPreviousExpenses: boolean;
  hasCurrentExpenses: boolean;
  changeLabel: string;
  changeClass: string;
}

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const loadReportDelayMs = 300;

const $q = useQuasar();
const analyticsStore = useAnalyticsStore();
const transactionsStore = useTransactionsStore();
const settingsStore = useSettingsStore();

const { selectedYear, selectedYearNumber, previousYearLabel } = storeToRefs(analyticsStore);

const reportRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const isSharingReport = ref(false);
const loadReportTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const currentYearTransactions = ref<Transaction[]>([]);
const previousYearTransactions = ref<Transaction[]>([]);

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLatestTransactionMonthIndex(transactions: Transaction[]): number | null {
  let latestDate = '';

  for (const transaction of transactions) {
    if (!transaction.date) {
      continue;
    }

    if (transaction.date > latestDate) {
      latestDate = transaction.date;
    }
  }

  if (!latestDate) {
    return null;
  }

  const monthFromDate = Number.parseInt(latestDate.slice(5, 7), 10) - 1;
  if (monthFromDate < 0 || monthFromDate > 11) {
    return null;
  }

  return monthFromDate;
}

function getMonthEndDateString(year: number, monthIndex: number): string {
  const monthEnd = new Date(year, monthIndex + 1, 0);
  const month = `${monthEnd.getMonth() + 1}`.padStart(2, '0');
  const day = `${monthEnd.getDate()}`.padStart(2, '0');
  return `${monthEnd.getFullYear()}-${month}-${day}`;
}

function buildMonthlyBuckets(transactions: Transaction[]): MonthlyBucket[] {
  const buckets = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    monthLabel: monthLabels[monthIndex]!,
    collections: 0,
    expenses: 0,
    nonRemittableExpenses: 0,
    hasCollections: false,
    hasExpenses: false,
  }));

  for (const transaction of transactions) {
    if (!transaction.date) {
      continue;
    }

    const monthFromDate = Number.parseInt(transaction.date.slice(5, 7), 10) - 1;
    if (monthFromDate < 0 || monthFromDate > 11) {
      continue;
    }

    if (transaction.transaction_type === 'Collections') {
      buckets[monthFromDate]!.collections += transaction.amount;
      buckets[monthFromDate]!.hasCollections = true;
    } else if (transaction.transaction_type === 'Expenses') {
      buckets[monthFromDate]!.expenses += transaction.amount;
      buckets[monthFromDate]!.hasExpenses = true;
      if (transaction.non_remittable === 1) {
        buckets[monthFromDate]!.nonRemittableExpenses += transaction.amount;
      }
    }
  }

  return buckets;
}

function buildYearTotals(transactions: Transaction[]) {
  const collections = transactions
    .filter((transaction) => transaction.transaction_type === 'Collections')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = transactions
    .filter((transaction) => transaction.transaction_type === 'Expenses')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const nonRemittableExpenses = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === 'Expenses' && transaction.non_remittable === 1,
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const remittableExpenses = expenses - nonRemittableExpenses;

  const gross = collections - remittableExpenses;
  const { national, district } = computeRemittanceDeductions(
    gross,
    settingsStore.nationalPercent,
    settingsStore.districtPercent,
  );
  const net = computeNetCollection({
    grossCollection: gross,
    national,
    district,
    nonRemittableExpenses,
  });

  return {
    collections,
    expenses,
    nonRemittableExpenses,
    gross,
    net,
  };
}

function formatCollectionsChange(
  current: number,
  previous: number,
): {
  label: string;
  className: string;
} {
  if (previous === 0) {
    return {
      label: '--',
      className: 'change-pill--neutral',
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  const sign = percentage > 0 ? '+' : '';
  const rounded = `${sign}${percentage.toFixed(1)}%`;

  if (percentage > 0) {
    return {
      label: rounded,
      className: 'change-pill--positive',
    };
  }

  if (percentage < 0) {
    return {
      label: rounded,
      className: 'change-pill--negative',
    };
  }

  return {
    label: rounded,
    className: 'change-pill--neutral',
  };
}

function formatMetricCell(value: number, hasData: boolean): string {
  return hasData ? `₱${formatCurrency(value)}` : '--';
}

const previousYearMonthlyBuckets = computed(() => {
  return buildMonthlyBuckets(previousYearTransactions.value);
});

const currentYearMonthlyBuckets = computed(() => {
  return buildMonthlyBuckets(currentYearTransactions.value);
});

const latestSelectedYearMonthIndex = computed(() => {
  return getLatestTransactionMonthIndex(currentYearTransactions.value);
});

const comparisonCutoffLabel = computed(() => {
  const latestMonthIndex = latestSelectedYearMonthIndex.value;

  if (
    latestMonthIndex === null ||
    latestMonthIndex === monthLabels.length - 1 ||
    !selectedYear.value ||
    !previousYearLabel.value
  ) {
    return '';
  }

  const cutoffMonthLabel = monthLabels[latestMonthIndex];
  return `Growth is compared from January to ${cutoffMonthLabel} for both years`;
});

const currentYearComparisonTransactions = computed(() => {
  const currentYear = selectedYearNumber.value;
  const latestMonthIndex = latestSelectedYearMonthIndex.value;

  if (!currentYear || latestMonthIndex === null) {
    return [] as Transaction[];
  }

  const currentYearCutoffDate = getMonthEndDateString(currentYear, latestMonthIndex);
  return currentYearTransactions.value.filter(
    (transaction) => transaction.date && transaction.date <= currentYearCutoffDate,
  );
});

const previousYearComparisonTransactions = computed(() => {
  const currentYear = selectedYearNumber.value;
  const latestMonthIndex = latestSelectedYearMonthIndex.value;

  if (!currentYear || latestMonthIndex === null) {
    return [] as Transaction[];
  }

  const previousYearCutoffDate = getMonthEndDateString(currentYear - 1, latestMonthIndex);
  return previousYearTransactions.value.filter(
    (transaction) => transaction.date && transaction.date <= previousYearCutoffDate,
  );
});

const previousYearTotals = computed(() => {
  return buildYearTotals(previousYearComparisonTransactions.value);
});

const currentYearTotals = computed(() => {
  return buildYearTotals(currentYearComparisonTransactions.value);
});

function hasMonthlyData(bucket: MonthlyBucket): boolean {
  return bucket.hasCollections || bucket.hasExpenses;
}

const monthlyRows = computed((): MonthlyComparisonRow[] => {
  return monthLabels.map((monthLabel, monthIndex) => {
    const previous = previousYearMonthlyBuckets.value[monthIndex]!;
    const current = currentYearMonthlyBuckets.value[monthIndex]!;
    const previousNet = previous.collections - previous.expenses;
    const currentNet = current.collections - current.expenses;
    const hasPreviousNet = hasMonthlyData(previous);
    const hasCurrentNet = hasMonthlyData(current);
    const hasBothNetData = hasPreviousNet && hasCurrentNet;
    const change = hasBothNetData
      ? formatCollectionsChange(currentNet, previousNet)
      : {
          label: '--',
          className: 'change-pill--neutral',
        };

    return {
      monthIndex,
      monthLabel,
      previousCollections: previous.collections,
      currentCollections: current.collections,
      previousExpenses: previous.expenses,
      currentExpenses: current.expenses,
      hasPreviousCollections: previous.hasCollections,
      hasCurrentCollections: current.hasCollections,
      hasPreviousExpenses: previous.hasExpenses,
      hasCurrentExpenses: current.hasExpenses,
      changeLabel: change.label,
      changeClass: change.className,
    };
  });
});

const columns = computed((): QTableColumn<MonthlyComparisonRow>[] => {
  return [
    { name: 'monthLabel', label: 'Month', field: 'monthLabel', align: 'left' },
    {
      name: 'previousCollections',
      label: `${previousYearLabel.value} collection`,
      field: 'previousCollections',
      align: 'right',
    },
    {
      name: 'currentCollections',
      label: `${selectedYear.value} collection`,
      field: 'currentCollections',
      align: 'right',
    },
    { name: 'changeLabel', label: 'Change', field: 'changeLabel', align: 'left' },
    {
      name: 'previousExpenses',
      label: `${previousYearLabel.value} expenses`,
      field: 'previousExpenses',
      align: 'right',
    },
    {
      name: 'currentExpenses',
      label: `${selectedYear.value} expenses`,
      field: 'currentExpenses',
      align: 'right',
    },
  ];
});

const previousYearNet = computed(() => previousYearTotals.value.net);
const currentYearNet = computed(() => currentYearTotals.value.net);

const growthLabel = computed(() => {
  if (previousYearNet.value === 0) {
    return '--';
  }

  const growth = ((currentYearNet.value - previousYearNet.value) / previousYearNet.value) * 100;
  const sign = growth > 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}%`;
});

const hasAnyData = computed(() => {
  return currentYearTransactions.value.length > 0 || previousYearTransactions.value.length > 0;
});

async function loadYearComparison(): Promise<void> {
  if (!selectedYearNumber.value) {
    currentYearTransactions.value = [];
    previousYearTransactions.value = [];
    return;
  }

  isLoading.value = true;

  try {
    const currentYear = selectedYearNumber.value;
    const currentYearStartDate = `${currentYear}-01-01`;
    const currentYearEndDate = `${currentYear}-12-31`;
    const previousYearStartDate = `${currentYear - 1}-01-01`;
    const previousYearEndDate = `${currentYear - 1}-12-31`;

    const [currentData, previousData] = await Promise.all([
      transactionsStore.fetchTransactionsByDateRange(currentYearStartDate, currentYearEndDate),
      transactionsStore.fetchTransactionsByDateRange(previousYearStartDate, previousYearEndDate),
    ]);

    currentYearTransactions.value = currentData;
    previousYearTransactions.value = previousData;
  } catch {
    currentYearTransactions.value = [];
    previousYearTransactions.value = [];
    $q.notify({
      type: 'negative',
      message: 'Failed to load year-over-year data. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isLoading.value = false;
  }
}

async function shareReportPdf(): Promise<void> {
  if (!hasAnyData.value) {
    $q.notify({
      type: 'info',
      message: 'No comparison data available to export.',
      position: 'bottom-right',
    });
    return;
  }

  if (!reportRef.value) {
    $q.notify({
      type: 'negative',
      message: 'Comparison content is not ready to export yet.',
      position: 'bottom-right',
    });
    return;
  }

  if (!selectedYear.value) {
    $q.notify({
      type: 'info',
      message: 'Please select a year to export.',
      position: 'bottom-right',
    });
    return;
  }

  if (isSharingReport.value) {
    return;
  }

  isSharingReport.value = true;
  try {
    await nextTick();

    await printReportAsPdf({
      reportElement: reportRef.value,
      selectedMonth: `${selectedYear.value}-01`,
      shareTitle: 'Year-over-Year Comparison (PDF)',
      shareText: `Year-over-Year Comparison PDF for ${previousYearLabel.value} vs ${selectedYear.value}`,
      dialogTitle: 'Share or Print Comparison',
    });

    $q.notify({
      type: 'positive',
      message: 'Comparison PDF is ready to share or print.',
      position: 'bottom-right',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    $q.notify({
      type: 'negative',
      message: `Failed to export comparison PDF. ${errorMessage}`,
      position: 'bottom-right',
      timeout: 0,
      closeBtn: true,
    });
  } finally {
    isSharingReport.value = false;
  }
}

watch(
  selectedYear,
  () => {
    if (loadReportTimeout.value) {
      clearTimeout(loadReportTimeout.value);
    }

    loadReportTimeout.value = setTimeout(() => {
      void loadYearComparison();
      loadReportTimeout.value = null;
    }, loadReportDelayMs);
  },
  { immediate: true },
);

onMounted(async () => {
  await settingsStore.init();
  await transactionsStore.init(false);
});

onBeforeUnmount(() => {
  if (loadReportTimeout.value) {
    clearTimeout(loadReportTimeout.value);
  }
});
</script>

<style scoped lang="scss">
.summary-card {
  border-radius: 14px;
}

.summary-card-previous {
  background: linear-gradient(135deg, #1f6feb 0%, #2f81f7 100%);
}

.summary-card-current {
  background: linear-gradient(135deg, #059669 0%, #16a34a 100%);
}

.summary-card-growth {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.comparison-table-wrap {
  overflow-x: auto;
}

.comparison-q-table {
  min-width: 760px;
}

.comparison-q-table :deep(.q-table th),
.comparison-q-table :deep(.q-table td) {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
}

.comparison-q-table :deep(.q-table th) {
  color: #334155;
  font-weight: 700;
}

.comparison-q-table :deep(.q-table tbody tr:last-child td) {
  border-bottom: none;
}

.change-pill {
  display: inline-block;
  min-width: 68px;
  border-radius: 6px;
  padding: 2px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
}

.change-pill--positive {
  background: #dcfce7;
  color: #166534;
}

.change-pill--negative {
  background: #fee2e2;
  color: #991b1b;
}

.change-pill--neutral {
  background: #e2e8f0;
  color: #334155;
}

.comparison-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.legend-dot-previous {
  background: #2f81f7;
}

.legend-dot-current {
  background: #16a34a;
}

.report-download-button {
  min-height: 40px;
  padding: 0 18px;
  font-weight: 600;
}

.report-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 600px) {
  .comparison-legend {
    gap: 12px;
    flex-wrap: wrap;
  }
}

@media print {
  .comparison-table-wrap {
    overflow: visible;
  }
}
</style>
