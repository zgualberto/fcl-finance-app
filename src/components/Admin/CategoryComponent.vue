<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
  >
    <q-table
      :rows="categories"
      :columns="columns"
      row-key="id"
      flat
      v-model:pagination="pagination"
      :rows-per-page-options="[20, 50, 100]"
      :loading="loading"
      @request="onRequest"
    >
      <template v-slot:top>
        <div class="row full-width items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h5 text-weight-bold">Category Dashboard</div>
            <div class="text-body1 text-grey-7">Manage collection and expense categories</div>
          </div>
          <div class="col-12 col-sm-auto">
            <q-input
              v-model="searchTerm"
              filled
              dense
              debounce="1000"
              placeholder="Search categories"
              style="min-width: 240px"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn color="primary" @click="openAddCategoryDialog" rounded unelevated no-caps>
              <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
              Add New Category
            </q-btn>
          </div>
        </div>

        <div v-if="showForm" ref="formContainerRef" class="q-mt-md full-width">
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
            :color="
              props.row.transaction_type === TransactionType.COLLECTIONS ? 'blue-2' : 'orange-2'
            "
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
      <template v-slot:body-cell-nonRemittable="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.non_remittable ? 'blue-2' : 'grey-3'"
            class="q-pa-sm text-black text-weight-bold"
            rounded
          >
            {{ props.row.non_remittable ? 'Yes' : 'No' }}
          </q-badge>
        </q-td>
      </template>
      <template v-slot:body-cell-effectiveDate="props">
        <q-td :props="props">
          <span v-if="props.row.effective_date">
            {{ dateUtils.formatDate(props.row.effective_date, 'MMM D, YYYY') }}
          </span>
          <span v-else class="text-italic">Not set</span>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useCategoriesStore } from 'src/stores/categories-store';
import { date as dateUtils, useQuasar, type QTableColumn } from 'quasar';
import type { Category } from 'src/databases/entities/category';
import { TransactionType } from 'src/enums/transaction_type';
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
  { name: 'nonRemittable', label: 'Non-remittable', field: 'non_remittable', align: 'center' },
  {
    name: 'effectiveDate',
    label: 'Effective Date',
    field: 'effective_date',
    align: 'left',
  },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});
const loading = ref(false);
const categories = computed(() => categoryStore.categoryList);
const $q = useQuasar();
const showForm = ref(false);
const editingCategory = ref<Category | null>(null);
const formContainerRef = ref<HTMLElement | null>(null);
const searchTerm = ref('');

async function focusForm() {
  await nextTick();
  formContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const openAddCategoryDialog = async () => {
  editingCategory.value = null;
  showForm.value = true;
  await focusForm();
};

const openEditCategoryDialog = async (category: Category) => {
  editingCategory.value = category;
  showForm.value = true;
  await focusForm();
};

async function refreshCurrentPage() {
  loading.value = true;
  const keyword = searchTerm.value.trim();
  const { total } = keyword
    ? await categoryStore.searchCategories(
        keyword,
        pagination.value.page,
        pagination.value.rowsPerPage,
      )
    : await categoryStore.fetchPage(pagination.value.page, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  loading.value = true;
  const { page, rowsPerPage } = props.pagination;
  const keyword = searchTerm.value.trim();
  const { total } = keyword
    ? await categoryStore.searchCategories(keyword, page, rowsPerPage)
    : await categoryStore.fetchPage(page, rowsPerPage);
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = total;
  loading.value = false;
}

watch(searchTerm, async (value) => {
  loading.value = true;
  pagination.value.page = 1;
  const keyword = value.trim();
  const { total } = keyword
    ? await categoryStore.searchCategories(keyword, 1, pagination.value.rowsPerPage)
    : await categoryStore.fetchPage(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
});

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
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `${data.category_name} has been created successfully`,
      timeout: 2000,
    });
  }

  showForm.value = false;
  editingCategory.value = null;
  await refreshCurrentPage();
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
    void refreshCurrentPage();
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `Category has been deleted successfully`,
      timeout: 2000,
    });
  });
};

onMounted(async () => {
  await categoryStore.init(false);
  loading.value = true;
  const { total } = await categoryStore.fetchPage(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
});
</script>
