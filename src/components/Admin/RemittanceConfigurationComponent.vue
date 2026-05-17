<template>
  <q-card
    class="relative-position rounded-borders"
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-table
      :rows="configurations"
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
            <div class="text-h5 text-weight-bold">Remittance Configuration Dashboard</div>
            <div class="text-body1 text-grey-7">Manage remittance effective date ranges</div>
          </div>
          <div class="col-auto">
            <q-btn color="primary" @click="openAddConfigurationDialog" rounded unelevated no-caps>
              <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
              Add New Configuration
            </q-btn>
          </div>
        </div>

        <div class="q-mt-md full-width">
          <q-banner class="bg-blue-1 rounded-borders q-pa-md">
            <div class="text-subtitle2 text-weight-bold q-mb-sm row items-center">
              <q-icon name="info" class="q-mr-sm"></q-icon>
              <div>How Remittance is Computed:</div>
            </div>
            <div class="text-body2 q-ml-sm q-mb-xs">
              • <strong>No active configuration:</strong> Remittance is deducted from Gross
              Collection (default behavior)
            </div>
            <div class="text-body2 q-ml-sm">
              • <strong>Active configuration exists:</strong> Remittance is deducted directly from
              Total Collection
            </div>
            <q-separator class="q-mt-sm"></q-separator>
            <div class="text-body2 q-mt-sm text-primary" v-if="activeConfiguration">
              ✓ Currently using active configuration (ID: {{ activeConfiguration.id }}) from
              {{ formatDate(activeConfiguration.start_date) }} to
              {{ formatDate(activeConfiguration.end_date) }}
            </div>
            <div class="text-body2 q-mt-sm text-primary" v-else>
              No active configuration is currently selected.
            </div>
          </q-banner>
        </div>

        <div v-if="showForm" ref="formContainerRef" class="q-mt-md full-width">
          <RemittanceConfigurationForm
            v-bind="editingConfiguration ? { configuration: editingConfiguration } : {}"
            @ok="handleFormOk"
            @cancel="handleFormCancel"
          />
        </div>
      </template>

      <template v-slot:body-cell-dateRange="props">
        <q-td :props="props">
          {{ dateUtils.formatDate(props.row.start_date, 'MMM D, YYYY') }} --
          {{ dateUtils.formatDate(props.row.end_date, 'MMM D, YYYY') }}
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.status ? 'green-2' : 'red-2'"
            class="q-pa-sm text-black text-weight-bold"
            rounded
          >
            {{ props.row.status ? 'Active' : 'Inactive' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props">
          {{ dateUtils.formatDate(props.row.created_at, 'MMM D, YYYY') }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td align="center" class="q-gutter-sm">
          <q-btn
            flat
            dense
            round
            :icon="props.row.status ? 'fa-solid fa-xmark' : 'fa-solid fa-check'"
            size="sm"
            :aria-label="props.row.status ? 'Deactivate' : 'Activate'"
            :color="props.row.status ? 'negative' : 'positive'"
            @click="handleQuickToggle(props.row.id, !props.row.status)"
          />
          <q-btn
            flat
            dense
            round
            icon="fa-solid fa-edit"
            size="sm"
            aria-label="Edit Configuration"
            @click="openEditConfigurationDialog(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="fa-regular fa-trash-can"
            size="sm"
            aria-label="Delete Configuration"
            color="negative"
            @click="confirmDeleteConfiguration(props.row?.id)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRemittanceConfigurationsStore } from 'src/stores/remittance-configurations-store';
import { date as dateUtils, useQuasar, type QTableColumn } from 'quasar';
import type { RemittanceConfiguration } from 'src/databases/entities/remittance-configuration';
import RemittanceConfigurationForm from './partials/RemittanceConfigurationForm.vue';

const configurationStore = useRemittanceConfigurationsStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', classes: 'text-weight-bold' },
  { name: 'dateRange', label: 'Effective Date Range', field: 'dateRange', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'createdAt', label: 'Date Created', field: 'created_at', align: 'left' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});
const loading = ref(false);
const configurations = computed(() => configurationStore.configurationList);
const activeConfiguration = computed(() => configurationStore.activeConfiguration);
const $q = useQuasar();
const showForm = ref(false);
const editingConfiguration = ref<RemittanceConfiguration | null>(null);
const formContainerRef = ref<HTMLElement | null>(null);

function formatDate(value: string | Date | undefined): string {
  return dateUtils.formatDate(value ?? '', 'MMM D, YYYY');
}

async function focusForm() {
  await nextTick();
  formContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const openAddConfigurationDialog = async () => {
  editingConfiguration.value = null;
  showForm.value = true;
  await focusForm();
};

const openEditConfigurationDialog = async (configuration: RemittanceConfiguration) => {
  editingConfiguration.value = configuration;
  showForm.value = true;
  await focusForm();
};

async function refreshCurrentPage() {
  loading.value = true;
  const { total } = await configurationStore.fetchPage(
    pagination.value.page,
    pagination.value.rowsPerPage,
  );
  pagination.value.rowsNumber = total;
  loading.value = false;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  loading.value = true;
  const { page, rowsPerPage } = props.pagination;
  const { total } = await configurationStore.fetchPage(page, rowsPerPage);
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = total;
  loading.value = false;
}

const handleFormOk = async (data: Partial<RemittanceConfiguration>) => {
  try {
    if (editingConfiguration.value) {
      await configurationStore.updateConfiguration(data as RemittanceConfiguration);
      $q.notify({
        position: 'bottom-right',
        type: 'positive',
        message: `Configuration has been updated successfully`,
        timeout: 2000,
      });
    } else {
      await configurationStore.addConfiguration(data);
      $q.notify({
        position: 'bottom-right',
        type: 'positive',
        message: `Configuration has been created successfully`,
        timeout: 2000,
      });
    }

    showForm.value = false;
    editingConfiguration.value = null;
    await refreshCurrentPage();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    $q.notify({
      position: 'bottom-right',
      type: 'negative',
      message: message,
      timeout: 3000,
    });
  }
};

const handleFormCancel = () => {
  showForm.value = false;
  editingConfiguration.value = null;
};

const handleQuickToggle = async (id: number, newStatus: boolean) => {
  try {
    await configurationStore.toggleStatus(id, newStatus);
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `Configuration has been ${newStatus ? 'activated' : 'deactivated'} successfully`,
      timeout: 2000,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    $q.notify({
      position: 'bottom-right',
      type: 'negative',
      message: message,
      timeout: 3000,
    });
  }
};

const confirmDeleteConfiguration = (id: number) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete this configuration?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await configurationStore.deleteConfiguration(id);
        await refreshCurrentPage();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        $q.notify({
          position: 'bottom-right',
          type: 'negative',
          message: message,
          timeout: 3000,
        });
      }
    })();
  });
};

onMounted(async () => {
  await configurationStore.init(false);
  loading.value = true;
  const { total } = await configurationStore.fetchPage(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
});
</script>
