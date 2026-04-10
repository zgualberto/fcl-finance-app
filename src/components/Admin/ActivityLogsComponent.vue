<template>
  <q-card
    class="relative-position rounded-borders"
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-table
      :rows="activityLogs"
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
            <div class="text-h5 text-weight-bold">Activity Logs</div>
            <div class="text-body1 text-grey-7">Application activity and error logs</div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-input v-model="searchTerm" filled dense debounce="300" placeholder="Search logs">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input v-model="fromDate" type="date" filled dense label="From" />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input v-model="toDate" type="date" filled dense label="To" />
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

      <template v-slot:body-cell-isError="props">
        <q-td :props="props" align="center">
          <q-badge
            :color="props.row.is_error ? 'red-2' : 'green-2'"
            class="q-pa-sm text-black text-weight-bold"
            rounded
          >
            {{ props.row.is_error ? 'Error' : 'Info' }}
          </q-badge>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { type QTableColumn } from 'quasar';
import { useActivityLogsStore } from 'src/stores/activity-logs-store';
import type { ActivityLogFilters } from 'src/stores/activity-logs-store';

const activityLogsStore = useActivityLogsStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', classes: 'text-weight-bold' },
  { name: 'log', label: 'Log', field: 'log', align: 'left' },
  { name: 'isError', label: 'Type', field: 'is_error', align: 'center' },
  { name: 'created_at', label: 'Created At', field: 'created_at', align: 'left' },
];

const activityLogs = computed(() => activityLogsStore.activityLogsList);
const loading = ref(false);
const searchTerm = ref('');
const fromDate = ref('');
const toDate = ref('');
const isInitializing = ref(true);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

function toInputDate(date: Date): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return {
    from: toInputDate(start),
    to: toInputDate(end),
  };
}

async function loadPage(page: number, rowsPerPage: number) {
  loading.value = true;
  const filters: ActivityLogFilters = {};
  const keyword = searchTerm.value.trim();
  if (keyword) {
    filters.searchText = keyword;
  }
  if (fromDate.value) {
    filters.fromDate = fromDate.value;
  }
  if (toDate.value) {
    filters.toDate = toDate.value;
  }

  const { total } = await activityLogsStore.fetchPage(page, rowsPerPage, filters);
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = total;
  loading.value = false;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  await loadPage(props.pagination.page, props.pagination.rowsPerPage);
}

function resetFilters() {
  const range = defaultDateRange();
  searchTerm.value = '';
  fromDate.value = range.from;
  toDate.value = range.to;
}

watch([searchTerm, fromDate, toDate], async () => {
  if (isInitializing.value) {
    return;
  }
  if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
    return;
  }
  pagination.value.page = 1;
  await loadPage(1, pagination.value.rowsPerPage);
});

onMounted(async () => {
  await activityLogsStore.init(false);
  const range = defaultDateRange();
  fromDate.value = range.from;
  toDate.value = range.to;
  isInitializing.value = false;
  await loadPage(1, pagination.value.rowsPerPage);
});
</script>
