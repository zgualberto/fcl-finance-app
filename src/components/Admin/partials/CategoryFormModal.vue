<template>
  <q-card class="q-pa-md">
    <q-card-section>
      <div class="text-h6">
        {{ category ? 'Edit Category' : 'Add New Category' }}
      </div>
    </q-card-section>

    <q-form @submit.prevent="onSubmit">
      <q-card-section class="q-gutter-md">
        <div>
          <div class="text-caption text-grey-7 q-mb-xs">Category Name</div>
          <q-input v-model="form.category_name" filled required dense />
        </div>
        <div class="row no-wrap">
          <div class="col-6">
            <div class="text-caption text-grey-7 q-mb-xs">Status</div>
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
          <div class="col-12 col-sm-6" v-show="form.parent_id == null">
            <div class="text-caption text-grey-7 q-mb-xs">Transaction Type</div>
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
            />
          </div>
        </div>
        <div>
          <div class="text-caption text-grey-7 q-mb-xs">Parent Category (Optional)</div>
          <q-select
            filled
            v-model="form.parent_id"
            use-input
            input-debounce="200"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            :options="parentOptions"
            clearable
            dense
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
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
  transaction_type: '',
  parent_id: null as number | null,
});

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
  categoryStore.categories.map((c) => ({
    value: c.id,
    label: c.category_name,
  })),
);

watch(
  () => props.category,
  (cat) => {
    if (cat) {
      form.value = {
        category_name: cat.category_name,
        is_active: cat.is_active == 1 ? true : false,
        transaction_type: cat.transaction_type,
        parent_id: cat.parent_id as number | null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
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
  };
}
</script>

<style scoped>
.col-gap {
  column-gap: 12px;
}
</style>
