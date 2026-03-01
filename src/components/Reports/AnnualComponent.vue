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
      <div class="q-mb-lg" v-show="!isSharingReport">
        <q-card flat bordered class="row justify-between q-pa-md rounded-borders">
          <div class="annual-header-left">
            <div class="row items-center q-mb-sm">
              <div class="text-h4 text-weight-bold">Annual Financial Report {{ selectedYear }}</div>
              <q-badge class="annual-header-badge q-pa-sm q-ma-md">
                <q-icon name="check_circle" color="positive" class="q-mr-sm" />
                <span class="text-weight-bold">Healthy</span>
              </q-badge>
            </div>
            <p class="text-body2 text-grey-6">Yearly Collections and Expenses Overview</p>
          </div>
          <div class="annual-header-right">
            <div class="row items-center q-gutter-md">
              <q-icon name="event" size="24px" class="text-grey-6" />
              <q-select
                v-model="selectedYear"
                :options="yearsOptions"
                dense
                outlined
                emit-value
                map-options
                class="annual-header-select"
              />
            </div>
            <q-btn
              color="positive"
              icon="download"
              label="Download"
              unelevated
              rounded
              @click="shareReportPdf"
              :loading="isSharingReport"
              :disable="!rawTransactions.length || isLoading"
              class="annual-download-button"
              no-caps
            />
          </div>
        </q-card>
      </div>

      <!-- Main Content: Left Sidebar + Right Charts -->
      <div class="row">
        <!-- Left Sidebar -->
        <div class="col-12 col-md-4 q-pr-md">
          <!-- Total Collection Card -->
          <q-card
            class="bg-primary text-white rounded-borders q-mb-lg"
            style="min-height: 120px"
            bordered
            flat
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">Total Collection</div>
                  <div class="text-h5" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.collections) }}
                  </div>
                </div>
                <q-icon name="trending_up" size="28px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>

          <!-- Total Expenses Card -->
          <q-card
            class="text-white rounded-borders q-mb-lg"
            style="background-color: #d32f2f; min-height: 120px"
            bordered
            flat
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">Total Expenses</div>
                  <div class="text-h5" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.expenses) }}
                  </div>
                  <div class="text-caption q-mt-xs">{{ expensePercentage }}% of Collection</div>
                </div>
                <q-icon name="trending_down" size="28px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>

          <!-- Gross Collection Card -->
          <q-card
            class="text-white rounded-borders q-mb-lg"
            style="background-color: #7b1fa2; min-height: 120px"
            bordered
            flat
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">GROSS Collection</div>
                  <div class="text-caption q-mb-sm" style="opacity: 0.8">
                    (Total Collection - Total Expenses)
                  </div>
                  <div class="text-h5" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.gross) }}
                  </div>
                </div>
                <q-icon name="payments" size="28px" class="opacity-40" />
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
            style="background-color: #388e3c; min-height: 120px"
            bordered
            flat
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-start full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">NET Collection</div>
                  <div class="text-caption q-mb-sm" style="opacity: 0.8">(GROSS - Deductions)</div>
                  <div class="text-h5" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.net) }}
                  </div>
                </div>
                <q-icon name="check_circle" size="28px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Charts Section -->
        <div class="col-12 col-md-8">
          <!-- Financial Breakdown Chart Placeholder -->
          <q-card class="rounded-borders q-mb-lg" flat bordered style="min-height: 300px">
            <q-card-section>
              <div class="text-h6 q-mb-md" style="font-weight: 700; color: #1f2937">
                💹 Financial Breakdown
              </div>
              <div
                class="row items-center justify-center"
                style="min-height: 250px; background-color: #f8fafc; border-radius: 8px"
              >
                <!-- TODO: Horizontal bar chart showing annual collection breakdown by category -->
                <div class="text-center">
                  <q-icon name="bar_chart" size="48px" color="grey-4" />
                  <div class="q-mt-md text-body2 text-grey-6">
                    Financial breakdown chart - Coming soon
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Collection Distribution Chart Placeholder -->
          <q-card class="rounded-borders" flat bordered style="min-height: 300px">
            <q-card-section>
              <div class="text-h6 q-mb-md" style="font-weight: 700; color: #1f2937">
                💰 Collection Distribution
              </div>
              <div
                class="row items-center justify-center"
                style="min-height: 250px; background-color: #f8fafc; border-radius: 8px"
              >
                <!-- TODO: Pie chart showing collection distribution (NET retained, National 15%, District 3%, Expenses) -->
                <div class="text-center">
                  <q-icon name="pie_chart" size="48px" color="grey-4" />
                  <div class="q-mt-md text-body2 text-grey-6">Distribution chart - Coming soon</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { printReportAsPdf } from 'src/services/print.service';
