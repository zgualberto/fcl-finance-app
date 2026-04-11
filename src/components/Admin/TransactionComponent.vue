<template>
  <q-card
    class="relative-position rounded-borders"
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-table
      v-if="tableReady"
      :rows="transactions"
      :columns="columns"
      row-key="id"
      flat
      v-model:pagination="pagination"
      :rows-per-page-options="[20, 50, 100]"
      :loading="loading"
      @request="onRequest"
    >
      <template v-slot:top>
        <div class="row full-width items-center q-col-gutter-sm">
          <div class="col-12 col-md">
            <div class="text-h5 text-weight-bold">Transaction Dashboard</div>
            <div class="text-body1 text-grey-7">View and search transactions</div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="searchTerm"
              filled
              dense
              debounce="300"
              placeholder="Search transactions"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input
              v-model="dateFilterFrom"
              type="date"
              filled
              dense
              label="From"
              :max="dateFilterTo"
            />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input
              v-model="dateFilterTo"
              type="date"
              filled
              dense
              label="To"
              :min="dateFilterFrom"
            />
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn
              flat
              dense
              no-caps
              @click="resetFilters"
              icon="fa-solid fa-filter-circle-xmark"
              size="xs"
            ></q-btn>
          </div>
        </div>
      </template>

      <template v-slot:body-cell-transactionType="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.transaction_type === TransactionType.COLLECTIONS ? 'blue-2' : 'orange-2'
            "
            class="q-pa-sm rounded-border text-black text-weight-bold"
            v-if="props.row.transaction_type"
            rounded
          >
            {{ props.row.transaction_type }}
          </q-badge>
          <div v-else>-</div>
        </q-td>
      </template>

      <template v-slot:body-cell-nonRemittable="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.non_remittable ? 'blue-2' : 'grey-3'"
            class="q-pa-sm text-black text-weight-bold"
            rounded
          >
            {{ props.row.non_remittable ? 'Yes' : 'No' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-effectiveDate="props">
        <q-td :props="props">
          <span v-if="props.row.formatted_effective_date">
            {{ props.row.formatted_effective_date }}
          </span>
          <span v-else class="text-italic text-grey-7">-</span>
        </q-td>
      </template>

      <template v-slot:body-cell-date="props">
        <q-td :props="props">
          {{ props.row.formatted_date }}
        </q-td>
      </template>

      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props">
          <span v-if="props.row.formatted_created_at">
            {{ props.row.formatted_created_at }}
          </span>
          <span v-else class="text-italic text-grey-7">-</span>
        </q-td>
      </template>

      <template v-slot:body-cell-updatedAt="props">
        <q-td :props="props">
          <span v-if="props.row.formatted_updated_at">
            {{ props.row.formatted_updated_at }}
          </span>
          <span v-else class="text-italic text-grey-7">-</span>
        </q-td>
      </template>
      <!-- No data available -->
      <template v-slot:no-data>
        <div class="row full-width items-center justify-center q-pa-md">
          <div class="col-auto text-center">
            <q-icon name="info" size="2em" class="text-grey-5" />
            <div class="text-h6 text-grey-7">No transactions found</div>
            <div class="text-body2 text-grey-5">
              Try adjusting your search or date filters to find transactions.
            </div>
          </div>
        </div>
      </template>
    </q-table>
    <div v-else class="q-pa-md text-body2 text-grey-7">Preparing table...</div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { date as dateUtils, type QTableColumn } from 'quasar';
import { TransactionType } from 'src/enums/transaction_type';
import type { Transaction } from 'src/databases/entities/transaction';

type TransactionDashboardRow = Transaction & {
  formatted_date: string;
  formatted_effective_date: string;
  formatted_created_at: string;
  formatted_updated_at: string;
};

const transactionStore = useTransactionsStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', classes: 'text-weight-bold' },
  {
    name: 'categoryName',
    label: 'Category',
    field: 'category_name',
    align: 'left',
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
    align: 'right',
  },
  {
    name: 'transactionType',
    label: 'Type',
    field: 'transaction_type',
    align: 'left',
  },
  {
    name: 'memberName',
    label: 'Member',
    field: 'member_name',
    align: 'left',
  },
  {
    name: 'parentName',
    label: 'Parent Category',
    field: 'parent_name',
    align: 'left',
  },
  {
    name: 'nonRemittable',
    label: 'Non-remittable',
    field: 'non_remittable',
    align: 'center',
  },
  {
    name: 'effectiveDate',
    label: 'Effective Date',
    field: 'effective_date',
    align: 'left',
  },
  {
    name: 'date',
    label: 'Transaction Date',
    field: 'date',
    align: 'left',
  },
  {
    name: 'createdAt',
    label: 'Created At',
    field: 'created_at',
    align: 'left',
  },
  {
    name: 'updatedAt',
    label: 'Updated At',
    field: 'updated_at',
    align: 'left',
  },
];

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});
const loading = ref(false);
const transactions = computed<TransactionDashboardRow[]>(() => {
  return (transactionStore.transactionList || []).map((transaction) => ({
    ...transaction,
    formatted_date: formatDateValue(transaction.date, 'MMM D, YYYY'),
    formatted_effective_date: formatDateValue(transaction.effective_date, 'MMM D, YYYY'),
    formatted_created_at: formatDateValue(transaction.created_at, 'MMM D, YYYY HH:mm'),
    formatted_updated_at: formatDateValue(transaction.updated_at, 'MMM D, YYYY HH:mm'),
  }));
});
const searchTerm = ref('');
const dateFilterFrom = ref('');
const dateFilterTo = ref('');
const tableReady = ref(false);
let requestId = 0;
let filterDebounceHandle: ReturnType<typeof setTimeout> | null = null;
let lastCompletedRequestKey = '';

