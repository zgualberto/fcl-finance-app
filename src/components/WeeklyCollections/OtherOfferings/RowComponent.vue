<template>
  <div v-if="localEntries.length === 0" class="text-body2 text-grey-7">
    No other offerings categories are available yet.
  </div>
  <div v-else class="row q-col-gutter-md">
    <div v-for="(entry, index) in localEntries" :key="entry.categoryId ?? entry.categoryName ?? index" class="col-12 col-sm-4">
      <div>
        <div class="text-body1 text-grey-7 q-mb-xs">{{ entry.categoryName }}</div>
        <q-input
          :model-value="entry.amount"
          type="number"
          outlined
          dense
          prefix="₱"
          :rules="[(val) => (val !== null && val !== undefined && val !== '') || 'This field is required']"
          @update:model-value="(value: string | number | null) => updateEntryAmount(index, value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface OtherOfferingEntry {
  categoryId: number | null;
  categoryName: string;
  amount: number;
}

const props = defineProps<{
  entries: OtherOfferingEntry[];
}>();

const emit = defineEmits<{
  (event: 'update:entries', value: OtherOfferingEntry[]): void;
}>();

const localEntries = computed({
  get: () => props.entries,
  set: (value: OtherOfferingEntry[]) => emit('update:entries', value),
});

function updateEntryAmount(index: number, value: string | number | null) {
  const nextEntries = [...props.entries];
  const currentEntry = nextEntries[index] ?? {
    categoryId: null,
    categoryName: '',
    amount: 0,
  };
  nextEntries[index] = {
    ...currentEntry,
    amount: Number(value),
  };
  emit('update:entries', nextEntries);
}
</script>
