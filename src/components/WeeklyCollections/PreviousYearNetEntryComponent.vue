<template>
  <q-form ref="formRef" @submit="saveLegacyEntry">
    <section
      class="form-section"
      :class="{ 'q-mb-lg': $q.screen.width > $q.screen.height, 'q-mb-sm': $q.screen.lt.sm }"
    >
      <div class="text-h6 text-weight-medium">Previous Year NET Collection</div>
      <q-separator class="q-mb-md"></q-separator>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <div class="text-body1 text-grey-7 q-mb-xs">Year</div>
          <q-select
            v-model="formData.year"
            :options="previousYearOptions"
            outlined
            dense
            emit-value
            map-options
            class="full-width"
            :rules="[(val) => !!val || 'This field is required']"
          >
            <template #prepend>
              <q-icon name="event" />
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-body1 text-grey-7 q-mb-xs">Net Collection Amount</div>
          <q-input
            v-model.number="formData.netAmount"
            type="number"
            outlined
            dense
            min="0"
            step="0.01"
            class="full-width"
            :rules="[
              (val) => val != null || 'This field is required',
              (val) => Number(val) > 0 || 'Amount must be greater than zero',
            ]"
          >
            <template #prepend>
              <q-icon name="payments" />
            </template>
          </q-input>
        </div>
      </div>

      <div class="q-mt-lg">
        <q-btn
          type="submit"
          label="Add Previous Year NET"
          color="positive"
          class="full-width"
          no-caps
        />
      </div>
    </section>
  </q-form>

  <q-inner-loading :showing="isSaving">
    <q-spinner-rings size="50px" color="primary" />
  </q-inner-loading>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { type QForm, useQuasar } from 'quasar';

import { useCategoriesStore } from 'src/stores/categories-store';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { CollectionsCategoryName } from 'src/enums/collections_category';
import { TransactionType } from 'src/enums/transaction_type';
import type { Category } from 'src/databases/entities/category';
import { useUnsavedWarning } from 'src/composables/useUnsavedWarning';

interface LegacyFormData {
  year: string;
  netAmount: number;
}

const thisYear = new Date().getFullYear();
const defaultYear = String(thisYear - 1);

const previousYearOptions = Array.from({ length: 50 }, (_, i) => {
  const year = thisYear - (i + 2);
  return { label: String(year), value: String(year) };
});

const createDefaultFormData = (): LegacyFormData => ({
  year: defaultYear,
  netAmount: 0,
});

const formData = ref<LegacyFormData>(createDefaultFormData());
const formRef = ref<QForm | null>(null);
const legacyCategoryId = ref<number | null>(null);
const isSaving = ref(false);

const categoriesStore = useCategoriesStore();
const transactionsStore = useTransactionsStore();
const $q = useQuasar();
const legacyCategoryName = String(CollectionsCategoryName.LEGACY_NET_COLLECTION);

function resetForm() {
  formData.value = createDefaultFormData();
  void nextTick(() => {
    formRef.value?.resetValidation();
  });
}

useUnsavedWarning({
  formData,
  defaultData: createDefaultFormData(),
  onReset: resetForm,
});

function toLegacyDate(year: string): string {
  return `${year}-12-31`;
}

function buildLegacyDescription(): string {
  return `${legacyCategoryName} (${formData.value.year})`;
}

function extractLegacyCategory(categories: Category[]): Category | undefined {
  return categories.find((category) => category.category_name === legacyCategoryName);
}

async function ensureLegacyCategory(): Promise<void> {
  await categoriesStore.init(false);
  const categories = await categoriesStore.fetchCategoriesByNames([legacyCategoryName]);

  const legacyCategory = extractLegacyCategory(categories);

  if (!legacyCategory?.id) {
    await categoriesStore.addCategory({
      category_name: legacyCategoryName,
      is_active: 1,
      transaction_type: TransactionType.COLLECTIONS,
      parent_id: null,
    });
  } else if (
    legacyCategory.transaction_type !== TransactionType.COLLECTIONS ||
    legacyCategory.parent_id != null
  ) {
    await categoriesStore.updateCategory({
      id: legacyCategory.id,
      category_name: legacyCategory.category_name,
      is_active: legacyCategory.is_active,
      parent_id: null,
      transaction_type: TransactionType.COLLECTIONS,
    });
  }
}

