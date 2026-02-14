<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="summary-card bg-white text-dark">
      <q-card-section>
        <div class="text-h6">Collection Summary</div>
        <div class="text-body1 text-grey-7">
          Here is a summary of the transactions you just added:
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          :rows="rows"
          :columns="columns"
          :pagination="pagination"
          :rows-per-page-options="[5, 10, 20]"
          flat
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Close" color="primary" unelevated rounded no-caps @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { date as dateUtils, type QTableColumn, useDialogPluginComponent } from 'quasar';

type SummaryRow = {
  date: string;
  description: string;
  amount: number;
};

defineProps<{ rows: SummaryRow[] }>();
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const columns = computed(
  () =>
    [
      {
        name: 'date',
        label: 'Date',
        field: 'date',
        format: (val: string) => dateUtils.formatDate(val, 'MMM D, YYYY'),
        align: 'center',
      },
      { name: 'description', label: 'Description', field: 'description', align: 'left' },
      {
        name: 'amount',
        label: 'Amount',
        field: 'amount',
        format: (val: number) => `₱${formatCurrency(val)}`,
        align: 'right',
      },
    ] as QTableColumn[],
);

const pagination = { rowsPerPage: 5 };
</script>

<style scoped lang="scss">
.summary-card {
  min-width: 600px;
  max-width: 90vw;
}

@media (max-width: 640px) {
  .summary-card {
    min-width: 0;
    width: 92vw;
  }
}
</style>