import { useTransactionsStore } from 'src/stores/transactions-store';
import type { Transaction } from 'src/databases/entities/transaction';

interface Deduction {
  name: string;
  description: string;
  percentage: number;
  amount: number;
}

const transactionsStore = useTransactionsStore();
const $q = useQuasar();

const yearsOptions = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { label: String(year), value: String(year) };
});

const today = new Date();
const currentYear = String(today.getFullYear());

const selectedYear = ref<string | null>(currentYear);

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

const summaryTotals = computed(() => {
  const collections = rawTransactions.value
    .filter((t) => t.transaction_type === 'Collections')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = rawTransactions.value
    .filter((t) => t.transaction_type === 'Expenses')
    .reduce((sum, t) => sum + t.amount, 0);

  const gross = collections - expenses;

  const national15 = gross * 0.15;
  const district3 = gross * 0.03;
  const net = gross - national15 - district3;

  return {
    collections,
    expenses,
    gross,
    national15,
    district3,
    net,
  };
});

const expensePercentage = computed(() => {
  if (summaryTotals.value.collections === 0) return '0';
  const percentage = (summaryTotals.value.expenses / summaryTotals.value.collections) * 100;
  return percentage.toFixed(1);
});

const deductions = computed((): Deduction[] => {
  const gross = summaryTotals.value.gross;
  return [
    {
      name: 'National 15%',
      description: '15% of GROSS Collection',
      percentage: 15,
      amount: gross * 0.15,
    },
    {
      name: 'District 3%',
      description: '3% of GROSS Collection',
      percentage: 3,
      amount: gross * 0.03,
    },
  ];
});

async function loadReport() {
  if (!selectedYear.value) {
    return;
  }

  isLoading.value = true;
  try {
    const year = selectedYear.value;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    rawTransactions.value = await transactionsStore.fetchTransactionsByDateRange(
      startDate,
      endDate,
    );

    if (rawTransactions.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No transactions found for the selected year.',
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
      shareTitle: 'Annual Financial Report (PDF)',
      shareText: `Annual Financial Report PDF for ${selectedYear.value}`,
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

watch(
  selectedYear,
  () => {
    if (loadReportTimeout.value) {
      clearTimeout(loadReportTimeout.value);
    }
    loadReportTimeout.value = setTimeout(() => {
      void loadReport();
      loadReportTimeout.value = null;
    }, loadReportDelayMs);
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  if (loadReportTimeout.value) {
    clearTimeout(loadReportTimeout.value);
  }
});
</script>

<style scoped lang="scss">
.annual-header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  padding: 0;
}

.annual-header-left {
  min-width: 250px;
}

.annual-header-badge {
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
}

.annual-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.annual-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #d7dde7;
  border-radius: 8px;
  background-color: #ffffff;
}

.annual-header-select {
  min-width: 100px;
}

.annual-download-button {
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

@media (max-width: 1024px) {
  .annual-header-container {
    flex-direction: column;
  }

  .annual-header-left {
    width: 100%;
  }

  .annual-header-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .annual-header-container {
    flex-direction: column;
  }

  .annual-header-right {
    width: 100%;
    flex-direction: column;
  }

  .annual-header-controls,
  .annual-download-button {
    width: 100%;
  }

  .annual-header-select {
    width: 100%;
  }
}
</style>
