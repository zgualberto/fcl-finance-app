<template>
  <q-table title="Categories" :rows="categories" :columns="columns" row-key="id" flat bordered>
    <template v-slot:top-right>
      <q-btn color="primary" @click="openAddCategoryDialog" rounded unelevated no-caps>
        <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
        Add Category
      </q-btn>
    </template>
    <template v-slot:body-cell-actions="props">
      <q-td align="center">
        <q-btn
          flat
          dense
          round
          icon="fa-solid fa-edit"
          aria-label="Edit Category"
          @click="openEditCategoryDialog(props.row)"
        />
        <q-btn
          flat
          dense
          round
          icon="fa-solid fa-trash"
          aria-label="Delete Category"
          color="negative"
          @click="confirmDeleteCategory(props.row)"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCategoriesStore } from 'src/stores/categories-store';
import { useQuasar, type QTableColumn } from 'quasar';
import type { Category } from 'src/databases/entities/category';

const useCategoryStore = useCategoriesStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'is_active', label: 'Active', field: 'is_active', align: 'center' },
  { name: 'is_expense', label: 'Expense', field: 'is_expense', align: 'center' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const categories = computed(() => useCategoryStore.categoryList);
const $q = useQuasar();

const openAddCategoryDialog = () => {
  $q.dialog({
    title: 'New Category',
    message: 'Please enter name:',
    prompt: {
      model: '',
      type: 'text', // optional
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    void useCategoryStore.addCategory({ name: data as string });
  });
};
const openEditCategoryDialog = (category: Category) => {
  $q.dialog({
    title: 'Edit Category',
    message: 'Update name:',
    prompt: {
      model: category.name,
      type: 'text', // optional
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    console.log('Updating category', category, 'to new name', data);
    void useCategoryStore.updateCategory({ ...category, name: data as string });
  });
};
const confirmDeleteCategory = (category: Category) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete category "${category.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    console.log('Deleting category', category);
    void useCategoryStore.deleteCategory(category.id!);
  });
};

onMounted(async () => {
  await useCategoryStore.init();
});
</script>
