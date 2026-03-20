<template>
  <q-table
    title="Activity Logs"
    :rows="activityLogs"
    :columns="columns"
    row-key="id"
    flat
    bordered
    v-model:pagination="pagination"
    :rows-per-page-options="[]"
    :loading="loading"
    @request="onRequest"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { useActivityLogsStore } from 'src/stores/activity-logs-store';

const activityLogsStore = useActivityLogsStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'log', label: 'Log', field: 'log', align: 'left' },
  { name: 'created_at', label: 'Created At', field: 'created_at', align: 'left' },
];

const activityLogs = computed(() => activityLogsStore.activityLogsList);
const loading = ref(false);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  loading.value = true;
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  activityLogsStore.limit = props.pagination.rowsPerPage;
  await activityLogsStore.fetchPage(props.pagination.page);
  pagination.value.rowsNumber = activityLogsStore.totalLogs;
  loading.value = false;
}

onMounted(async () => {
  loading.value = true;
  await activityLogsStore.init();
  pagination.value.rowsNumber = activityLogsStore.totalLogs;
  loading.value = false;
});
</script>
