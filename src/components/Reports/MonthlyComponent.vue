<template>
  <div>
    <div v-if="isSharingReport" class="report-loading-overlay">
      <div class="report-loading-content">
        <q-spinner size="56px" color="primary" />
        <div class="q-mt-md text-body2">Preparing report...</div>
      </div>
    </div>
    <div ref="reportRef">
      <!-- Report Header -->
      <div class="text-center q-mb-lg">
        <h1 class="text-h4 q-mb-sm" style="font-weight: 700">
          Financial Report for {{ displayMonthYear }}
        </h1>
        <p class="text-body2">Monthly Collections and Expenses Summary</p>
      </div>

      <q-card v-show="!isSharingReport" flat bordered class="report-filter-card q-mb-lg">
        <div class="report-filter-inner">
          <div class="report-filter-icon">
            <q-icon name="event" size="22px" />
          </div>
          <div class="report-filter-field">
            <div class="report-filter-label">Month:</div>
            <q-select
              v-model="selectedMonth"
              :options="monthsOptions"
              dense
              outlined
              emit-value
              map-options
              class="report-filter-select"
            />
          </div>
          <div class="report-filter-field">
            <div class="report-filter-label">Year:</div>
            <q-select
              v-model="selectedYear"
              :options="yearsOptions"
              dense
              outlined
              emit-value
              map-options
              class="report-filter-select"
            />
          </div>
          <q-btn
            color="positive"
            icon="download"
            label="Download Report"
            unelevated
            rounded
            :loading="isSharingReport"
            :disable="!rawTransactions.length || isLoading"
            class="report-filter-button"
            no-caps
          >
            <ReportDownloadMenu @download-pdf="shareReportPdf" @download-png="shareReportPng" />
          </q-btn>
        </div>
      </q-card>

      <!-- Collections and Expenses Cards -->
      <div class="row q-col-gutter-lg q-mb-lg">
        <!-- Collections Card -->
        <div class="col-12 col-md-6">
          <q-card class="rounded-borders collection-container" flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md" style="color: #1976d2; font-weight: 700">
                Collections
              </div>
              <div v-for="categoryGroup in collectionsGroups" :key="`col-${categoryGroup.name}`">
                <div class="text-subtitle2 q-mb-sm" style="font-weight: 600; color: #1976d2">
                  {{ categoryGroup.name }}
                </div>
                <q-separator class="q-mb-md" />
                <div class="q-mb-md">
                  <div
                    v-for="item in categoryGroup.items"
                    :key="`${item.id}`"
                    class="row justify-between q-my-xs"
                  >
                    <span style="color: #1565c0">
                      {{ item.category_name }}
                    </span>
                    <span style="color: #1565c0; font-weight: 500"
                      >₱{{ formatCurrency(item.total) }}</span
                    >
                  </div>
                  <q-separator class="q-mb-md" />
                  <div class="row justify-between q-mt-sm" style="font-weight: 700; color: #1565c0">
                    <span>Total</span>
                    <span>₱{{ formatCurrency(categoryGroup.subtotal) }}</span>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Expenses Card -->
        <div class="col-12 col-md-6">
          <q-card class="rounded-borders expense-container" flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md" style="color: #c41c3b; font-weight: 700">Expenses</div>
              <div v-for="categoryGroup in expensesGroups" :key="`exp-${categoryGroup.name}`">
                <div class="text-subtitle2 q-mb-sm" style="font-weight: 600; color: #c41c3b">
                  {{ categoryGroup.name }}
                </div>
                <q-separator class="q-mb-md" />
                <div class="q-mb-md">
                  <div
                    v-for="item in categoryGroup.items"
                    :key="`${item.id}`"
                    class="row justify-between q-mb-xs"
                  >
                    <span style="color: #b71c1c">
                      {{ item.category_name }}
                      <q-badge
                        v-if="
                          item.non_remittable === 1 &&
                          item.is_non_remittable_active &&
                          !isRemittanceConfigActive
                        "
                        color="deep-orange"
                        class="q-ml-xs"
                        rounded
                        outline
                      >
                        Non-remittable
                      </q-badge>
                    </span>
                    <span style="color: #b71c1c; font-weight: 500"
                      >₱{{ formatCurrency(item.total) }}</span
                    >
                  </div>
                  <q-separator></q-separator>
                  <div class="row justify-between q-mt-sm" style="font-weight: 700; color: #b71c1c">
                    <span>Total</span>
                    <span>₱{{ formatCurrency(categoryGroup.subtotal) }}</span>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-separator class="q-my-lg" />

      <!-- Summary Cards -->
      <div class="row q-col-gutter-lg q-mb-lg">
        <!-- Total Collection Card -->
        <div class="col-12 col-md-6">
          <q-card
            class="bg-primary text-white rounded-borders full-height"
            style="min-height: 100px"
            bordered
            flat
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-center full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">Total Collection</div>
                  <div class="text-h4" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.collections) }}
                  </div>
                </div>
                <q-icon name="payments" size="36px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Total Expenses Card -->
        <div class="col-12 col-md-6">
          <q-card
            class="text-white rounded-borders"
            style="background-color: #d32f2f; min-height: 100px"
            bordered
            flat
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-center full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">Total Expenses</div>
                  <div class="text-h4" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.expenses) }}
                  </div>
                  <div class="text-caption q-mt-xs">
                    Non-remittable: ₱{{ formatCurrency(summaryTotals.nonRemittableExpenses) }}
                  </div>
                </div>
                <q-icon name="payments" size="36px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- GROSS Collection Card (hidden when active config) -->
      <q-card
        v-if="!isRemittanceConfigActive"
        class="text-white rounded-borders q-mb-lg"
        style="background-color: #7b1fa2; min-height: 100px"
        bordered
        flat
      >
        <q-card-section class="column justify-between full-height">
          <div class="row justify-between items-center full-width">
            <div>
              <div class="text-subtitle2 q-mb-sm">GROSS Collection</div>
              <div class="text-caption q-mb-sm">(Total Collection - Remittable Expenses)</div>
              <div class="text-h4" style="font-weight: 700">
                ₱{{ formatCurrency(summaryTotals.gross) }}
              </div>
            </div>
            <q-icon name="payments" size="36px" class="opacity-40" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Collections after Remittances Card (shown when active config) -->
      <q-card
        v-if="isRemittanceConfigActive"
        class="text-white rounded-borders q-mb-lg"
        style="background-color: #7b1fa2; min-height: 100px"
        bordered
        flat
      >
        <q-card-section class="column justify-between full-height">
          <div class="row justify-between items-center full-width">
            <div>
              <div class="text-subtitle2 q-mb-sm">Collections after Remittances</div>
              <div class="text-caption q-mb-sm">
                (Total Collection - National 15% - District 3%)
              </div>
              <div class="text-h4" style="font-weight: 700">
                ₱{{ formatCurrency(collectionsAfterRemittances) }}
              </div>
            </div>
            <q-icon name="payments" size="36px" class="opacity-40" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Deductions Section -->
      <q-card class="rounded-borders q-mb-lg" bordered flat style="background-color: #fcf9fa">
        <q-card-section class="q-px-lg">
          <div class="text-h6 q-mb-md" style="font-weight: 700">Deductions</div>
          <q-card
            v-for="deduction in deductions"
            :key="deduction.name"
            class="row justify-between items-center q-my-md q-pa-md"
            flat
            bordered
          >
            <div>
              <div style="font-weight: 600">{{ deduction.name }}</div>
              <div class="text-caption">{{ deduction.description }}</div>
            </div>
            <div style="font-weight: 600; color: #d32f2f">
              ₱{{ formatCurrency(deduction.amount) }}
            </div>
          </q-card>
        </q-card-section>
      </q-card>

      <!-- NET Collection Card -->
      <q-card
        class="text-white rounded-borders"
        style="background-color: #388e3c; min-height: 100px"
        bordered
        flat
      >
        <q-card-section class="column justify-between full-height">
          <div class="row justify-between items-center full-width">
            <div>
              <div class="text-subtitle2 q-mb-sm">NET Collection</div>
              <div class="text-caption q-mb-sm">
                <span v-if="isRemittanceConfigActive">
                  (Collections after Remittances - Total Expenses)
                </span>
                <span v-else>
                  (GROSS - National {{ Math.round(settingsStore.nationalPercent * 100) }}% -
                  District {{ Math.round(settingsStore.districtPercent * 100) }}% - Non-remittable
                  Expenses - Central Fund Expenses)
                </span>
              </div>
              <div class="text-h4" style="font-weight: 700">
                ₱{{ formatCurrency(summaryTotals.net) }}
              </div>
            </div>
            <q-icon name="payments" size="36px" class="opacity-40" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import ReportDownloadMenu from '../ReportDownloadMenu.vue';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { date as dateUtils, useQuasar } from 'quasar';
