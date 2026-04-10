<template>
  <q-card
    class="relative-position rounded-borders"
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-table
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
            <q-btn flat dense color="primary" no-caps @click="resetFilters">Reset Filters</q-btn>
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
          <span v-if="props.row.effective_date">
            {{ dateUtils.formatDate(props.row.effective_date, 'MMM D, YYYY') }}
          </span>
          <span v-else class="text-italic text-grey-7">-</span>
        </q-td>
      </template>

      <template v-slot:body-cell-date="props">
        <q-td :props="props">
          {{ dateUtils.formatDate(props.row.date, 'MMM D, YYYY') }}
        </q-td>
      </template>

      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props">
          <span v-if="props.row.created_at">
            {{ dateUtils.formatDate(props.row.created_at, 'MMM D, YYYY HH:mm') }}
          </span>
          <span v-else class="text-italic text-grey-7">-</span>
        </q-td>
      </template>

      <template v-slot:body-cell-updatedAt="props">
        <q-td :props="props">
          <span v-if="props.row.updated_at">
            {{ dateUtils.formatDate(props.row.updated_at, 'MMM D, YYYY HH:mm') }}
          </span>
          <span v-else class="text-italic text-grey-7">-</span>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { date as dateUtils, type QTableColumn } from 'quasar';
import { TransactionType } from 'src/enums/transaction_type';

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
const transactions = computed(() => transactionStore.transactionList || []);
const searchTerm = ref('');
const dateFilterFrom = ref('');
const dateFilterTo = ref('');
let requestId = 0;

async function fetchTransactions(
  page = pagination.value.page,
  rowsPerPage = pagination.value.rowsPerPage,
) {
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
    } else {
      result = await transactionStore.fetchPage(page, rowsPerPage);
    }

    // Ignore stale responses from previous requests to avoid table flicker.
    if (currentRequestId !== requestId) {
      return;
    }

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
  const { page, rowsPerPage } = props.pagination;
  await fetchTransactions(page, rowsPerPage);
}

function resetFilters() {
  searchTerm.value = '';
  dateFilterFrom.value = '';
  dateFilterTo.value = '';
}

watch([searchTerm, dateFilterFrom, dateFilterTo], async () => {
  if (dateFilterFrom.value && dateFilterTo.value && dateFilterFrom.value > dateFilterTo.value) {
    return;
  }
  pagination.value.page = 1;
  await fetchTransactions(1, pagination.value.rowsPerPage);
});

onMounted(async () => {
  await transactionStore.init(false);
  await fetchTransactions(1, pagination.value.rowsPerPage);
});
</script>
