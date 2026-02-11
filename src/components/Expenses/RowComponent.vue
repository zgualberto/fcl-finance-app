<template>
  <div class="row items-start q-gutter-sm rounded-borders">
    <div class="col">
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
        label="Category"
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
            <q-item-section>
              <q-btn
                flat
                no-caps
                color="primary"
                rounded
                :disable="isCreatingCategory"
                @click="createCategoryFromSearch"
              >
                <q-icon name="add" size="xs" class="q-mr-sm" />
                Create category "{{ localSearchTerm }}"
              </q-btn>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-6 col-sm-3">
      <q-input
        v-model.number="localAmount"
        type="number"
        outlined
        dense
        prefix="₱"
        label="Amount"
        :rules="[(val) => val > 0 || 'This field should be a valid amount']"
      />
    </div>
    <div class="col-6 col-sm-3">
      <q-input v-model="localRemarks" type="text" outlined dense label="Remarks (Optional)" />
    </div>
    <div class="col-auto">
      <q-btn flat dense round icon="delete" color="negative" size="md" @click="emit('remove')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

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
  onCreateCategory?: (name: string) => Promise<CategoryOption | null>;
}>();

const emit = defineEmits<{
  (event: 'update:categoryId', value: number | null): void;
  (event: 'update:categoryName', value: string): void;
  (event: 'update:amount', value: number): void;
  (event: 'update:remarks', value: string): void;
  (event: 'update:searchTerm', value: string): void;
  (event: 'remove'): void;
}>();

const $q = useQuasar();
const filteredOptions = ref<CategoryOption[]>([]);
const isCreatingCategory = ref(false);

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

async function createCategoryFromSearch() {
  const searchTerm = localSearchTerm.value.trim();
  if (!searchTerm) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a category name before creating.',
      position: 'bottom-right',
    });
    return;
  }
  if (!props.onCreateCategory || isCreatingCategory.value) {
    return;
  }

  isCreatingCategory.value = true;
  try {
    const newOption = await props.onCreateCategory(searchTerm);
    if (!newOption) {
      throw new Error('Failed to create category');
    }
    emit('update:categoryName', newOption.label);
    $q.notify({
      type: 'positive',
      message: 'Category created successfully.',
      position: 'bottom-right',
    });
    localSearchTerm.value = '';
    applyFilter('');
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to create category. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isCreatingCategory.value = false;
  }
}
</script>
