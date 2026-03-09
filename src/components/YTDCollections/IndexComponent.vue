<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
  >
    <div class="row full-width q-mb-md items-start">
      <div class="col">
        <div class="text-h4 text-weight-bold">YTD Collections</div>
        <div class="text-body1 text-grey-7">Overview of all collection and expense records</div>
      </div>
      <div class="col-auto">
        <div class="row q-col-gutter-sm">
          <div class="col-auto">
            <q-btn color="primary" rounded unelevated no-caps :to="{ name: 'weekly_collections' }">
              <q-icon name="add" size="xs" class="q-mr-sm" />
              Add Collection
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn color="negative" rounded unelevated no-caps :to="{ name: 'expenses' }">
              <q-icon name="add" size="xs" class="q-mr-sm" />
              Add Expenses
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-card class="summary-card summary-card-collection text-white full-height" flat>
          <q-card-section>
            <div class="text-subtitle2">Total Collections</div>
            <div class="text-h4 text-weight-bold">
              ₱{{ formatCurrency(summaryTotals.collections) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card class="summary-card summary-card-expenses text-white full-height" flat>
          <q-card-section>
            <div class="text-subtitle2">Total Expenses</div>
            <div class="text-h4 text-weight-bold">
              ₱{{ formatCurrency(summaryTotals.expenses) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card class="summary-card summary-card-net text-white full-height" flat>
          <q-card-section>
            <div class="text-subtitle2">Net Collection</div>
            <div class="text-h4 text-weight-bold">₱{{ formatCurrency(summaryTotals.net) }}</div>
            <div class="text-caption">
              After National {{ nationalRateLabel }} & District {{ districtRateLabel }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-table
      :rows="tableRows"
      :columns="columns"
      row-key="date"
      flat
      :pagination="pagination"
      :rows-per-page-options="[0, 20, 50, 100]"
      :loading="isLoading"
    >
      <template v-slot:body-cell-date="props">
        <q-td :props="props" class="text-weight-medium">
          {{ formatDisplayDate(props.row.date) }}
        </q-td>
      </template>
      <template v-slot:body-cell-collection="props">
        <q-td :props="props" class="text-blue text-weight-bold text-right">
          {{ toPeso(props.row.collection) }}
        </q-td>
      </template>
      <template v-slot:body-cell-expenses="props">
        <q-td :props="props" class="text-negative text-weight-bold text-right">
          {{ toPeso(props.row.expenses) }}
        </q-td>
      </template>
      <template v-slot:body-cell-gross="props">
        <q-td :props="props" class="text-weight-bold text-right">
          {{ toPeso(props.row.gross) }}
        </q-td>
      </template>
      <template v-slot:body-cell-national="props">
        <q-td :props="props" class="text-grey-8 text-weight-medium text-right">
          {{ toPeso(props.row.national) }}
        </q-td>
      </template>
      <template v-slot:body-cell-district="props">
        <q-td :props="props" class="text-grey-8 text-weight-medium text-right">
          {{ toPeso(props.row.district) }}
        </q-td>
      </template>
      <template v-slot:body-cell-net="props">
        <q-td
          :props="props"
          :class="
            props.row.net >= 0
              ? 'text-positive text-weight-bold text-right'
              : 'text-negative text-weight-bold text-right'
          "
        >
          {{ toPeso(props.row.net) }}
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" align="center">
          <q-btn
            flat
            dense
            round
            icon="description"
            size="sm"
            color="primary"
            aria-label="Load collection by date"
            :disable="props.row.collection <= 0"
            @click="goToCollectionForm(props.row.date)"
          />
          <q-btn
            flat
            dense
            round
            icon="request_quote"
            size="sm"
            color="deep-orange"
            aria-label="Load expenses by date"
            :disable="props.row.expenses <= 0"
            @click="goToExpensesForm(props.row.date)"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            color="negative"
            aria-label="Delete all records by date"
            @click="confirmDeleteByDate(props.row.date)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { date as dateUtils, useQuasar, type QTableColumn } from 'quasar';
import { useRouter } from 'vue-router';
import { TransactionType } from 'src/enums/transaction_type';
import type { Transaction } from 'src/databases/entities/transaction';
import { useSettingsStore } from 'src/stores/settings-store';
import { useTransactionsStore } from 'src/stores/transactions-store';

interface YtdTableRow {
  id: number;
  date: string;
  collection: number;
  expenses: number;
  gross: number;
  national: number;
  district: number;
  net: number;
}

const transactionsStore = useTransactionsStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const $q = useQuasar();

const isLoading = ref(false);
const rawTransactions = ref<Transaction[]>([]);
const tableRows = ref<YtdTableRow[]>([]);

const pagination = {
  rowsPerPage: 20,
};

const nationalRateLabel = computed(() => `${Math.round(settingsStore.nationalPercent * 100)}%`);
const districtRateLabel = computed(() => `${Math.round(settingsStore.districtPercent * 100)}%`);

const columns = computed<QTableColumn<YtdTableRow>[]>(() => [
  { name: 'id', label: 'ID', field: 'id', align: 'left', classes: 'text-weight-bold' },
  { name: 'date', label: 'Date', field: 'date', align: 'left' },
  { name: 'collection', label: 'Collection', field: 'collection', align: 'right' },
  { name: 'expenses', label: 'Expenses', field: 'expenses', align: 'right' },
  { name: 'gross', label: 'Gross', field: 'gross', align: 'right' },
  {
    name: 'national',
    label: `National ${nationalRateLabel.value}`,
    field: 'national',
    align: 'right',
  },
  {
    name: 'district',
    label: `District ${districtRateLabel.value}`,
    field: 'district',
    align: 'right',
  },
  { name: 'net', label: 'Net', field: 'net', align: 'right' },
  { name: 'actions', label: 'Actions', field: (row) => row.date, align: 'center' },
]);

const summaryTotals = computed(() => {
  const collections = rawTransactions.value
    .filter((transaction) => transaction.transaction_type === TransactionType.COLLECTIONS)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = rawTransactions.value
    .filter((transaction) => transaction.transaction_type === TransactionType.EXPENSES)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const gross = collections - expenses;
  const national = gross * settingsStore.nationalPercent;
  const district = gross * settingsStore.districtPercent;
  const net = gross - national - district;

  return {
    collections,
    expenses,
    net,
  };
});

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDisplayDate(value: string): string {
  return dateUtils.formatDate(value, 'MMMM D, YYYY');
}

function toPeso(amount: number): string {
  return `₱${formatCurrency(amount)}`;
}

function buildTableRows(transactions: Transaction[]): YtdTableRow[] {
  const byDateMap = new Map<string, { collection: number; expenses: number }>();

  for (const transaction of transactions) {
    if (!transaction.date) {
      continue;
    }

    const dateKey = transaction.date;
    const existing = byDateMap.get(dateKey) ?? { collection: 0, expenses: 0 };

    if (transaction.transaction_type === TransactionType.COLLECTIONS) {
      existing.collection += transaction.amount;
    } else if (transaction.transaction_type === TransactionType.EXPENSES) {
      existing.expenses += transaction.amount;
    }

    byDateMap.set(dateKey, existing);
  }

  const sortedDates = Array.from(byDateMap.keys()).sort((a, b) => b.localeCompare(a));

  const rows = sortedDates.map((dateKey, index) => {
    const values = byDateMap.get(dateKey) ?? { collection: 0, expenses: 0 };
    const gross = values.collection - values.expenses;
    const national = gross * settingsStore.nationalPercent;
    const district = gross * settingsStore.districtPercent;
    const net = gross - national - district;

    return {
      id: sortedDates.length - index,
      date: dateKey,
      collection: values.collection,
      expenses: values.expenses,
      gross,
      national,
      district,
      net,
    };
  });

  return rows.filter((row) => row.collection > 0 || row.expenses > 0);
}

async function loadYtdData(): Promise<void> {
  const currentYear = String(new Date().getFullYear());
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  isLoading.value = true;
  try {
    rawTransactions.value = await transactionsStore.fetchTransactionsByDateRange(
      startDate,
      endDate,
    );
    tableRows.value = buildTableRows(rawTransactions.value);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to load YTD records. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isLoading.value = false;
  }
}

function goToCollectionForm(date: string): void {
  void router.push({
    name: 'weekly_collections',
    query: { date },
  });
}

function goToExpensesForm(date: string): void {
  void router.push({
    name: 'expenses',
    query: { date },
  });
}

function confirmDeleteByDate(date: string): void {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `This will delete all active records for ${formatDisplayDate(date)}. Do you want to continue?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      await transactionsStore.deleteTransactionsByDate(date);
      await loadYtdData();
      $q.notify({
        type: 'positive',
        message: 'Records deleted successfully.',
        position: 'bottom-right',
      });
    })();
  });
}

onMounted(async () => {
  await settingsStore.init();
  await transactionsStore.init();
  await loadYtdData();
});
</script>

<style scoped lang="scss">
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
</style>
