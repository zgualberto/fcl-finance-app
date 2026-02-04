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
          @click="confirmDeleteCategory(props.row?.id)"
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
import CategoryFormModal from './partials/CategoryFormModal.vue';

const categoryStore = useCategoriesStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Name', field: 'category_name', align: 'left' },
  { name: 'parent_name', label: 'Parent Name', field: 'parent_name', align: 'left' },
  { name: 'is_active', label: 'Active', field: 'is_active', align: 'center' },
  { name: 'is_expense', label: 'Expense', field: 'is_expense', align: 'center' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const categories = computed(() => categoryStore.categoryList);
const $q = useQuasar();

const openAddCategoryDialog = () => {
  $q.dialog({
    component: CategoryFormModal,
    persistent: true,
  }).onOk((data: Partial<Category>) => {
    void categoryStore.addCategory(data);
    void categoryStore.init();
    $q.notify({
      type: 'positive',
      message: `${data.category_name} has been created successfully`,
      timeout: 2000,
    });
  });
};
const openEditCategoryDialog = (category: Category) => {
  $q.dialog({
    component: CategoryFormModal,
    componentProps: { category },
    persistent: true,
  }).onOk((data: Category) => {
    $q.notify({
      type: 'positive',
      message: `${data.category_name} has been updated successfully`,
      timeout: 2000,
    });
  });
};

const confirmDeleteCategory = (id: number) => {
  console.log(`Deleting category id: ${id}`);
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete this category?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    console.log(`Confirm deleted category id: ${id}`);
    void categoryStore.deleteCategory(id);
    $q.notify({
      type: 'positive',
      message: `Category has been deleted successfully`,
      timeout: 2000,
    });
  });
};

onMounted(async () => {
  await categoryStore.init();
});
</script>
