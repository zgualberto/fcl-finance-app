<template>
  <q-card bordered flat class="q-pa-lg rounded-borders q-mb-md">
    <div class="row items-start q-gutter-lg rounded-borders">
      <div class="col">
        <div class="text-body1 text-grey-7">Category</div>
        <q-select
          v-model="localCategoryId"
          v-model:input-value="localSearchTerm"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          :options="filteredOptions"
          :loading="isLoading"
          dense
          outlined
          use-input
          @filter="categoryFilterFn"
          :input-debounce="0"
          :rules="[(val) => !!val || 'Please select a category']"
          clearable
          @update:model-value="updateCategoryName"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No categories found. </q-item-section>
            </q-item>
            <q-item v-if="localSearchTerm.length < 3">
              <q-item-section class="text-grey">
                Type at least 3 characters to search.
              </q-item-section>
            </q-item>
            <q-item v-else>
              <q-item-section class="text-grey"> No matching categories. </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-6 col-sm-3">
        <div class="text-body1 text-grey-7">Amount</div>
        <q-input
          v-model.number="localAmount"
          type="number"
          outlined
          dense
          prefix="₱"
          :rules="[(val) => val > 0 || 'This field should be a valid amount']"
        />
      </div>
      <div class="col-6 col-sm-3">
        <div class="text-body1 text-grey-7">Remarks (Optional)</div>
        <q-input v-model="localRemarks" type="text" outlined dense />
      </div>
      <div class="col-auto">
        <q-btn
          class="q-mt-lg"
          flat
          dense
          round
          icon="fa-regular fa-trash-can"
          color="negative"
          size="md"
          @click="emit('remove')"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export type CategoryOption = {
  value: number;
  label: string;
};

const props = defineProps<{
  categoryId: number | null;
  categoryName: string;
  amount: number;
  remarks: string;
  searchTerm: string;
  options: CategoryOption[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:categoryId', value: number | null): void;
  (event: 'update:categoryName', value: string): void;
  (event: 'update:amount', value: number): void;
  (event: 'update:remarks', value: string): void;
  (event: 'update:searchTerm', value: string): void;
  (event: 'remove'): void;
}>();

const filteredOptions = ref<CategoryOption[]>([]);

const localCategoryId = computed({
  get: () => props.categoryId,
  set: (value) => emit('update:categoryId', value),
});

const localAmount = computed({
  get: () => props.amount,
  set: (value) => emit('update:amount', value),
});

const localRemarks = computed({
  get: () => props.remarks,
  set: (value) => emit('update:remarks', value),
});

const localSearchTerm = computed({
  get: () => props.searchTerm,
  set: (value) => emit('update:searchTerm', value),
});

watch(
  () => props.options,
  (next) => {
    if (localSearchTerm.value.length >= 3) {
      filteredOptions.value = [...next];
    }
  },
  { immediate: true },
);

function updateCategoryName(value: number | null) {
  if (value == null) {
    emit('update:categoryName', '');
    return;
  }
  const option = props.options.find((entry) => entry.value === value);
  emit('update:categoryName', option?.label ?? '');
}

function applyFilter(searchTerm: string) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized || normalized.length < 3) {
    filteredOptions.value = [];
    return;
  }
  filteredOptions.value = props.options.filter((option) =>
    option.label.toLowerCase().includes(normalized),
  );
}

function categoryFilterFn(val: string, update: (callback: () => void) => void) {
  const searchTerm = val.trim();
  localSearchTerm.value = searchTerm;
  update(() => {
    applyFilter(searchTerm);
  });
}
</script>
