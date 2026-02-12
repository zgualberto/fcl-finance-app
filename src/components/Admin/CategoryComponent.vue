<template>
  <q-table
    title="Categories"
    :rows="categories"
    :columns="columns"
    row-key="id"
    flat
    bordered
    :pagination="pagination"
    :rows-per-page-options="[0, 20, 50, 100]"
  >
    <template v-slot:top-right>
      <q-btn color="primary" @click="openAddCategoryDialog" rounded unelevated no-caps>
        <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
        Add Category
      </q-btn>
    </template>
    <template v-slot:body-cell-transactionType="props">
      <q-td :props="props">
        <q-badge v-if="props.row.transaction_type">{{ props.row.transaction_type }}</q-badge>
        <q-badge v-else color="grey">N/A</q-badge>
      </q-td>
    </template>
    <template v-slot:body-cell-isActive="props">
      <q-td :props="props">
        <q-icon
          :name="props.row.is_active ? 'check_circle' : 'cancel'"
          :color="props.row.is_active ? `positive` : `negative`"
        />
      </q-td>
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
  { name: 'parentName', label: 'Parent Name', field: 'parent_name', align: 'left' },
  { name: 'isActive', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'transactionType', label: 'Type', field: 'transaction_type', align: 'left' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const pagination = {
  rowsPerPage: 20,
};

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
      position: 'bottom-right',
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
    void categoryStore.updateCategory(data);
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `${data.category_name} has been updated successfully`,
      timeout: 2000,
    });
  });
};

const confirmDeleteCategory = (id: number) => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete this category?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    console.log(`Confirm deleted category id: ${id}`);
    void categoryStore.deleteCategory(id);
    $q.notify({
      position: 'bottom-right',
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
