<template>
  <div class="q-pa-lg">
    <q-card class="q-pa-lg relative-position">
      <div class="q-mb-md">
        <h1 class="q-my-none text-h5 text-weight-bold text-primary">FCL Weekly Expenses</h1>
        <p class="q-my-xs text-body1 text-grey-7">Finance Team - Church Expenses</p>
      </div>

      <q-form ref="formRef" @submit="saveExpenses">
        <section class="form-section q-mb-lg">
          <div class="text-h6">Expense Date</div>
          <q-separator class="q-mb-md"></q-separator>
          <div class="row">
            <div class="col-12 col-sm-4">
              <div class="text-body1 text-grey-7 q-mb-xs">Expense Date</div>
              <q-input
                v-model="formData.expenseDate"
                type="date"
                outlined
                dense
                class="full-width"
                :rules="[(val) => !!val || 'This field is required']"
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <div class="text-h6">Expenses ({{ formData.items.length }} entries)</div>
            </div>
            <div class="col-auto q-gutter-md">
              <q-btn
                rounded
                unelevated
                flat
                color="negative"
                @click="addItems(5)"
                no-caps
                class="bg-red-1"
              >
                <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
                Add 5
              </q-btn>
              <q-btn rounded unelevated color="negative" @click="addItems(1)" no-caps>
                <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
                Add 1
              </q-btn>
            </div>
          </div>
          <q-separator class="q-mb-md"></q-separator>

          <div class="q-my-md">
            <ExpensesRow
              v-for="(item, index) in formData.items"
              :key="index"
              v-model:category-id="item.categoryId"
              v-model:category-name="item.categoryName"
              v-model:amount="item.amount"
              v-model:remarks="item.remarks"
              v-model:search-term="item.searchTerm"
              :options="expenseCategoryOptions"
              :is-loading="isCategoriesLoading"
              :on-create-category="createExpenseCategory"
              @remove="removeItem(index)"
            />
          </div>

          <q-btn type="submit" label="Save Expenses" color="negative" class="full-width" no-caps />
        </section>
      </q-form>

      <q-separator class="q-my-lg" />
      <div class="total-box-expenses q-mt-md q-pa-lg text-white rounded-borders">
        <p class="q-my-none text-caption">Total Weekly Expenses</p>
        <div class="row items-end">
          <div class="col">
            <h2 class="q-my-none text-h4 text-weight-bold">₱{{ formatCurrency(totalAmount) }}</h2>
          </div>
          <div class="col-auto">
            <q-icon name="payments" size="36px" class="opacity-40" />
          </div>
        </div>
      </div>

      <q-inner-loading :showing="isSaving">
        <q-spinner-rings size="50px" color="negative" />
      </q-inner-loading>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { date as dateUtils, type QForm, useQuasar } from 'quasar';
import { useCategoriesStore } from 'src/stores/categories-store';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { TransactionType } from 'src/enums/transaction_type';
import type { Category } from 'src/databases/entities/category';
import type { Transaction } from 'src/databases/entities/transaction';
import ExpensesRow from './RowComponent.vue';
import ExpensesSummaryDialog from './SummaryDialogComponent.vue';

interface ExpenseItem {
  categoryId: number | null;
  categoryName: string;
  amount: number;
  remarks: string;
  searchTerm: string;
}

interface ExpensesFormData {
  expenseDate: string;
  items: ExpenseItem[];
}

type CategoryOption = {
  value: number;
  label: string;
};

const createDefaultItem = (): ExpenseItem => ({
  categoryId: null,
  categoryName: '',
  amount: 0,
  remarks: '',
  searchTerm: '',
});

const createDefaultFormData = (): ExpensesFormData => ({
  expenseDate: dateUtils.formatDate(new Date(), 'YYYY-MM-DD'),
  items: [createDefaultItem()],
});

const formData = ref<ExpensesFormData>(createDefaultFormData());
const formRef = ref<QForm | null>(null);
const isSaving = ref(false);
const isCategoriesLoading = ref(false);
const expenseCategoryOptions = ref<CategoryOption[]>([]);

const categoriesStore = useCategoriesStore();
const transactionsStore = useTransactionsStore();
const $q = useQuasar();

const totalAmount = computed(() =>
  formData.value.items.reduce((sum, item) => sum + (item.amount || 0), 0),
);

