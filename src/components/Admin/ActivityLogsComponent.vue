<template>
  <q-table title="Categories" :rows="activityLogs" :columns="columns" row-key="id" flat bordered />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { QTableColumn } from 'quasar';
import { useActivityLogsStore } from 'src/stores/activity-logs-store';

const activityLogsStore = useActivityLogsStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'log', label: 'Log', field: 'log', align: 'left' },
  { name: 'created_at', label: 'Created At', field: 'created_at', align: 'left' },
];

const activityLogs = computed(() => activityLogsStore.activityLogsList);

onMounted(async () => {
  await activityLogsStore.init();
});
</script>
