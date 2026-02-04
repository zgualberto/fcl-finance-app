<template>
  <q-dialog v-model="showDialog" @hide="handleDialogHide">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ category ? 'Edit Category' : 'New Category' }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit" @reset="onReset">
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.category_name" label="Name" filled required />
          <q-toggle v-model="form.is_active" label="Status" icon="check_circle" />
          <q-toggle v-model="form.is_expense" label="Is Expenses" icon="check_circle" />
          <q-select
            filled
            v-model="form.parent_id"
            use-input
            input-debounce="200"
            label="Parent Category"
            option-value="value"
            option-label="label"
            emit-value
            map-options
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
          <q-btn unelevated rounded no-caps label="Cancel" @click="onCancel" color="primary" />
          <q-btn
            v-if="!category"
            unelevated
            rounded
            no-caps
            label="Reset"
            type="reset"
            color="secondary"
          />
          <q-btn unelevated rounded no-caps label="Save" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Category } from 'src/databases/entities/category';
import { useCategoriesStore } from 'src/stores/categories-store';

const props = defineProps<{ category?: Category }>();
const emit = defineEmits(['ok', 'cancel']);

const form = ref({
  category_name: '',
  is_active: true,
  is_expense: false,
  parent_id: null as number | null,
});

const categoryStore = useCategoriesStore();

const parentOptions = computed(() =>
  categoryStore.categories.map((c) => ({
    value: c.id,
    label: c.category_name,
  })),
);

const showDialog = ref<boolean>(true);

watch(
  () => props.category,
  (cat) => {
    if (cat) {
      form.value = {
        category_name: cat.category_name,
        is_active: cat.is_active == 1 ? true : false,
        is_expense: cat.is_expense == 1 ? true : false,
        parent_id: cat.parent_id as number | null,
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
    category_name: form.value.category_name,
    is_active: form.value.is_active == true ? 1 : 0,
    is_expense: form.value.is_expense == true ? 1 : 0,
    parent_id: form.value.parent_id,
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

function onCancel() {
  emit('cancel');
  showDialog.value = false;
}

function resetForm() {
  form.value = {
    category_name: '',
    is_active: true,
    is_expense: false,
    parent_id: null,
  };
}
</script>
