<template>
  <q-dialog v-model="showDialog" @hide="handleDialogHide">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ category ? 'Edit Category' : 'New Category' }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit" @reset.prevent="onReset">
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Name" filled required />
          <q-toggle v-model="form.isActive" label="Is Active" />
          <q-toggle v-model="form.isExpenses" label="Is Expenses" />
          <q-select
            filled
            v-model="form.parentCategory"
            use-input
            input-debounce="200"
            label="Parent Category"
            :options="parentOptions"
            clearable
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="onCancel" />
          <q-btn flat label="Reset" type="reset" color="secondary" />
          <q-btn flat label="Save" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Category } from 'src/databases/entities/category';

const props = defineProps<{ category?: Category }>();
const emit = defineEmits(['ok', 'cancel']);

const form = ref({
  name: '',
  isActive: true,
  isExpenses: false,
  parentCategory: null as number | null,
});

const parentOptions = ref([
  { label: 'Category A', value: 1 },
  { label: 'Category B', value: 2 },
  { label: 'Category C', value: 3 },
]);

const showDialog = ref<boolean>(true);

watch(
  () => props.category,
  (cat) => {
    if (cat) {
      form.value = {
        name: cat.name,
        isActive: cat.is_active ?? true,
        isExpenses: cat.is_expense,
        parentCategory: cat.parent_id ?? null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function onSubmit() {
  emit('ok', {
    ...props.category,
    name: form.value.name,
    is_active: form.value.isActive,
    is_expense: form.value.isExpenses,
    parent_id: form.value.parentCategory ?? undefined,
  });
  showDialog.value = false;
}

function handleDialogHide() {
  emit('cancel');
  showDialog.value = false;
}

function onReset() {
  resetForm();
}

function resetForm() {
  form.value = {
    name: '',
    isActive: true,
    isExpenses: false,
    parentCategory: null,
  };
}
</script>
