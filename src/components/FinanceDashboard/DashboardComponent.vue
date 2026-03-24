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
          <div class="text-h5 text-weight-bold">Finance Dashboard</div>
          <div class="text-body1 text-grey-7">FCL Church - {{ selectedYear }} overview</div>
          <div v-if="comparisonCutoffLabel" class="text-caption text-weight-medium">
            {{ comparisonCutoffLabel }}
          </div>
        </div>
        <div class="col-auto">
          <div class="row q-col-gutter-sm" v-show="isSharingReport == false">
            <div>
              <div class="row items-center q-gutter-md dashboard-controls-wrap">
                <q-icon name="fa-regular fa-calendar" size="24px" class="text-grey-6" />
                <q-select
                  v-model="selectedYear"
                  :options="yearsOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  class="annual-header-select"
                />
                <q-btn
                  color="positive"
                  icon="download"
                  label="Download"
                  unelevated
                  rounded
                  class="annual-download-button"
                  no-caps
                  :loading="isSharingReport"
                  :disable="isLoading || !rawTransactions.length"
                  @click="shareReportPdf"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-collection text-white full-height" flat>
            <q-card-section>
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2">Total Collections YTD</div>
                  <div class="text-h4 text-weight-bold">
                    ₱{{ formatCurrency(summaryTotals.collections) }}
                  </div>
                  <div
                    v-if="collectionsComparison.isVisible"
                    class="text-caption summary-trend"
                    :class="collectionsComparison.className"
                  >
                    {{ collectionsComparison.label }}
                  </div>
                </div>
                <q-icon name="trending_up" size="28px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-expenses text-white full-height" flat>
            <q-card-section>
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2">Total Expenses YTD</div>
                  <div class="text-h4 text-weight-bold">
                    ₱{{ formatCurrency(summaryTotals.expenses) }}
                  </div>
                  <div
                    v-if="expensesComparison.isVisible"
                    class="text-caption summary-trend"
                    :class="expensesComparison.className"
                  >
                    {{ expensesComparison.label }}
                  </div>
                  <div class="text-caption">
                    Non-remittable: ₱{{ formatCurrency(summaryTotals.nonRemittableExpenses) }}
                  </div>
                </div>
                <q-icon name="trending_down" size="28px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-net text-white full-height" flat>
            <q-card-section>
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2">Net Collection YTD</div>
                  <div class="text-h4 text-weight-bold">
                    ₱{{ formatCurrency(summaryTotals.net) }}
                  </div>
                  <div class="text-caption summary-trend" :class="netComparison.className">
                    {{ netComparison.label }}
                  </div>
                  <div class="text-caption">{{ netStatusLabel }}</div>
                </div>
                <q-icon :name="netStatusIcon" size="28px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md items-stretch">
        <div class="col-12 col-md-6">
          <q-card class="rounded-borders full-height" flat bordered>
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">Monthly Collections vs Expenses</div>
              <div
                :class="[
                  'monthly-chart-scroll-area',
                  { 'monthly-chart-scroll-area--export': isSharingReport },
                ]"
              >
                <apexchart
                  type="bar"
                  :options="monthlyBarChartOptions"
                  :series="monthlyBarChartSeries"
                  :height="monthlyBarChartHeight"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6 dashboard-main-col">
          <div class="dashboard-side-column">
            <q-card class="rounded-borders dashboard-side-card" flat bordered>
              <q-card-section>
                <div class="text-h6 text-weight-bold q-mb-md">Expense Ratio by Category</div>

                <div v-if="expenseRatioByCategory.length === 0" class="text-body2 text-grey-6">
                  No expense data available for {{ selectedYear }}.
                </div>

                <div
                  v-for="item in visibleExpenseRatioByCategory"
                  :key="item.parent"
                  class="q-mb-md expense-parent-row"
                  @click="toggleParentCategory(item.parent)"
                >
                  <div class="row items-center q-mb-xs">
                    <q-btn
                      flat
                      dense
                      round
                      :icon="
                        expandedParentCategories.has(item.parent) ? 'expand_more' : 'chevron_right'
                      "
                      size="xs"
                      :style="item.children.length === 0 ? 'visibility: hidden' : ''"
                      @click.stop="toggleParentCategory(item.parent)"
                    />
                    <div class="col text-body2 text-weight-medium q-ml-xs">
                      {{ item.parent }}
                    </div>
                    <div class="text-body2 text-weight-bold">{{ item.percentageLabel }}</div>
                  </div>
                  <q-linear-progress
                    :value="item.ratio"
                    size="8px"
                    rounded
                    track-color="grey-3"
                    :color="item.color"
                  />
                  <div
                    v-if="expandedParentCategories.has(item.parent) && item.children.length > 0"
                    class="q-mt-xs q-ml-lg"
                  >
                    <div
                      v-for="child in item.children"
                      :key="child.category"
                      class="row items-center justify-between q-py-xs"
                    >
                      <div class="text-body2 text-grey-8">
                        {{ child.category }}
                        <q-badge
                          v-if="child.isNonRemittable"
                          color="deep-orange"
                          class="q-ml-xs"
                          rounded
                          outline
                        >
                          Non-remittable
                        </q-badge>
                      </div>
                      <div class="text-body2 text-grey-7 text-weight-medium">
                        {{ child.percentageLabel }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="hasMoreExpenseCategories" class="row justify-center q-mt-sm">
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    label="Show more"
                    @click="showMoreExpenseCategories"
                  />
                </div>

                <div v-if="canShowLessExpenseCategories" class="row justify-center q-mt-sm">
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    label="Show less"
                    @click="showLessExpenseCategories"
                  />
                </div>
              </q-card-section>
            </q-card>

            <q-card class="rounded-borders dashboard-side-card" flat bordered>
              <q-card-section>
                <div class="text-h6 text-weight-bold q-mb-md">Upcoming Reminders</div>

                <q-list separator>
                  <q-item v-for="reminder in reminders" :key="reminder.title" class="q-px-none">
                    <q-item-section>
                      <q-item-label>{{ reminder.title }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge outline color="primary" class="text-weight-medium">
                        {{ reminder.displayDate }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { date as dateUtils, useQuasar } from 'quasar';
import { printReportAsPdf } from 'src/services/print.service';
import {
  computeNetCollection,
  computeRemittanceDeductions,
} from 'src/services/financial-calculations.service';
import type { Transaction } from 'src/databases/entities/transaction';
import { useAnalyticsStore } from 'src/stores/analytics-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useTransactionsStore } from 'src/stores/transactions-store';

interface MonthlyTotals {
  monthIndex: number;
  monthLabel: string;
  collections: number;
  expenses: number;
}

interface ReminderItem {
  title: string;
  displayDate: string;
}

interface ExpenseChildItem {
  category: string;
  amount: number;
  percentageLabel: string;
  isNonRemittable: boolean;
}

interface ExpenseParentItem {
  parent: string;
  amount: number;
  ratio: number;
  percentageLabel: string;
  color: string;
  isNonRemittable: boolean;
  children: ExpenseChildItem[];
}

interface YearComparison {
  isVisible: boolean;
  label: string;
  className: string;
}

const transactionsStore = useTransactionsStore();
const settingsStore = useSettingsStore();
const analyticsStore = useAnalyticsStore();
const $q = useQuasar();

const isLoading = ref(false);
const isSharingReport = ref(false);
const rawTransactions = ref<Transaction[]>([]);
const previousYearTransactions = ref<Transaction[]>([]);
const reportRef = ref<HTMLElement | null>(null);

const loadReportDelayMs = 300;
const loadReportTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const expenseCategoryPreviewCount = 4;
const showAllExpenseCategories = ref(false);
const expandedParentCategories = ref(new Set<string>());
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

const { selectedYear, yearsOptions, selectedYearNumber, previousYearLabel } =
  storeToRefs(analyticsStore);

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
    remittableExpenses,
    nonRemittableExpenses,
    gross,
    national,
    district,
    net,
  };
}

const summaryTotals = computed(() => {
  return buildYearTotals(rawTransactions.value);
});

const latestSelectedYearMonthIndex = computed(() => {
  return getLatestTransactionMonthIndex(rawTransactions.value);
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
  return `Data shown is from January to ${cutoffMonthLabel} for both years`;
});

const currentYearComparisonTransactions = computed(() => {
  const currentYear = selectedYearNumber.value;
  const latestMonthIndex = latestSelectedYearMonthIndex.value;

  if (!currentYear || latestMonthIndex === null) {
    return [] as Transaction[];
  }

  const currentYearCutoffDate = getMonthEndDateString(currentYear, latestMonthIndex);
  return rawTransactions.value.filter(
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

const currentYearComparisonTotals = computed(() => {
  return buildYearTotals(currentYearComparisonTransactions.value);
});

const previousYearTotals = computed(() => {
  return buildYearTotals(previousYearComparisonTransactions.value);
});

function buildYearComparison(
  currentValue: number,
  previousValue: number,
  invertSentiment = false,
  decimalPlaces = 0,
): YearComparison {
  if (!previousYearLabel.value || previousValue === 0) {
    return {
      isVisible: false,
      label: '',
      className: '',
    };
  }

  const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
  const roundedChange = Number(percentageChange.toFixed(decimalPlaces));
  const normalizedChange = Object.is(roundedChange, -0) ? 0 : roundedChange;
  const sign = normalizedChange > 0 ? '+' : '';
  const isIncrease = normalizedChange > 0;
  const isDecrease = normalizedChange < 0;

  let trendClass = 'summary-trend--neutral';
  if (isIncrease || isDecrease) {
    const isFavorable = invertSentiment ? isDecrease : isIncrease;
    trendClass = isFavorable ? 'summary-trend--favorable' : 'summary-trend--unfavorable';
  }

  return {
    isVisible: true,
    label: `${sign}${normalizedChange.toFixed(decimalPlaces)}% vs ${previousYearLabel.value}`,
    className: trendClass,
  };
}

const collectionsComparison = computed(() => {
  return buildYearComparison(
    currentYearComparisonTotals.value.collections,
    previousYearTotals.value.collections,
  );
});

const expensesComparison = computed(() => {
  return buildYearComparison(
    currentYearComparisonTotals.value.expenses,
    previousYearTotals.value.expenses,
    true,
  );
});

const netComparison = computed((): YearComparison => {
  const currentNet = currentYearComparisonTotals.value.net;
  const previousNet = previousYearTotals.value.net;

  if (!previousYearLabel.value || previousNet === 0) {
    return {
      isVisible: true,
      label: '--',
      className: 'summary-trend--neutral',
    };
  }

  return buildYearComparison(currentNet, previousNet, false, 1);
});

const netStatusLabel = computed(() => {
  return summaryTotals.value.net >= 0 ? 'Healthy' : 'Deficit';
});

const netStatusIcon = computed(() => {
  return summaryTotals.value.net >= 0
    ? 'fa-regular fa-circle-check'
    : 'fa-solid fa-triangle-exclamation';
});

const monthlyTotals = computed((): MonthlyTotals[] => {
  const buckets = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    monthLabel: monthLabels[monthIndex]!,
    collections: 0,
    expenses: 0,
  }));

  for (const transaction of rawTransactions.value) {
    if (!transaction.date) {
      continue;
    }

    const monthFromDate = Number.parseInt(transaction.date.slice(5, 7), 10) - 1;
    if (monthFromDate < 0 || monthFromDate > 11) {
      continue;
    }

    if (transaction.transaction_type === 'Collections') {
      buckets[monthFromDate]!.collections += transaction.amount;
    } else if (transaction.transaction_type === 'Expenses') {
      buckets[monthFromDate]!.expenses += transaction.amount;
    }
  }

  return buckets;
});

const monthlyTotalsWithData = computed(() => {
  return monthlyTotals.value.filter((month) => month.collections > 0 || month.expenses > 0);
});

const monthlyBarChartSeries = computed(() => [
  {
    name: 'Collections',
    data: monthlyTotalsWithData.value.map((month) => Number(month.collections.toFixed(2))),
  },
  {
    name: 'Expenses',
    data: monthlyTotalsWithData.value.map((month) => Number(month.expenses.toFixed(2))),
  },
]);

const monthlyBarChartHeight = computed(() => {
  const rowCount = Math.max(monthlyTotalsWithData.value.length, 1);
  const minHeight = 280;
  const maxHeight = 1200;
  const perRowHeight = 120;
  const baseHeight = 80;

  return Math.min(maxHeight, Math.max(minHeight, baseHeight + rowCount * perRowHeight));
});

const monthlyBarChartOptions = computed(
  () =>
    ({
      chart: {
        type: 'bar',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '80%',
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'end',
        style: {
          colors: ['#000'],
          fontWeight: 600,
        },
        formatter: (value: number) => `₱${formatCurrency(value)}`,
        offsetX: 68,
      },
      xaxis: {
        min: 0,
        categories: monthlyTotalsWithData.value.map((month) => month.monthLabel),
        labels: {
          formatter: (value: number) =>
            `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
          },
        },
      },
      colors: ['#1f6feb', '#d32f2f'],
      stroke: {
        show: false,
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'left',
      },
      tooltip: {
        y: {
          formatter: (value: number) => `₱${formatCurrency(value)}`,
        },
      },
    }) as ApexCharts.ApexOptions,
);

const expenseRatioByCategory = computed((): ExpenseParentItem[] => {
  const expenseTransactions = rawTransactions.value.filter(
    (transaction) => transaction.transaction_type === 'Expenses',
  );

  const totalExpense = expenseTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  if (totalExpense <= 0) {
    return [];
  }

  const parentTotals = new Map<string, number>();
  const parentNonRemittableFlags = new Map<string, boolean>();
  const childTotals = new Map<string, Map<string, { amount: number; isNonRemittable: boolean }>>();

  for (const transaction of expenseTransactions) {
    const parent = transaction.parent_name || 'Uncategorized';
    const child = transaction.category_name || parent;
    const isNonRemittable = transaction.non_remittable === 1;

    parentTotals.set(parent, (parentTotals.get(parent) ?? 0) + transaction.amount);
    parentNonRemittableFlags.set(
      parent,
      (parentNonRemittableFlags.get(parent) ?? false) || (child === parent && isNonRemittable),
    );

    if (!childTotals.has(parent)) {
      childTotals.set(parent, new Map());
    }

    const childMap = childTotals.get(parent)!;
    const existingChild = childMap.get(child);
    childMap.set(child, {
      amount: (existingChild?.amount ?? 0) + transaction.amount,
      isNonRemittable: (existingChild?.isNonRemittable ?? false) || isNonRemittable,
    });
  }

  const palette = ['deep-orange', 'orange', 'amber', 'purple', 'indigo', 'cyan', 'blue'];

  return Array.from(parentTotals.entries())
    .map(([parent, amount]) => ({
      parent,
      amount,
      ratio: amount / totalExpense,
      percentageLabel: `${((amount / totalExpense) * 100).toFixed(1)}%`,
      color: '',
      isNonRemittable: parentNonRemittableFlags.get(parent) ?? false,
      children: [] as ExpenseChildItem[],
    }))
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => {
      const childMap = childTotals.get(item.parent)!;
      const children: ExpenseChildItem[] = Array.from(childMap.entries())
        .filter(([childName]) => childName !== item.parent)
        .map(([childName, childData]) => ({
          category: childName,
          amount: childData.amount,
          percentageLabel: `${((childData.amount / totalExpense) * 100).toFixed(1)}%`,
          isNonRemittable: childData.isNonRemittable,
        }))
        .sort((a, b) => b.amount - a.amount);
      return {
        ...item,
        color: palette[index % palette.length]!,
        children,
      };
    });
});

const visibleExpenseRatioByCategory = computed((): ExpenseParentItem[] => {
  if (showAllExpenseCategories.value) {
    return expenseRatioByCategory.value;
  }

  return expenseRatioByCategory.value.slice(0, expenseCategoryPreviewCount);
});

const hasMoreExpenseCategories = computed(() => {
  return (
    !showAllExpenseCategories.value &&
    expenseRatioByCategory.value.length > expenseCategoryPreviewCount
  );
});

const canShowLessExpenseCategories = computed(() => {
  return (
    showAllExpenseCategories.value &&
    expenseRatioByCategory.value.length > expenseCategoryPreviewCount
  );
});

function showMoreExpenseCategories(): void {
  showAllExpenseCategories.value = true;
}

function showLessExpenseCategories(): void {
  showAllExpenseCategories.value = false;
}

function toggleParentCategory(parent: string): void {
  const updated = new Set(expandedParentCategories.value);
  if (updated.has(parent)) {
    updated.delete(parent);
  } else {
    updated.add(parent);
  }
  expandedParentCategories.value = updated;
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getLastSundayOfMonth(date: Date): Date {
  const lastDay = getEndOfMonth(date);
  const daysToSubtract = lastDay.getDay();
  return new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() - daysToSubtract);
}

const reminders = computed((): ReminderItem[] => {
  const today = new Date();
  const monthLabel = dateUtils.formatDate(today, 'MMMM');
  const reportDueDate = getEndOfMonth(today);
  const remittanceDueDate = getLastSundayOfMonth(today);

  return [
    {
      title: `${monthLabel} monthly report due`,
      displayDate: dateUtils.formatDate(reportDueDate, 'MMM D'),
    },
    {
      title: 'National remittance',
      displayDate: dateUtils.formatDate(remittanceDueDate, 'MMM D'),
    },
    {
      title: 'District remittance',
      displayDate: dateUtils.formatDate(remittanceDueDate, 'MMM D'),
    },
  ];
});

async function loadDashboardData(): Promise<void> {
  if (!selectedYearNumber.value) {
    rawTransactions.value = [];
    previousYearTransactions.value = [];
    return;
  }

  isLoading.value = true;

  try {
    const currentYear = selectedYearNumber.value;
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    const previousYearStartDate = `${currentYear - 1}-01-01`;
    const previousYearEndDate = `${currentYear - 1}-12-31`;

    const [currentYearTransactions, previousYearData] = await Promise.all([
      transactionsStore.fetchTransactionsByDateRange(startDate, endDate),
      transactionsStore.fetchTransactionsByDateRange(previousYearStartDate, previousYearEndDate),
    ]);

    rawTransactions.value = currentYearTransactions;
    previousYearTransactions.value = previousYearData;

    if (rawTransactions.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No transactions found for the selected year.',
        position: 'bottom-right',
      });
    }
  } catch {
    rawTransactions.value = [];
    previousYearTransactions.value = [];
    $q.notify({
      type: 'negative',
      message: 'Failed to load dashboard data. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isLoading.value = false;
  }
}

async function shareReportPdf(): Promise<void> {
  if (!rawTransactions.value.length) {
    $q.notify({
      type: 'info',
      message: 'No dashboard data available to export.',
      position: 'bottom-right',
    });
    return;
  }

  if (!reportRef.value) {
    $q.notify({
      type: 'negative',
      message: 'Dashboard content is not ready to export yet.',
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
      shareTitle: 'Finance Dashboard (PDF)',
      shareText: `Finance Dashboard PDF for ${selectedYear.value}`,
      dialogTitle: 'Share or Print Dashboard',
    });

    $q.notify({
      type: 'positive',
      message: 'Dashboard PDF is ready to share or print.',
      position: 'bottom-right',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    $q.notify({
      type: 'negative',
      message: `Failed to export dashboard PDF. ${errorMessage}`,
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
    showAllExpenseCategories.value = false;
    expandedParentCategories.value = new Set();

    if (loadReportTimeout.value) {
      clearTimeout(loadReportTimeout.value);
    }

    loadReportTimeout.value = setTimeout(() => {
      void loadDashboardData();
      loadReportTimeout.value = null;
    }, loadReportDelayMs);
  },
  { immediate: true },
);

onMounted(async () => {
  await settingsStore.init();
  await transactionsStore.init();
});

onBeforeUnmount(() => {
  if (loadReportTimeout.value) {
    clearTimeout(loadReportTimeout.value);
  }
});
</script>

<style scoped lang="scss">
.expense-parent-row {
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.summary-card {
  border-radius: 14px;
}

.summary-card-collection {
  background: linear-gradient(135deg, #1f6feb 0%, #2f81f7 100%);
}

.summary-card-expenses {
  background: linear-gradient(135deg, #d32f2f 0%, #c2185b 100%);
}

.summary-card-net {
  background: linear-gradient(135deg, #1b8f3a 0%, #0bbf4f 100%);
}

.summary-trend {
  display: inline-block;
  margin-top: 4px;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
}

.summary-trend--favorable {
  background: rgba(255, 255, 255, 0.24);
}

.summary-trend--unfavorable {
  background: rgba(0, 0, 0, 0.22);
}

.summary-trend--neutral {
  background: rgba(255, 255, 255, 0.16);
}

.annual-header-select {
  min-width: 100px;
}

.annual-download-button {
  min-height: 40px;
  padding: 0 18px;
  font-weight: 600;
}

.dashboard-main-row {
  align-items: stretch;
}

.dashboard-main-col {
  display: flex;
}

.dashboard-side-column {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.dashboard-side-card {
  flex: 1;
}

.monthly-chart-scroll-area {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
}

.monthly-chart-scroll-area--export {
  height: auto;
  overflow: visible;
  padding-right: 0;
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
  .dashboard-main-col {
    display: block;
  }

  .dashboard-side-card {
    flex: initial;
  }

  .monthly-chart-scroll-area {
    max-height: 420px;
    padding-right: 0;
  }

  .dashboard-controls-wrap {
    width: 100%;
    justify-content: flex-start;
  }

  .annual-header-select,
  .annual-download-button {
    width: 100%;
  }
}

@media print {
  .monthly-chart-scroll-area {
    height: auto;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}
</style>
