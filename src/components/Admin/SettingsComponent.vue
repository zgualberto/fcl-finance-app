<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
  >
    <q-table
      :rows="settings"
      :columns="columns"
      row-key="key"
      flat
      :pagination="pagination"
      :rows-per-page-options="[0, 20, 50, 100]"
    >
      <template v-slot:top>
        <div class="row full-width">
          <div class="col">
            <div class="text-h5 text-weight-bold">Settings</div>
            <div class="text-body1 text-grey-7">Manage application configuration values</div>
          </div>
          <div class="col-auto">
            <q-btn color="primary" @click="openCreateForm" rounded unelevated no-caps>
              <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
              Add Setting
            </q-btn>
          </div>
        </div>

        <q-form v-if="showForm" class="q-mt-md full-width" @submit.prevent="saveForm">
          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.key"
                label="Key"
                outlined
                dense
                :disable="isEditing"
                :rules="[(value) => !!String(value).trim() || 'Key is required']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.value"
                label="Value"
                outlined
                dense
                autogrow
                :rules="[(value) => !!String(value).trim() || 'Value is required']"
              />
            </div>
            <div class="col-12 col-md-2 row q-gutter-sm justify-end">
              <q-btn type="submit" color="primary" rounded unelevated no-caps>
                {{ isEditing ? 'Update' : 'Save' }}
              </q-btn>
              <q-btn color="grey-7" flat rounded no-caps @click="cancelForm">Cancel</q-btn>
            </div>
          </div>
        </q-form>
      </template>

      <template v-slot:body-cell-value="props">
        <q-td :props="props" class="text-pre-wrap">{{ props.row.value }}</q-td>
      </template>

      <template v-slot:body-cell-updatedAt="props">
        <q-td :props="props">{{ formatTimestamp(props.row.updated_at) }}</q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td align="center">
          <q-btn
            flat
            round
            icon="fa-solid fa-edit"
            aria-label="Edit Setting"
            size="sm"
            color="primary"
            @click="openEditForm(props.row)"
          />
          <q-btn
            flat
            round
            icon="fa-regular fa-trash-can"
            aria-label="Delete Setting"
            size="sm"
            color="negative"
            @click="confirmDeleteSetting(props.row.key)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import type { Setting } from 'src/databases/entities/setting';
import { useSettingsStore } from 'src/stores/settings-store';

const settingsStore = useSettingsStore();
const $q = useQuasar();

const columns: QTableColumn[] = [
  { name: 'key', label: 'Key', field: 'key', align: 'left', classes: 'text-weight-bold' },
  { name: 'value', label: 'Value', field: 'value', align: 'left' },
  {
    name: 'updatedAt',
    label: 'Last Updated',
    field: 'updated_at',
    align: 'left',
  },
  { name: 'actions', field: 'actions', label: 'Actions', align: 'center' },
];

const pagination = {
  rowsPerPage: 20,
};

const settings = computed(() => settingsStore.settingList);

const showForm = ref(false);
const isEditing = ref(false);
const editingKey = ref('');

const form = reactive({
  key: '',
  value: '',
});

const resetForm = () => {
  form.key = '';
  form.value = '';
  isEditing.value = false;
  editingKey.value = '';
};

const openCreateForm = () => {
  resetForm();
  showForm.value = true;
};

const openEditForm = (setting: Setting) => {
  showForm.value = true;
  isEditing.value = true;
  editingKey.value = setting.key;
  form.key = setting.key;
  form.value = setting.value;
};

const cancelForm = () => {
  showForm.value = false;
  resetForm();
};

const saveForm = async () => {
  const key = form.key.trim();
  const value = form.value.trim();

  if (!key || !value) {
    $q.notify({
      position: 'bottom-right',
      type: 'negative',
      message: 'Key and value are required',
      timeout: 2000,
    });
    return;
  }

  if (!isEditing.value && settingsStore.setting(key)) {
    $q.notify({
      position: 'bottom-right',
      type: 'negative',
      message: `Setting key "${key}" already exists`,
      timeout: 2000,
    });
    return;
  }

  await settingsStore.saveSetting({ key, value });

  if (isEditing.value && editingKey.value !== key) {
    settingsStore.deleteSetting(editingKey.value);
  }

  $q.notify({
    position: 'bottom-right',
    type: 'positive',
    message: `Setting "${key}" has been ${isEditing.value ? 'updated' : 'created'} successfully`,
    timeout: 2000,
  });

  cancelForm();
};

const confirmDeleteSetting = (key: string) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete setting "${key}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    settingsStore.deleteSetting(key);
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `Setting "${key}" has been deleted successfully`,
      timeout: 2000,
    });
  });
};

const formatTimestamp = (value?: Date | string) => {
  if (!value) {
    return '-';
  }

  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return '-';
  }

  return dateValue.toLocaleString();
};

onMounted(async () => {
  await settingsStore.init();
});
</script>