const hasSearchFilter = computed(() => searchTerm.value.trim().length > 0);
const hasDateRangeFilter = computed(() => Boolean(dateFilterFrom.value && dateFilterTo.value));

function formatDateValue(value: string | Date | null | undefined, format: string): string {
  return value ? dateUtils.formatDate(value, format) : '';
}

function getRequestKey(page: number, rowsPerPage: number): string {
  return JSON.stringify({
    keyword: searchTerm.value.trim(),
    dateFrom: dateFilterFrom.value,
    dateTo: dateFilterTo.value,
    page,
    rowsPerPage,
  });
}

function clearPendingFilterRequest() {
  if (filterDebounceHandle) {
    clearTimeout(filterDebounceHandle);
    filterDebounceHandle = null;
  }
}

function scheduleFilterFetch() {
  clearPendingFilterRequest();
  filterDebounceHandle = setTimeout(() => {
    void fetchTransactions(1, pagination.value.rowsPerPage);
    filterDebounceHandle = null;
  }, 350);
}

function clearResults() {
  clearPendingFilterRequest();
  transactionStore.transactions = [];
  pagination.value.rowsNumber = 0;
  pagination.value.page = 1;
  lastCompletedRequestKey = '';
}

async function fetchTransactions(
  page = pagination.value.page,
  rowsPerPage = pagination.value.rowsPerPage,
) {
  if (!hasSearchFilter.value && !hasDateRangeFilter.value) {
    clearResults();
    return;
  }

  const requestKey = getRequestKey(page, rowsPerPage);
  if (requestKey === lastCompletedRequestKey) {
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    return;
  }

  const currentRequestId = ++requestId;
  loading.value = true;
  const keyword = searchTerm.value.trim();
  let result;

  try {
    if (keyword) {
      result = await transactionStore.searchTransactions(keyword, page, rowsPerPage);
    } else if (dateFilterFrom.value && dateFilterTo.value) {
      result = await transactionStore.fetchPageByDateRange(
        dateFilterFrom.value,
        dateFilterTo.value,
        page,
        rowsPerPage,
      );
    }

    // Ignore stale responses from previous requests to avoid table flicker.
    if (currentRequestId !== requestId) {
      return;
    }

    if (!result) {
      clearResults();
      return;
    }

    lastCompletedRequestKey = requestKey;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.rowsNumber = result.total;
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  if (!hasSearchFilter.value && !hasDateRangeFilter.value) {
    return;
  }

  const { page, rowsPerPage } = props.pagination;
  await fetchTransactions(page, rowsPerPage);
}

function resetFilters() {
  searchTerm.value = '';
  dateFilterFrom.value = '';
  dateFilterTo.value = '';
  clearResults();
}

watch(searchTerm, async () => {
  clearPendingFilterRequest();

  if (dateFilterFrom.value && dateFilterTo.value && dateFilterFrom.value > dateFilterTo.value) {
    return;
  }

  if (!hasSearchFilter.value && !hasDateRangeFilter.value) {
    clearResults();
    return;
  }

  pagination.value.page = 1;
  await fetchTransactions(1, pagination.value.rowsPerPage);
});

watch([dateFilterFrom, dateFilterTo], () => {
  if (dateFilterFrom.value && dateFilterTo.value && dateFilterFrom.value > dateFilterTo.value) {
    clearPendingFilterRequest();
    return;
  }

  if (!hasSearchFilter.value && !hasDateRangeFilter.value) {
    clearResults();
    return;
  }

  pagination.value.page = 1;
  scheduleFilterFetch();
});

onMounted(() => {
  clearResults();
  requestAnimationFrame(() => {
    tableReady.value = true;
  });
});

onBeforeUnmount(() => {
  clearPendingFilterRequest();
});
</script>
