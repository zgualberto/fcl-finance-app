<template>
  <q-card class="q-pa-lg shadow-box shadow-3 rounded-borders">
    <q-table
      :rows="categories"
      :columns="columns"
      row-key="id"
      flat
      :pagination="pagination"
      :rows-per-page-options="[0, 20, 50, 100]"
    >
      <template v-slot:top>
        <div class="row full-width">
          <div class="col">
            <div class="text-h5 text-weight-bold">Category Dashboard</div>
            <div class="text-body1 text-grey-7">Manage collection and expense categories</div>
          </div>
          <div class="col-auto">
            <q-btn color="primary" @click="openAddCategoryDialog" rounded unelevated no-caps>
              <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
              Add New Category
            </q-btn>
          </div>
        </div>

        <div v-if="showForm" class="q-mt-md full-width">
          <CategoryForm
            v-bind="editingCategory ? { category: editingCategory } : {}"
            @ok="handleFormOk"
            @cancel="handleFormCancel"
          />
        </div>
      </template>
      <template v-slot:body-cell-parentName="props">
        <q-td :props="props" class="text-italic">
          {{ props.row.parent_name || 'None' }}
        </q-td>
      </template>
      <template v-slot:body-cell-transactionType="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.transaction_type === 'Collections' ? 'blue-2' : 'orange-2'"
            class="q-pa-sm rounded-border text-black text-weight-bold"
            v-if="props.row.transaction_type"
            rounded
          >
            {{ props.row.transaction_type }}
          </q-badge>
          <div v-else>-</div>
        </q-td>
      </template>
      <template v-slot:body-cell-isActive="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.is_active ? 'green-2' : 'red-2'"
            class="q-pa-sm text-black text-weight-bold"
            rounded
          >
            {{ props.row.is_active ? 'Enabled' : 'Disabled' }}
          </q-badge>
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td align="center">
          <q-btn
            flat
            dense
            round
            icon="fa-solid fa-edit"
            size="sm"
            aria-label="Edit Category"
            @click="openEditCategoryDialog(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="fa-regular fa-trash-can"
            size="sm"
            aria-label="Delete Category"
            color="negative"
            @click="confirmDeleteCategory(props.row?.id)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCategoriesStore } from 'src/stores/categories-store';
import { useQuasar, type QTableColumn } from 'quasar';
import type { Category } from 'src/databases/entities/category';
import CategoryForm from './partials/CategoryForm.vue';

const categoryStore = useCategoriesStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', classes: 'text-weight-bold' },
  {
    name: 'name',
    label: 'Name',
    field: 'category_name',
    align: 'left',
    classes: 'text-weight-bold',
  },
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
const showForm = ref(false);
const editingCategory = ref<Category | null>(null);

const openAddCategoryDialog = () => {
  editingCategory.value = null;
  showForm.value = true;
};

const openEditCategoryDialog = (category: Category) => {
  editingCategory.value = category;
  showForm.value = true;
};

const handleFormOk = async (data: Partial<Category>) => {
  if (editingCategory.value) {
    await categoryStore.updateCategory(data as Category);
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `${data.category_name} has been updated successfully`,
      timeout: 2000,
    });
  } else {
    await categoryStore.addCategory(data);
    await categoryStore.init();
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `${data.category_name} has been created successfully`,
      timeout: 2000,
    });
  }

  showForm.value = false;
  editingCategory.value = null;
};

const handleFormCancel = () => {
  showForm.value = false;
  editingCategory.value = null;
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