import { printReportAsPdf, printReportAsPng } from 'src/services/print.service';
import {
  computeNetCollection,
  computeRemittanceDeductions,
} from 'src/services/financial-calculations.service';
import { isNonCentralFundExpense } from 'src/utils/expense-filters';
import { isNonRemittableActive } from 'src/utils/non-remittable';
import { TransactionType } from 'src/enums/transaction_type';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useRemittanceConfigurationsStore } from 'src/stores/remittance-configurations-store';
import type { Transaction } from 'src/databases/entities/transaction';

interface CategoryGroup {
  name: string;
  subtotal: number;
  items: Array<{
    id: string;
    category_name: string;
    total: number;
    non_remittable: number;
    effective_date: string | Date | null;
    is_non_remittable_active: boolean;
  }>;
}

interface Deduction {
  name: string;
  description: string;
  percentage: number;
  amount: number;
}

const transactionsStore = useTransactionsStore();
const settingsStore = useSettingsStore();
const remittanceStore = useRemittanceConfigurationsStore();
const $q = useQuasar();

const monthsOptions = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const yearsOptions = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { label: String(year), value: String(year) };
});

const selectedMonth = ref<string | null>(null);
const selectedYear = ref<string | null>(null);
const selectedDate = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) {
    return null;
  }
  return `${selectedYear.value}-${selectedMonth.value}`;
});

