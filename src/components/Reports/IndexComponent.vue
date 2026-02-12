<template>
  <div>
    <!-- Date Selection -->
    <div class="q-mb-lg row justify-end q-gutter-sm">
      <q-btn
        rounded
        unelevated
        flat
        @click="openReportDialog"
        no-caps
        class="bg-blue-1"
        color="black"
        icon="event"
      />
      <q-btn
        rounded
        unelevated
        no-caps
        color="primary"
        icon="print"
        label="Print PDF"
        :loading="isExporting"
        :disable="isLoading || isExporting || rawTransactions.length === 0"
        @click="exportPdf"
      />
      <!-- <q-btn color="primary" rounded unelevated flat icon="event" dense @click="openReportDialog" /> -->
    </div>

    <div v-if="rawTransactions.length > 0" ref="reportRef">
      <!-- Report Header -->
      <div class="text-center q-mb-lg">
        <h1 class="text-h4 q-mb-sm" style="font-weight: 700">
          Financial Report for {{ formatMonthYear(selectedDate) }}
        </h1>
        <p class="text-subtitle2 text-primary">Monthly Collections and Expenses Summary</p>
      </div>

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
                    <span style="color: #1565c0">{{ item.category_name }}</span>
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
                    <span style="color: #b71c1c">{{ item.category_name }}</span>
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
            class="bg-primary text-white rounded-borders"
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
                </div>
                <q-icon name="payments" size="36px" class="opacity-40" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- GROSS Collection Card -->
      <q-card
        class="text-white rounded-borders q-mb-lg"
        style="background-color: #7b1fa2; min-height: 100px"
        bordered
        flat
      >
        <q-card-section class="column justify-between full-height">
          <div class="row justify-between items-center full-width">
            <div>
              <div class="text-subtitle2 q-mb-sm">GROSS Collection</div>
              <div class="text-caption q-mb-sm">(Total Collection - Total Expenses)</div>
              <div class="text-h4" style="font-weight: 700">
                ₱{{ formatCurrency(summaryTotals.gross) }}
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
              <div class="text-caption q-mb-sm">(GROSS - National 15% - District 3%)</div>
              <div class="text-h4" style="font-weight: 700">
                ₱{{ formatCurrency(summaryTotals.net) }}
              </div>
            </div>
            <q-icon name="payments" size="36px" class="opacity-40" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-card v-else-if="!isLoading && selectedDate" class="text-center q-pa-lg" flat bordered>
      <q-card-section>
        <q-icon name="info" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 q-mt-md">No transactions found for this period</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { date as dateUtils, useQuasar } from 'quasar';
import { Share } from '@capacitor/share';
import { exportElementToPdf } from 'src/services/report-pdf';
import { useTransactionsStore } from 'src/stores/transactions-store';
import type { Transaction } from 'src/databases/entities/transaction';

interface CategoryGroup {
  name: string;
  subtotal: number;
  items: Array<{
    id: string;
    category_name: string;
    total: number;
  }>;
}

interface Deduction {
  name: string;
  description: string;
  percentage: number;
  amount: number;
}

const transactionsStore = useTransactionsStore();
const $q = useQuasar();

const selectedDate = ref(dateUtils.formatDate(new Date(), 'YYYY-MM'));
const isLoading = ref(false);
const rawTransactions = ref<Transaction[]>([]);
const reportRef = ref<HTMLElement | null>(null);
const isExporting = ref(false);

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonthYear(dateStr: string): string {
  return dateUtils.formatDate(dateStr + '-01', 'MMMM YYYY');
}

const collectionsGroups = computed((): CategoryGroup[] => {
  return buildCategoryGroups('Collections');
});

const expensesGroups = computed((): CategoryGroup[] => {
  return buildCategoryGroups('Expenses');
});

function buildCategoryGroups(transactionType: string): CategoryGroup[] {
  const groupMap = new Map<string, CategoryGroup>();

  rawTransactions.value
    .filter((t) => t.transaction_type === transactionType)
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
        };
        group.items.push(item);
      }

      item.total += transaction.amount;
      group.subtotal += transaction.amount;
    });

  return Array.from(groupMap.values());
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

function openReportDialog() {
  $q.dialog({
    title: 'Select Report Period',
    message: 'Please select the month and year for the report:',
    prompt: {
      model: selectedDate.value,
      type: 'month',
    },
    ok: {
      color: 'primary',
      unelevated: true,
      rounded: true,
      noCaps: true,
    },
    cancel: {
      label: 'Cancel',
      flat: true,
      class: 'bg-blue-1',
      rounded: true,
      noCaps: true,
    },
    persistent: true,
  }).onOk((value: string) => {
    if (!value) {
      return;
    }
    selectedDate.value = value;
    void loadReport();
  });
}

async function sharePdf(uri: string) {
  try {
    await Share.share({
      title: 'Financial Report',
      text: 'Monthly collections and expenses report.',
      files: [uri],
      dialogTitle: 'Share report',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Unable to share the PDF on this device.',
      position: 'bottom-right',
    });
  }
}

async function exportPdf() {
  if (!reportRef.value || isExporting.value) {
    return;
  }

  isExporting.value = true;
  try {
    const fileName = `Financial-Report-${selectedDate.value}`;
    const result = await exportElementToPdf(reportRef.value, fileName);

    if (result.uri) {
      $q.notify({
        type: 'positive',
        message: 'PDF saved successfully!',
        caption: `Saved to Downloads folder`,
        position: 'bottom-right',
        timeout: 3000,
        actions: [
          {
            label: 'Share',
            color: 'white',
            handler: () => {
              void sharePdf(result.uri);
            },
          },
        ],
      });
    } else {
      $q.notify({
        type: 'positive',
        message: `PDF saved as ${result.fileName}`,
        position: 'bottom-right',
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while exporting the PDF.';

    console.error('Export error:', error);

    $q.notify({
      type: 'negative',
      message: 'Failed to export PDF',
      caption: message,
      position: 'bottom-right',
      timeout: 0,
      closeBtn: true,
    });
  } finally {
    isExporting.value = false;
  }
}

async function loadReport() {
  if (!selectedDate.value) {
    return;
  }

  isLoading.value = true;
  try {
    const parts = selectedDate.value.split('-');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid date format');
    }
    const year = parts[0];
    const month = parts[1];
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
</script>

<style scoped lang="scss">
.collection-container {
  background-color: #eff6ff;
}

.expense-container {
  background-color: #fef2f2;
}
</style>