function addItems(count: number) {
  for (let i = 0; i < count; i += 1) {
    formData.value.items.push(createDefaultItem());
  }
}

function removeItem(index: number) {
  formData.value.items.splice(index, 1);
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function mapCategoriesToOptions(categories: Category[]): CategoryOption[] {
  const expenseType = String(TransactionType.EXPENSES);
  return categories
    .filter((category) => {
      // Find child categories whose parent has transaction_type === EXPENSES
      if (category.parent_id) {
        const parent = categories.find((c) => c.id === category.parent_id);
        return parent?.transaction_type === expenseType;
      }
      return false;
    })
    .filter((category) => category.is_active)
    .map((category) => ({
      value: category.id as number,
      label: category.category_name,
    }));
}

async function loadExpenseCategories() {
  isCategoriesLoading.value = true;
  try {
    await categoriesStore.init(true);
    expenseCategoryOptions.value = mapCategoriesToOptions(categoriesStore.categoryList);
  } finally {
    isCategoriesLoading.value = false;
  }
}

async function createExpenseCategory(name: string): Promise<CategoryOption | null> {
  const normalized = name.trim();
  if (!normalized) {
    return null;
  }

  await categoriesStore.addCategory({
    category_name: normalized,
    is_active: 1,
    transaction_type: TransactionType.EXPENSES,
  });

  await loadExpenseCategories();
  const match = expenseCategoryOptions.value.find(
    (option) => option.label.toLowerCase() === normalized.toLowerCase(),
  );
  return match ?? null;
}

function resolveCategoryLabel(item: ExpenseItem): string {
  if (item.categoryName) {
    return item.categoryName;
  }
  if (item.categoryId == null) {
    return '';
  }
  return (
    expenseCategoryOptions.value.find((option) => option.value === item.categoryId)?.label ?? ''
  );
}

function buildSummaryRows() {
  return formData.value.items.map((item) => ({
    date: formData.value.expenseDate,
    category: resolveCategoryLabel(item) || 'Uncategorized',
    remarks: item.remarks || '- -',
    amount: item.amount,
  }));
}

function buildTransactions(): Partial<Transaction>[] {
  const expenseDate = formData.value.expenseDate;
  return formData.value.items.map((item) => {
    const categoryLabel = resolveCategoryLabel(item) || 'Expense';
    const remarks = item.remarks.trim();
    const description = remarks ? `${categoryLabel} - ${remarks}` : categoryLabel;
    return {
      category_id: item.categoryId as number,
      amount: item.amount,
      description,
      date: expenseDate,
    };
  });
}

function resetForm() {
  formData.value = createDefaultFormData();
  void nextTick(() => {
    formRef.value?.resetValidation();
  });
}

function handleOpenSummary(rows: ReturnType<typeof buildSummaryRows>) {
  $q.dialog({
    component: ExpensesSummaryDialog,
    componentProps: { rows },
  });
}

async function saveExpenses() {
  if (isSaving.value) {
    return;
  }

  const missingCategoryIndex = formData.value.items.findIndex((item) => item.categoryId == null);
  if (missingCategoryIndex !== -1) {
    $q.notify({
      type: 'negative',
      message: 'Please select a category for each expense entry before saving.',
      caption: `Missing category on expense entry #${missingCategoryIndex + 1}`,
      position: 'bottom-right',
    });
    return;
  }

  const invalidAmountIndex = formData.value.items.findIndex(
    (item) => !item.amount || item.amount <= 0,
  );
  if (invalidAmountIndex !== -1) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid amount for each expense entry before saving.',
      caption: `Invalid amount on expense entry #${invalidAmountIndex + 1}`,
      position: 'bottom-right',
    });
    return;
  }

  isSaving.value = true;
  try {
    const transactions = buildTransactions();
    await transactionsStore.addTransactionsBatch(transactions);

    $q.notify({
      type: 'positive',
      message: 'Weekly expenses saved successfully.',
      position: 'bottom-right',
    });

    const summaryRows = buildSummaryRows();
    handleOpenSummary(summaryRows);
    resetForm();
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to save weekly expenses. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  void transactionsStore.init();
  void loadExpenseCategories();
});
</script>

<style scoped lang="scss">
.form-section {
  h3 {
    margin: 0;
  }
}

.total-box-expenses {
  background: linear-gradient(135deg, #d50000 0%, #b71c1c 100%);
}

.opacity-40 {
  opacity: 0.4;
}
</style>