const loadReportDelayMs = 300;
const loadReportTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const isLoading = ref(false);
const isSharingReport = ref(false);
const rawTransactions = ref<Transaction[]>([]);
const reportRef = ref<HTMLElement | null>(null);

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonthYear(dateStr: string): string {
  return dateUtils.formatDate(dateStr + '-01', 'MMMM YYYY');
}

const displayMonthYear = computed((): string => {
  if (!selectedYear.value || !selectedMonth.value) {
    return 'Select month and year';
  }
  return formatMonthYear(`${selectedYear.value}-${selectedMonth.value}`);
});

const collectionsGroups = computed((): CategoryGroup[] => {
  return buildCategoryGroups(TransactionType.COLLECTIONS);
});

const expensesGroups = computed((): CategoryGroup[] => {
  return buildCategoryGroups(TransactionType.EXPENSES);
});

function buildCategoryGroups(transactionType: TransactionType): CategoryGroup[] {
  const groupMap = new Map<string, CategoryGroup>();

  rawTransactions.value
    .filter(
      (t) =>
        t.transaction_type === transactionType &&
        (transactionType !== TransactionType.EXPENSES || isNonCentralFundExpense(t)),
    )
    .forEach((transaction) => {
      const parentName = transaction.parent_name || transaction.category_name || 'Uncategorized';
      const parentKey = String(
        transaction.parent_id ?? transaction.category_id ?? `uncategorized-${transactionType}`,
      );

      if (!groupMap.has(parentKey)) {
        groupMap.set(parentKey, {
          name: parentName,
          subtotal: 0,
          items: [],
        });
      }

      const group = groupMap.get(parentKey)!;
      const categoryName = transaction.category_name || 'Uncategorized';

      // Find or create item in this group
      let item = group.items.find((i) => i.category_name === categoryName);
      if (!item) {
        item = {
          id: `${transactionType}-${parentKey}-${categoryName}`,
          category_name: categoryName,
          total: 0,
          non_remittable: transaction.non_remittable ?? 0,
          effective_date: transaction.effective_date ?? null,
          is_non_remittable_active: false,
        };
        group.items.push(item);
      }

      item.total += transaction.amount;
      item.is_non_remittable_active =
        item.is_non_remittable_active ||
        (transaction.non_remittable === 1 &&
          isNonRemittableActive(transaction.effective_date, transaction.date));
      group.subtotal += transaction.amount;
    });

  return Array.from(groupMap.values());
}

const activeRemittanceConfiguration = computed(() => {
  const config = remittanceStore.activeConfiguration;
  if (!config || !selectedDate.value) {
    return null;
  }

  const selectedDateValue = new Date(`${selectedDate.value}-01`);
  const configStart = new Date(config.start_date);
  const configEnd = new Date(config.end_date);

  return selectedDateValue >= configStart && selectedDateValue <= configEnd ? config : null;
});

const isRemittanceConfigActive = computed(() => activeRemittanceConfiguration.value !== null);

