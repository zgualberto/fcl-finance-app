<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-pa-sm': $q.screen.width > $q.screen.height, 'q-pa-xs': $q.screen.lt.sm }"
    flat
    bordered
  >
    <q-card-section
      :class="{ 'q-py-md': $q.screen.width > $q.screen.height, 'q-py-xs': $q.screen.lt.sm }"
    >
      <div class="row items-center">
        <div class="col text-h6">
          {{ category ? 'Edit Category' : 'Add New Category' }}
        </div>
        <div class="col-auto">
          <q-btn flat dense round icon="close" aria-label="Close form" @click="onCancel" />
        </div>
      </div>
    </q-card-section>

    <q-form @submit.prevent="onSubmit">
      <q-card-section
        class="q-gutter-md"
        :class="{ 'q-py-md': $q.screen.width > $q.screen.height, 'q-py-xs': $q.screen.lt.sm }"
      >
        <div>
          <div class="text-body1 text-grey-7 q-mb-xs">Category Name</div>
          <q-input v-model="form.category_name" filled required dense />
        </div>
        <div class="row" :class="{ 'no-wrap': $q.screen.width > $q.screen.height }">
          <div class="col-12 col-sm-6">
            <div
              :class="{ 'q-pr-sm': form.parent_id == null && $q.screen.width > $q.screen.height }"
            >
              <div class="text-body1 text-grey-7 q-mb-xs">Status</div>
              <q-select
                v-model="form.is_active"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                filled
                :options="statusOptions"
                dense
              />
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div :class="{ 'q-pl-sm': $q.screen.width > $q.screen.height }">
              <div class="text-body1 text-grey-7 q-mb-xs">Transaction Type</div>
              <q-select
                v-model="form.transaction_type"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                filled
                required
                :options="transactionTypeOptions"
                dense
                :rules="[
                  (val) =>
                    form.parent_id !== null ||
                    !!val ||
                    'Transaction type is required for parent categories',
                ]"
                :disable="form.parent_id !== null"
              />
            </div>
          </div>
        </div>
        <div>
          <div class="row" :class="{ 'no-wrap': $q.screen.width > $q.screen.height }">
            <div class="col-12 col-sm-6">
              <div
                :class="{ 'q-pr-sm': form.parent_id == null && $q.screen.width > $q.screen.height }"
              >
                <div class="text-body1 text-grey-7 q-mb-xs">Parent Category (Optional)</div>
                <q-select
                  filled
                  v-model="form.parent_id"
                  v-model:input-value="parentSearchTerm"
                  use-input
                  :input-debounce="0"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  :options="filteredParentOptions"
                  @filter="parentFilterFn"
                  clearable
                  dense
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> No categories found. </q-item-section>
                    </q-item>
                    <q-item v-if="parentSearchTerm.length < 3">
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
            </div>
            <div class="col-12 col-sm-6">
              <div :class="{ 'q-pl-sm': $q.screen.width > $q.screen.height }">
                <div class="text-body1 text-grey-7 q-mb-xs">Non-remittable</div>
                <q-select
                  filled
                  v-model="form.non_remittable"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  :options="[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ]"
                  dense
                />
              </div>
            </div>
          </div>
        </div>
        <div class="row justify-start col-gap">
          <q-btn
            flat
            unelevated
            rounded
            no-caps
            label="Cancel"
            @click="onCancel"
            class="bg-blue-1 q-px-lg"
            color="primary"
          />
          <q-btn
            unelevated
            rounded
            no-caps
            label="Save"
            type="submit"
            color="primary"
            class="q-px-lg"
          />
        </div>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Category } from 'src/databases/entities/category';
import { useCategoriesStore } from 'src/stores/categories-store';
import { TransactionType } from 'src/enums/transaction_type';
import { useQuasar } from 'quasar';

const props = defineProps<{ category?: Category }>();
const emit = defineEmits(['ok', 'cancel']);

const form = ref({
  category_name: '',
  is_active: true,
  transaction_type: '' as string | null,
  parent_id: null as number | null,
  non_remittable: false,
});

const parentSearchTerm = ref('');
const filteredParentOptions = ref<Array<{ value: number; label: string }>>([]);

const $q = useQuasar();
const categoryStore = useCategoriesStore();

const transactionTypeOptions = Object.values(TransactionType).map((type) => ({
  value: type,
  label: type,
}));

const statusOptions = [
  { label: 'Enable', value: true },
  { label: 'Disable', value: false },
];

const parentOptions = computed(() =>
  categoryStore.categories
    .filter((c) => c.id !== undefined)
    .map((c) => ({
      value: c.id!,
      label: c.category_name,
    })),
);

function getCategoryById(categoryId: number | null): Category | undefined {
  if (categoryId == null) {
    return undefined;
  }

  return categoryStore.categories.find((category) => category.id === categoryId);
}

function applyParentFilter(searchTerm: string) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized || normalized.length < 3) {
    filteredParentOptions.value = [];
    return;
  }
  filteredParentOptions.value = parentOptions.value.filter((option) =>
    option.label.toLowerCase().includes(normalized),
  );
}

function parentFilterFn(val: string, update: (callback: () => void) => void) {
  const searchTerm = val.trim();
  parentSearchTerm.value = searchTerm;
  update(() => {
    applyParentFilter(searchTerm);
  });
}

watch(
  () => props.category,
  (cat) => {
    if (cat) {
      form.value = {
        category_name: cat.category_name,
        is_active: cat.is_active == 1 ? true : false,
        transaction_type: cat.transaction_type as string | null,
        parent_id: cat.parent_id as number | null,
        non_remittable: cat.non_remittable == 1 ? true : false,
      };
    } else {
      resetForm();
    }
    parentSearchTerm.value = '';
    if (cat?.parent_id != null) {
      const existing = parentOptions.value.find((opt) => opt.value === cat.parent_id);
      filteredParentOptions.value = existing ? [existing] : [];
    } else {
      filteredParentOptions.value = [];
    }
  },
  { immediate: true },
);

watch(
  () => form.value.parent_id,
  (parentId) => {
    if (parentId == null) {
      return;
    }

    const parentCategory = getCategoryById(parentId);
    form.value.transaction_type = parentCategory?.transaction_type ?? '';
  },
);

function onSubmit() {
  // check if category is already exist
  if (props.category) {
    if (
      categoryStore.categories.some(
        (c) =>
          c.category_name.toLowerCase() == form.value.category_name.toLowerCase() &&
          c.id != props.category?.id,
      )
    ) {
      $q.notify({
        position: 'bottom-right',
        color: 'negative',
        message: 'Category already exists',
        icon: 'warning',
        timeout: 2000,
      });

      return false;
    }
  } else {
    if (
      categoryStore.categories.some(
        (c) => c.category_name.toLowerCase() == form.value.category_name.toLowerCase(),
      )
    ) {
      $q.notify({
        position: 'bottom-right',
        color: 'negative',
        message: 'Category already exists',
        icon: 'warning',
        timeout: 2000,
      });

      return false;
    }
  }
  emit('ok', {
    ...props.category,
    category_name: form.value.category_name,
    is_active: form.value.is_active == true ? 1 : 0,
    transaction_type: form.value.transaction_type,
    parent_id: form.value.parent_id,
    non_remittable: form.value.non_remittable == true ? 1 : 0,
  });
}

function onCancel() {
  emit('cancel');
}

function resetForm() {
  form.value = {
    category_name: '',
    is_active: true,
    transaction_type: '',
    parent_id: null,
    non_remittable: false,
  };
}
</script>

<style scoped>
.col-gap {
  column-gap: 12px;
}
</style>
