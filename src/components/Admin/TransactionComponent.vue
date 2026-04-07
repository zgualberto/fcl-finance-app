<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
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
          <div class="col">
            <div class="text-h5 text-weight-bold">Transaction Dashboard</div>
            <div class="text-body1 text-grey-7">View and search transactions</div>
          </div>
          <div class="col-12 col-sm-auto">
            <q-input
              v-model="searchTerm"
              filled
              dense
              debounce="1000"
              placeholder="Search transactions"
              style="min-width: 240px"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <div v-if="showDateFilter" class="q-mt-md full-width">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-auto">
              <q-input
                v-model="dateFilterFrom"
                filled
                dense
                type="date"
                label="From Date"
                :max="dateFilterTo"
              />
            </div>
            <div class="col-12 col-sm-auto">
              <q-input
                v-model="dateFilterTo"
                filled
                dense
                type="date"
                label="To Date"
                :min="dateFilterFrom"
              />
            </div>
            <div class="col-12 col-sm-auto">
              <q-btn color="primary" @click="applyDateFilter" rounded unelevated no-caps>
                Apply Filters
              </q-btn>
            </div>
            <div class="col-12 col-sm-auto">
              <q-btn color="grey-7" @click="clearDateFilter" rounded unelevated no-caps>
                Clear
              </q-btn>
            </div>
          </div>
        </div>

        <div class="q-mt-md">
          <q-btn
            :color="showDateFilter ? 'primary' : 'grey-7'"
            @click="showDateFilter = !showDateFilter"
            rounded
            unelevated
            no-caps
            size="sm"
          >
            <q-icon
              :name="showDateFilter ? 'expand_less' : 'expand_more'"
              size="xs"
              class="q-mr-xs"
            ></q-icon>
            {{ showDateFilter ? 'Hide' : 'Show' }} Date Filters
          </q-btn>
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
import { date as dateUtils, useQuasar, type QTableColumn } from 'quasar';
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
const $q = useQuasar();
const searchTerm = ref('');
const showDateFilter = ref(false);
const dateFilterFrom = ref('');
const dateFilterTo = ref('');
const filterActive = ref(false);

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  loading.value = true;
  const { page, rowsPerPage } = props.pagination;
  const keyword = searchTerm.value.trim();
  let result;

  if (keyword) {
    result = await transactionStore.searchTransactions(keyword, page, rowsPerPage);
  } else if (filterActive.value && dateFilterFrom.value && dateFilterTo.value) {
    result = await transactionStore.fetchPageByDateRange(
      dateFilterFrom.value,
      dateFilterTo.value,
      page,
      rowsPerPage,
    );
  } else {
    result = await transactionStore.fetchPage(page, rowsPerPage);
  }

  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = result.total;
  loading.value = false;
}

watch(searchTerm, async (value) => {
  loading.value = true;
  pagination.value.page = 1;
  filterActive.value = false; // Clear date filter when searching
  const keyword = value.trim();
  let result;

  if (keyword) {
    result = await transactionStore.searchTransactions(keyword, 1, pagination.value.rowsPerPage);
  } else {
    result = await transactionStore.fetchPage(1, pagination.value.rowsPerPage);
  }

  pagination.value.rowsNumber = result.total;
  loading.value = false;
});

const applyDateFilter = async () => {
  if (!dateFilterFrom.value || !dateFilterTo.value) {
    $q.notify({
      position: 'bottom-right',
      type: 'warning',
      message: 'Please select both start and end dates',
      timeout: 2000,
    });
    return;
  }

  loading.value = true;
  pagination.value.page = 1;
  searchTerm.value = ''; // Clear search when applying date filter
  filterActive.value = true;

  const result = await transactionStore.fetchPageByDateRange(
    dateFilterFrom.value,
    dateFilterTo.value,
    1,
    pagination.value.rowsPerPage,
  );

  pagination.value.rowsNumber = result.total;
  loading.value = false;

  $q.notify({
    position: 'bottom-right',
    type: 'positive',
    message: `Found ${result.total} transactions in the date range`,
    timeout: 2000,
  });
};

const clearDateFilter = async () => {
  loading.value = true;
  pagination.value.page = 1;
  dateFilterFrom.value = '';
  dateFilterTo.value = '';
  filterActive.value = false;

  const result = await transactionStore.fetchPage(1, pagination.value.rowsPerPage);

  pagination.value.rowsNumber = result.total;
  loading.value = false;

  $q.notify({
    position: 'bottom-right',
    type: 'info',
    message: 'Date filter cleared',
    timeout: 2000,
  });
};

onMounted(async () => {
  await transactionStore.init(false);
  loading.value = true;
  const result = await transactionStore.fetchPage(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = result.total;
  loading.value = false;
});
</script>
