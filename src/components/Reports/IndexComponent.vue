<template>
  <div class="q-pa-lg">
    <!-- Date Selection -->
    <div class="q-mb-lg text-center">
      <q-btn
        color="primary"
        label="Select Month/Year"
        icon="event"
        @click="openReportDialog"
        unelevated
      />
    </div>

    <div v-if="rawTransactions.length > 0">
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
          <q-card class="rounded-borders" style="border: 2px solid #e3f2fd">
            <q-card-section class="bg-blue-1">
              <h3 class="q-my-0 text-h6" style="color: #1976d2; font-weight: 700">Collections</h3>
            </q-card-section>

            <q-card-section>
              <div v-for="categoryGroup in collectionsGroups" :key="`col-${categoryGroup.name}`">
                <div class="text-subtitle2 q-mb-sm" style="font-weight: 600; color: #1976d2">
                  {{ categoryGroup.name }}
                </div>
                <div class="q-mb-md" style="border-bottom: 2px solid #bbdefb; padding-bottom: 12px">
                  <div
                    v-for="item in categoryGroup.items"
                    :key="`${item.id}`"
                    class="row justify-between q-mb-xs"
                  >
                    <span style="color: #1565c0">{{ item.category_name }}</span>
                    <span style="color: #1565c0; font-weight: 500"
                      >₱{{ formatCurrency(item.total) }}</span
                    >
                  </div>
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
          <q-card class="rounded-borders" style="border: 2px solid #ffebee">
            <q-card-section class="bg-red-1">
              <h3 class="q-my-0 text-h6" style="color: #c41c3b; font-weight: 700">Expenses</h3>
            </q-card-section>

            <q-card-section>
              <div v-for="categoryGroup in expensesGroups" :key="`exp-${categoryGroup.name}`">
                <div class="text-subtitle2 q-mb-sm" style="font-weight: 600; color: #c41c3b">
                  {{ categoryGroup.name }}
                </div>
                <div class="q-mb-md" style="border-bottom: 2px solid #ffcdd2; padding-bottom: 12px">
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

      <!-- Summary Cards -->
      <div class="row q-col-gutter-lg q-mb-lg">
        <!-- Total Collection Card -->
        <div class="col-12 col-md-6">
          <q-card class="bg-primary text-white rounded-borders" style="min-height: 100px">
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-center full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">Total Collection</div>
                  <div class="text-h4" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.collections) }}
                  </div>
                </div>
                <q-icon name="attach_money" size="64px" style="opacity: 0.3" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Total Expenses Card -->
        <div class="col-12 col-md-6">
          <q-card
            class="text-white rounded-borders"
            style="background-color: #d32f2f; min-height: 100px"
          >
            <q-card-section class="column justify-between full-height">
              <div class="row justify-between items-center full-width">
                <div>
                  <div class="text-subtitle2 q-mb-sm">Total Expenses</div>
                  <div class="text-h4" style="font-weight: 700">
                    ₱{{ formatCurrency(summaryTotals.expenses) }}
                  </div>
                </div>
                <q-icon name="attach_money" size="64px" style="opacity: 0.3" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- GROSS Collection Card -->
      <div class="q-mb-lg">
        <q-card
          class="text-white rounded-borders"
          style="background-color: #7b1fa2; min-height: 100px"
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
              <q-icon name="attach_money" size="64px" style="opacity: 0.3" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Deductions Section -->
      <div class="q-mb-lg">
        <q-card class="rounded-borders">
          <q-card-section>
            <h4 class="q-my-0 q-mb-md" style="font-weight: 700; color: #1a237e">Deductions</h4>
            <div
              v-for="deduction in deductions"
              :key="deduction.name"
              class="row justify-between items-center q-pa-md"
              style="border-bottom: 1px solid #e0e0e0"
            >
              <div>
                <div style="font-weight: 600; color: #1a237e">{{ deduction.name }}</div>
                <div class="text-caption" style="color: #616161">{{ deduction.description }}</div>
              </div>
              <div style="font-weight: 600; color: #d32f2f">
                ₱{{ formatCurrency(deduction.amount) }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- NET Collection Card -->
      <div>
        <q-card
          class="text-white rounded-borders"
          style="background-color: #388e3c; min-height: 100px"
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
              <q-icon name="attach_money" size="64px" style="opacity: 0.3" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card v-else-if="!isLoading && selectedDate" class="text-center q-pa-lg">
      <q-card-section>
        <q-icon name="info" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 q-mt-md">No transactions found for this period</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { date as dateUtils, useQuasar } from 'quasar';
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

      if (!groupMap.has(parentName)) {
        groupMap.set(parentName, {
          name: parentName,
          subtotal: 0,
          items: [],
        });
      }

      const group = groupMap.get(parentName)!;
      const categoryName = transaction.category_name || 'Uncategorized';

      // Find or create item in this group
      let item = group.items.find((i) => i.category_name === categoryName);
      if (!item) {
        item = {
          id: `${transactionType}-${parentName}-${categoryName}`,
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

onMounted(() => {
  openReportDialog();
});
</script>
