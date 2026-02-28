<template>
  <q-card class="rounded-borders" :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }">
    <div class="row items-center q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <div class="text-h5 text-weight-bold">Backups</div>
        <div class="text-body1 text-grey-7">Create, share, and restore database backups.</div>
      </div>
      <div class="col-12 col-sm-auto row q-gutter-sm">
        <q-btn
          color="primary"
          rounded
          unelevated
          no-caps
          :loading="creating"
          @click="handleCreateBackup"
        >
          <q-icon name="fa-solid fa-database" size="xs" class="q-mr-sm" />
          Create Backup
        </q-btn>
        <q-btn
          color="primary"
          outline
          rounded
          no-caps
          :loading="creating"
          @click="handleCreateAndShare"
        >
          <q-icon name="fa-solid fa-share-nodes" size="xs" class="q-mr-sm" />
          Create & Share
        </q-btn>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-7">
        <q-table
          :rows="backups"
          :columns="columns"
          row-key="key"
          flat
          :pagination="pagination"
          :rows-per-page-options="[0, 10, 20, 50]"
        >
          <template v-slot:body-cell-timestamp="props">
            <q-td :props="props">
              {{ formatTimestamp(props.row.timestamp) }}
            </q-td>
          </template>
          <template v-slot:body-cell-size="props">
            <q-td :props="props">
              {{ formatFileSize(props.row.size) }}
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                size="sm"
                color="primary"
                icon="fa-solid fa-rotate"
                aria-label="Restore backup"
                :loading="pendingKey === props.row.key"
                @click="confirmRestore(props.row.key)"
              />
              <q-btn
                flat
                round
                size="sm"
                color="dark"
                icon="fa-solid fa-share-nodes"
                aria-label="Share backup"
                :loading="pendingKey === props.row.key"
                @click="handleShareBackup(props.row.key)"
              />
              <q-btn
                flat
                round
                size="sm"
                color="negative"
                icon="fa-solid fa-trash"
                aria-label="Delete backup"
                :loading="pendingKey === props.row.key"
                @click="confirmDelete(props.row.key)"
              />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center q-gutter-sm text-grey-7">
              <q-icon name="fa-regular fa-folder-open" />
              <span>No backups yet.</span>
            </div>
          </template>
        </q-table>
      </div>

      <div class="col-12 col-md-5">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold">Import Backup File</div>
          <div class="text-body2 text-grey-7 q-mb-sm">
            Importing will replace the current database on this device.
          </div>
          <q-file
            v-model="selectedFile"
            label="Select backup file"
            filled
            clearable
            accept=".json,application/json"
          >
            <template v-slot:prepend>
              <q-icon name="fa-regular fa-folder-open" />
            </template>
          </q-file>
          <q-btn
            class="q-mt-md"
            color="primary"
            rounded
            unelevated
            no-caps
            :loading="importing"
            :disable="!selectedFile"
            @click="handleImportFile"
          >
            <q-icon name="fa-solid fa-file-import" size="xs" class="q-mr-sm" />
            Import Backup
          </q-btn>
        </q-card>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  backupDatabase,
  deleteBackup,
  exportBackupToShare,
  getAvailableBackups,
  importBackupJson,
  restoreFromBackup,
} from 'src/services/backup';

type BackupSummary = { key: string; timestamp: Date; size: number };

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

const $q = useQuasar();
const backups = ref<BackupSummary[]>([]);
const creating = ref(false);
const importing = ref(false);
const pendingKey = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const columns: QTableColumn[] = [
  { name: 'timestamp', label: 'Created', field: 'timestamp', align: 'left' },
  { name: 'size', label: 'Size', field: 'size', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

const pagination = {
  rowsPerPage: 10,
};

const formatTimestamp = (timestamp: Date) => timestamp.toLocaleString();

const loadBackups = async () => {
  backups.value = await getAvailableBackups();
};

const handleCreateBackup = async () => {
  try {
    creating.value = true;
    await backupDatabase();
    await loadBackups();
    $q.notify({
      type: 'positive',
      message: 'Backup created successfully',
      position: 'bottom-right',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to create backup',
      position: 'bottom-right',
    });
  } finally {
    creating.value = false;
  }
};

const handleCreateAndShare = async () => {
  try {
    creating.value = true;
    await backupDatabase();
    await loadBackups();

    const latest = backups.value[0];
    if (!latest) {
      throw new Error('No backups available to share');
    }

    pendingKey.value = latest.key;
    await exportBackupToShare(latest.key);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to create and share backup',
      position: 'bottom-right',
    });
  } finally {
    pendingKey.value = null;
    creating.value = false;
  }
};

const confirmRestore = (backupKey: string) => {
  $q.dialog({
    title: 'Restore Backup',
    message: 'Restoring will replace the current database on this device. Continue?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void handleRestoreBackup(backupKey);
  });
};

const confirmDelete = (backupKey: string) => {
  $q.dialog({
    title: 'Delete Backup',
    message: 'Delete this backup file from local storage? This cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void handleDeleteBackup(backupKey);
  });
};

const handleRestoreBackup = async (backupKey: string) => {
  try {
    pendingKey.value = backupKey;
    const restored = await restoreFromBackup(backupKey);

    if (!restored) {
      throw new Error('Restore failed');
    }

    $q.notify({
      type: 'positive',
      message: 'Backup restored successfully',
      position: 'bottom-right',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to restore backup',
      position: 'bottom-right',
    });
  } finally {
    pendingKey.value = null;
  }
};

const handleShareBackup = async (backupKey: string) => {
  try {
    pendingKey.value = backupKey;
    await exportBackupToShare(backupKey);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to share backup',
      position: 'bottom-right',
    });
  } finally {
    pendingKey.value = null;
  }
};

const handleDeleteBackup = async (backupKey: string) => {
  try {
    pendingKey.value = backupKey;
    await deleteBackup(backupKey);
    await loadBackups();
    $q.notify({
      type: 'positive',
      message: 'Backup deleted successfully',
      position: 'bottom-right',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to delete backup',
      position: 'bottom-right',
    });
  } finally {
    pendingKey.value = null;
  }
};

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      if (result instanceof ArrayBuffer) {
        resolve(new TextDecoder().decode(result));
        return;
      }
      resolve('');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });

const handleImportFile = () => {
  if (!selectedFile.value) {
    return;
  }

  $q.dialog({
    title: 'Import Backup',
    message: 'Importing will replace the current database on this device. Continue?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void handleImportConfirmed();
  });
};

const handleImportConfirmed = async () => {
  try {
    importing.value = true;
    const jsonData = await readFileAsText(selectedFile.value as File);
    await importBackupJson(jsonData);
    await loadBackups();
    $q.notify({
      type: 'positive',
      message: 'Backup imported successfully',
      position: 'bottom-right',
    });
    selectedFile.value = null;
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to import backup',
      position: 'bottom-right',
    });
  } finally {
    importing.value = false;
  }
};

onMounted(async () => {
  await loadBackups();
});
</script>