async function loadLegacyCategory(skipDialog = false): Promise<void> {
  await categoriesStore.init(false);
  const categories = await categoriesStore.fetchCategoriesByNames([legacyCategoryName]);

  const legacyCategory = extractLegacyCategory(categories);
  const hasIssues =
    !legacyCategory?.id ||
    legacyCategory.transaction_type !== TransactionType.COLLECTIONS ||
    legacyCategory.parent_id != null;

  if (hasIssues && !skipDialog) {
    $q.dialog({
      title: 'Invalid Legacy Category',
      message: 'Legacy net category is missing or invalid. Would you like to create/fix it now?',
      ok: {
        label: 'Fix',
        color: 'primary',
        unelevated: true,
        rounded: true,
        noCaps: true,
      },
      cancel: {
        label: 'Cancel',
        flat: true,
        class: 'bg-blue-1',
        rounded: true,
        noCaps: true,
      },
    }).onOk(() => {
      void (async () => {
        try {
          await ensureLegacyCategory();
          await loadLegacyCategory(true);
        } catch {
          $q.notify({
            type: 'negative',
            message: 'Failed to fix legacy category. Please try again.',
            position: 'bottom-right',
          });
        }
      })();
    });
    return;
  }

  legacyCategoryId.value = legacyCategory?.id ?? null;
}

async function saveLegacyEntry(): Promise<void> {
  if (isSaving.value) {
    return;
  }

  if (!formData.value.year) {
    $q.notify({
      type: 'negative',
      message: 'Please select a year before saving.',
      position: 'bottom-right',
    });
    return;
  }

  if (!formData.value.netAmount || formData.value.netAmount <= 0) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid net amount before saving.',
      position: 'bottom-right',
    });
    return;
  }

  if (!legacyCategoryId.value) {
    await loadLegacyCategory();
    if (!legacyCategoryId.value) {
      return;
    }
  }

  isSaving.value = true;

  try {
    const legacyDate = toLegacyDate(formData.value.year);
    const existingTransactions = await transactionsStore.fetchTransactionByDate(
      legacyDate,
      TransactionType.COLLECTIONS,
    );
    const existingLegacyEntries = existingTransactions.filter(
      (transaction) =>
        transaction.is_legacy === 1 && transaction.category_id === legacyCategoryId.value,
    );

    if (existingLegacyEntries.length > 0) {
      const shouldReplace = await new Promise<boolean>((resolve) => {
        $q.dialog({
          title: 'Legacy Entry Already Exists',
          message: `A legacy net entry already exists for ${formData.value.year}. Replace it?`,
          ok: {
            label: 'Replace',
            color: 'negative',
            unelevated: true,
            rounded: true,
            noCaps: true,
          },
          cancel: {
            label: 'Cancel',
            flat: true,
            class: 'bg-blue-1',
            rounded: true,
            noCaps: true,
          },
        })
          .onOk(() => resolve(true))
          .onCancel(() => resolve(false));
      });

      if (!shouldReplace) {
        return;
      }

      existingLegacyEntries.forEach((transaction) => {
        if (transaction.id != null) {
          transactionsStore.deleteTransaction(transaction.id);
        }
      });
    }

    await transactionsStore.addTransaction({
      category_id: legacyCategoryId.value,
      amount: formData.value.netAmount,
      description: buildLegacyDescription(),
      date: legacyDate,
      is_legacy: 1,
    });

    $q.notify({
      type: 'positive',
      message: 'Previous year net entry saved successfully.',
      position: 'bottom-right',
    });

    resetForm();
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to save previous year net entry. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isSaving.value = false;
  }
}

const isFormDirty = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(createDefaultFormData());
});

async function onTabFocused(): Promise<void> {
  await loadLegacyCategory();
}

defineExpose({
  isFormDirty,
  onTabFocused,
});

onMounted(async () => {
  await transactionsStore.init();
  await loadLegacyCategory();
});
</script>

<style scoped lang="scss">
.form-section {
  h3 {
    margin: 0;
  }
}
</style>