const collectionsAfterRemittances = computed(() => {
  const nationalPercentDec = settingsStore.nationalPercent;
  const districtPercentDec = settingsStore.districtPercent;
  return (
    summaryTotals.value.collections -
    summaryTotals.value.collections * nationalPercentDec -
    summaryTotals.value.collections * districtPercentDec
  );
});

const remittanceDeductionsActive = computed(() => {
  const nationalPercentDec = settingsStore.nationalPercent;
  const districtPercentDec = settingsStore.districtPercent;
  const nationalAmount = summaryTotals.value.collections * nationalPercentDec;
  const districtAmount = summaryTotals.value.collections * districtPercentDec;
  return { national: nationalAmount, district: districtAmount };
});

const summaryTotals = computed(() => {
  const legacyCollections = rawTransactions.value
    .filter((t) => t.transaction_type === TransactionType.COLLECTIONS && t.is_legacy === 1)
    .reduce((sum, t) => sum + t.amount, 0);

  const normalCollections = rawTransactions.value
    .filter((t) => t.transaction_type === TransactionType.COLLECTIONS && t.is_legacy !== 1)
    .reduce((sum, t) => sum + t.amount, 0);

  const collections = rawTransactions.value
    .filter((t) => t.transaction_type === TransactionType.COLLECTIONS)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = rawTransactions.value
    .filter((t) => isNonCentralFundExpense(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const actualNonRemittableExpenses = rawTransactions.value
    .filter(
      (t) =>
        isNonCentralFundExpense(t) &&
        t.non_remittable === 1 &&
        isNonRemittableActive(t.effective_date, t.date),
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const nonRemittableExpenses = isRemittanceConfigActive.value ? 0 : actualNonRemittableExpenses;
  const remittableExpenses = expenses - nonRemittableExpenses;

  const gross = normalCollections - remittableExpenses;

  const nationalPercentDec = settingsStore.nationalPercent;
  const districtPercentDec = settingsStore.districtPercent;

  const remittanceBase = isRemittanceConfigActive.value ? collections : gross;
  const { national, district } = computeRemittanceDeductions(
    remittanceBase,
    nationalPercentDec,
    districtPercentDec,
  );

  const net = isRemittanceConfigActive.value
    ? collections - national - district - expenses
    : computeNetCollection({
        grossCollection: legacyCollections + gross,
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
});

const deductions = computed((): Deduction[] => {
  const nationalPercentDec = settingsStore.nationalPercent;
  const districtPercentDec = settingsStore.districtPercent;
  const nationalPercent = Math.round(nationalPercentDec * 100);
  const districtPercent = Math.round(districtPercentDec * 100);

  const isActive = isRemittanceConfigActive.value;
  const baseDeductions = [
    {
      name: `National ${nationalPercent}%`,
      description: isActive
        ? `${nationalPercent}% of Total Collection`
        : `${nationalPercent}% of GROSS Collection`,
      percentage: nationalPercent,
      amount: isActive ? remittanceDeductionsActive.value.national : summaryTotals.value.national,
    },
    {
      name: `District ${districtPercent}%`,
      description: isActive
        ? `${districtPercent}% of Total Collection`
        : `${districtPercent}% of GROSS Collection`,
      percentage: districtPercent,
      amount: isActive ? remittanceDeductionsActive.value.district : summaryTotals.value.district,
    },
  ];

  if (!isActive) {
    baseDeductions.push({
      name: 'Non-remittable Expenses',
      description: 'Excluded from GROSS Collection and deducted after remittances',
      percentage: 0,
      amount: summaryTotals.value.nonRemittableExpenses,
    });
  }

  return baseDeductions;
});

async function loadReport() {
  if (!selectedMonth.value || !selectedYear.value) {
    return;
  }

  isLoading.value = true;
  try {
    const year = selectedYear.value;
    const month = selectedMonth.value;
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
    const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

    rawTransactions.value = await transactionsStore.fetchTransactionsByDateRange(
      startDate,
      endDate,
    );

    if (rawTransactions.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No transactions found for the selected period.',
        position: 'bottom-right',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load report. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isLoading.value = false;
  }
}

async function shareReportPdf() {
  if (!rawTransactions.value.length) {
    $q.notify({
      type: 'info',
      message: 'No report data available to export.',
      position: 'bottom-right',
    });
    return;
  }

  if (!reportRef.value) {
    $q.notify({
      type: 'negative',
      message: 'Report content is not ready to export yet.',
      position: 'bottom-right',
    });
    return;
  }

  const selectedDateValue = selectedDate.value;
  if (!selectedDateValue) {
    $q.notify({
      type: 'info',
      message: 'Please select a month and year to export.',
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
      selectedMonth: dateUtils.formatDate(selectedDateValue + '-01', 'YYYY-MM'),
      shareTitle: 'Monthly Financial Report (PDF)',
      shareText: `Monthly Financial Report PDF for ${formatMonthYear(selectedDateValue)}`,
      dialogTitle: 'Share or Print Report',
    });

    $q.notify({
      type: 'positive',
      message: 'Report PDF is ready to share or print.',
      position: 'bottom-right',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(JSON.stringify(error));
    $q.notify({
      type: 'negative',
      message: `Failed to export report PDF. ${errorMessage}`,
      position: 'bottom-right',
      timeout: 0,
      closeBtn: true,
    });
  } finally {
    isSharingReport.value = false;
  }
}

async function shareReportPng() {
  if (!rawTransactions.value.length) {
    $q.notify({
      type: 'info',
      message: 'No report data available to export.',
      position: 'bottom-right',
    });
    return;
  }

  if (!reportRef.value) {
    $q.notify({
      type: 'negative',
      message: 'Report content is not ready to export yet.',
      position: 'bottom-right',
    });
    return;
  }

  const selectedDateValue = selectedDate.value;
  if (!selectedDateValue) {
    $q.notify({
      type: 'info',
      message: 'Please select a month and year to export.',
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

    await printReportAsPng({
      reportElement: reportRef.value,
      selectedMonth: dateUtils.formatDate(selectedDateValue + '-01', 'YYYY-MM'),
      shareTitle: 'Monthly Financial Report (PNG)',
      shareText: `Monthly Financial Report PNG for ${formatMonthYear(selectedDateValue)}`,
      dialogTitle: 'Share or Save Report',
    });

    $q.notify({
      type: 'positive',
      message: 'Report PNG is ready to share or save.',
      position: 'bottom-right',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    $q.notify({
      type: 'negative',
      message: `Failed to export report PNG. ${errorMessage}`,
      position: 'bottom-right',
      timeout: 0,
      closeBtn: true,
    });
  } finally {
    isSharingReport.value = false;
  }
}

async function initializeReport() {
  try {
    // Fetch the most recent transaction date
    const collectionDates = await transactionsStore.fetchCollectionDates();

    if (collectionDates.length > 0 && collectionDates[0]) {
      // Use the most recent transaction date (first in the array as it's sorted DESC)
      const lastTransactionDate = collectionDates[0];
      const dateObj = new Date(lastTransactionDate);
      selectedMonth.value = String(dateObj.getMonth() + 1).padStart(2, '0');
      selectedYear.value = String(dateObj.getFullYear());
    } else {
      // Fall back to current date if no transactions exist
      const today = new Date();
      selectedMonth.value = String(today.getMonth() + 1).padStart(2, '0');
      selectedYear.value = String(today.getFullYear());
    }
  } catch {
    // Fall back to current date on error
    const today = new Date();
    selectedMonth.value = String(today.getMonth() + 1).padStart(2, '0');
    selectedYear.value = String(today.getFullYear());
  }
}

onMounted(async () => {
  await settingsStore.init();
  await remittanceStore.init(false);
  void initializeReport();
});

watch([selectedMonth, selectedYear], () => {
  if (loadReportTimeout.value) {
    clearTimeout(loadReportTimeout.value);
  }
  loadReportTimeout.value = setTimeout(() => {
    void loadReport();
    loadReportTimeout.value = null;
  }, loadReportDelayMs);
});

onBeforeUnmount(() => {
  if (loadReportTimeout.value) {
    clearTimeout(loadReportTimeout.value);
  }
});
</script>

<style scoped lang="scss">
.collection-container {
  background-color: #eff6ff;
}

.expense-container {
  background-color: #fef2f2;
}

.report-filter-card {
  background-color: #f8fafc;
  border-radius: 16px;
  border-color: #d7dde7;
  padding: 16px 18px;
}

.report-filter-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.report-filter-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #d7dde7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  background-color: #ffffff;
}

.report-filter-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-filter-label {
  font-weight: 600;
  color: #1f2937;
}

.report-filter-select {
  min-width: 140px;
}

.report-filter-button {
  min-height: 40px;
  padding: 0 18px;
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
  .report-filter-inner {
    justify-content: stretch;
  }

  .report-filter-field,
  .report-filter-button {
    width: 100%;
  }

  .report-filter-select {
    width: 100%;
  }
}
</style>
