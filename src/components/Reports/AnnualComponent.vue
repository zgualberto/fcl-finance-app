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
      <div class="q-mb-lg">
        <q-card flat bordered class="row justify-between q-pa-md rounded-borders">
          <div class="annual-header-left">
            <div class="row items-center q-mb-sm">
              <div class="text-h4 text-weight-bold">Annual Financial Report {{ selectedYear }}</div>
              <q-badge v-if="summaryTotals.gross > 0" class="annual-header-badge q-pa-sm q-ma-md">
                <q-icon name="check_circle" color="positive" class="q-mr-sm" />
                <span class="text-weight-bold">Healthy</span>
              </q-badge>
              <q-badge v-else class="annual-header-badge-warning q-pa-sm q-ma-md">
                <q-icon name="warning" color="warning" class="q-mr-sm" />
                <span class="text-weight-bold">Deficit</span>
              </q-badge>
            </div>
            <p class="text-body2 text-grey-6">Yearly Collections and Expenses Overview</p>
          </div>
          <div class="annual-header-right" v-show="!isSharingReport">
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
                  <div class="text-caption q-mb-sm" style="opacity: 0.8">
                    (GROSS - National {{ Math.round(settingsStore.nationalPercent * 100) }}% -
                    District {{ Math.round(settingsStore.districtPercent * 100) }}%)
                  </div>
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
          <!-- Financial Breakdown Chart -->
          <q-card class="rounded-borders q-mb-lg" flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md" style="font-weight: 700; color: #1f2937">
                💹 Financial Breakdown
              </div>
              <apexchart
                ref="barChartRef"
                type="bar"
                :options="barChartOptions"
                :series="barChartSeries"
                height="350"
              ></apexchart>
            </q-card-section>
          </q-card>

          <!-- Collection Distribution Chart -->
          <q-card class="rounded-borders" flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md" style="font-weight: 700; color: #1f2937">
                💰 Collection Distribution
              </div>
              <apexchart
                ref="pieChartRef"
                type="pie"
                :options="pieChartOptions"
                :series="pieChartSeries"
                height="350"
              ></apexchart>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { printReportAsPdf } from 'src/services/print.service';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { useSettingsStore } from 'src/stores/settings-store';
import type { Transaction } from 'src/databases/entities/transaction';

interface Deduction {
  name: string;
  description: string;
  percentage: number;
  amount: number;
}

const transactionsStore = useTransactionsStore();
const settingsStore = useSettingsStore();
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

  const nationalPercentDec = settingsStore.nationalPercent;
  const districtPercentDec = settingsStore.districtPercent;

  const national15 = gross * nationalPercentDec;
  const district3 = gross * districtPercentDec;
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
  const nationalPercentDec = settingsStore.nationalPercent;
  const districtPercentDec = settingsStore.districtPercent;
  const nationalPercent = Math.round(nationalPercentDec * 100);
  const districtPercent = Math.round(districtPercentDec * 100);

  return [
    {
      name: `National ${nationalPercent}%`,
      description: `${nationalPercent}% of GROSS Collection`,
      percentage: nationalPercent,
      amount: gross * nationalPercentDec,
    },
    {
      name: `District ${districtPercent}%`,
      description: `${districtPercent}% of GROSS Collection`,
      percentage: districtPercent,
      amount: gross * districtPercentDec,
    },
  ];
});

// Bar Chart Configuration (Financial Breakdown)
const barChartCategories = computed(() => {
  const nationalPercent = Math.round(settingsStore.nationalPercent * 100);
  const districtPercent = Math.round(settingsStore.districtPercent * 100);
  return [
    'Total Collection',
    'Expenses',
    'Gross Collection',
    `National (${nationalPercent}%)`,
    `District (${districtPercent}%)`,
    'NET Collection',
  ];
});

const barChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: {
      show: true,
    },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      distributed: true,
      dataLabels: {
        position: 'bottom',
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 1,
  },
  xaxis: {
    categories: barChartCategories.value,
  },
  colors: ['#1976d2', '#d32f2f', '#7b1fa2', '#d32f2f', '#d32f2f', '#388e3c'],
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 4,
  },
}));

const barChartSeries = computed(() => [
  {
    name: 'Amount',
    data: [
      summaryTotals.value.collections,
      summaryTotals.value.expenses,
      summaryTotals.value.gross,
      summaryTotals.value.national15,
      summaryTotals.value.district3,
      summaryTotals.value.net,
    ],
  },
]);

// Pie Chart Configuration (Collection Distribution)
const pieChartLabels = computed(() => {
  const nationalPercent = Math.round(settingsStore.nationalPercent * 100);
  const districtPercent = Math.round(settingsStore.districtPercent * 100);
  return [
    'NET Retained',
    `National (${nationalPercent}%)`,
    `District (${districtPercent}%)`,
    'Expenses',
  ];
});

const pieChartOptions = computed(() => ({
  chart: {
    type: 'pie',
    toolbar: {
      show: true,
    },
  },
  labels: pieChartLabels.value,
  colors: ['#388e3c', '#f97316', '#ea580c', '#d32f2f'],
  plotOptions: {
    pie: {
      dataLabels: {
        offset: -5,
      },
    },
  },
  dataLabels: {
    formatter: function (val: number) {
      return val.toFixed(1) + '%';
    },
    style: {
      fontSize: '12px',
      fontWeight: 600,
    },
  },
  legend: {
    position: 'bottom',
    fontSize: '13px',
    fontFamily: 'Roboto, sans-serif',
  },
  tooltip: {
    theme: 'light',
    style: {
      fontSize: '12px',
    },
    y: {
      formatter: function (val: number) {
        return '₱' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
      },
    },
  },
}));

const pieChartSeries = computed(() => [
  summaryTotals.value.net,
  summaryTotals.value.national15,
  summaryTotals.value.district3,
  summaryTotals.value.expenses,
]);

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

onMounted(async () => {
  await settingsStore.init();
});

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

.annual-header-badge-warning {
  background-color: #fff3e0;
  color: #f57c00;
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
