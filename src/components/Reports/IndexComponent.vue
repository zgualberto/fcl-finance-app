<template>
  <div>
    <!-- Date Selection -->
    <div class="q-mb-lg">
      <q-btn
        color="primary"
        label="Select Month/Year"
        icon="event"
        @click="openReportDialog"
        unelevated
      />
      <div class="text-caption text-grey-7 q-mt-sm">
        Selected period: {{ selectedDate ? formatMonthYear(selectedDate) : 'Not selected' }}
      </div>
    </div>

    <!-- Report Display -->
    <q-card v-if="reportData.length > 0">
      <q-card-section>
        <div class="text-h6 q-mb-md">Transactions Report - {{ formatMonthYear(selectedDate) }}</div>
        <q-table
          :rows="reportData"
          :columns="columns"
          row-key="id"
          flat
          bordered
          :rows-per-page-options="[10, 25, 50, 100]"
          :pagination="{ rowsPerPage: 25 }"
        >
          <template #body-cell-amount="props">
            <q-td :props="props">
              <span
                :class="
                  props.row.transaction_type === 'Expenses' ? 'text-negative' : 'text-positive'
                "
              >
                ₱{{ formatCurrency(props.row.amount) }}
              </span>
            </q-td>
          </template>
          <template #body-cell-transaction_type="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.transaction_type === 'Expenses' ? 'negative' : 'positive'"
                :label="props.row.transaction_type"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Summary Totals -->
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-card class="bg-positive text-white">
              <q-card-section>
                <div class="text-caption">Total Collections</div>
                <div class="text-h5">₱{{ formatCurrency(summaryTotals.collections) }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="bg-negative text-white">
              <q-card-section>
                <div class="text-caption">Total Expenses</div>
                <div class="text-h5">₱{{ formatCurrency(summaryTotals.expenses) }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card :class="summaryTotals.net >= 0 ? 'bg-info' : 'bg-warning'" class="text-white">
              <q-card-section>
                <div class="text-caption">Net Total</div>
                <div class="text-h5">₱{{ formatCurrency(summaryTotals.net) }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

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

interface GroupedTransaction {
  id: string;
  date: string;
  category_name: string;
  member_name: string | null;
  amount: number;
  transaction_type: string;
  transaction_count: number;
}

const transactionsStore = useTransactionsStore();
const $q = useQuasar();

const selectedDate = ref(dateUtils.formatDate(new Date(), 'YYYY-MM'));
const isLoading = ref(false);
const rawTransactions = ref<Transaction[]>([]);

const columns = [
  {
    name: 'date',
    label: 'Date',
    field: 'date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'category_name',
    label: 'Category',
    field: 'category_name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'member_name',
    label: 'Member',
    field: 'member_name',
    align: 'left' as const,
    sortable: true,
    format: (val: string | null) => val || '-',
  },
  {
    name: 'transaction_type',
    label: 'Type',
    field: 'transaction_type',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'transaction_count',
    label: 'Count',
    field: 'transaction_count',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'amount',
    label: 'Total Amount',
    field: 'amount',
    align: 'right' as const,
    sortable: true,
  },
];

const reportData = computed((): GroupedTransaction[] => {
  const grouped = new Map<string, GroupedTransaction>();

  rawTransactions.value.forEach((transaction) => {
    const key = `${transaction.date}-${transaction.category_id || 'null'}-${transaction.member_id || 'null'}`;

    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.amount += transaction.amount;
      existing.transaction_count += 1;
    } else {
      grouped.set(key, {
        id: key,
        date: transaction.date,
        category_name: transaction.category_name || 'Uncategorized',
        member_name: transaction.member_name || null,
        amount: transaction.amount,
        transaction_type: transaction.transaction_type || 'Unknown',
        transaction_count: 1,
      });
    }
  });

  return Array.from(grouped.values());
});

const summaryTotals = computed(() => {
  const collections = reportData.value
    .filter((row) => row.transaction_type === 'Collections')
    .reduce((sum, row) => sum + row.amount, 0);

  const expenses = reportData.value
    .filter((row) => row.transaction_type === 'Expenses')
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    collections,
    expenses,
    net: collections - expenses,
  };
});

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonthYear(dateStr: string): string {
  return dateUtils.formatDate(dateStr + '-01', 'MMMM YYYY');
}

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
