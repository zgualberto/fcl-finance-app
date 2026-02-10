<template>
  <div class="q-pa-lg">
    <q-card class="q-pa-lg relative-position">
      <div class="q-mb-md">
        <h1 class="q-my-none text-h5 text-weight-bold text-primary">FCL Weekly Collection</h1>
        <p class="q-my-xs text-caption text-grey-7">Finance Team - Church Collections</p>
      </div>

      <q-form ref="formRef" @submit="saveCollection">
        <section class="form-section q-mb-lg">
          <div class="text-h6">Collection Date</div>
          <q-separator class="q-mb-md"></q-separator>
          <div class="text-caption text-grey-7 q-mb-xs">Collection Date</div>
          <q-input
            v-model="formData.collectionDate"
            type="date"
            outlined
            dense
            class="full-width"
            :rules="[(val) => !!val || 'This field is required']"
          />
        </section>

        <!-- Service Offerings -->
        <section class="form-section">
          <div class="text-h6">Service Offerings</div>
          <q-separator class="q-mb-md"></q-separator>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">Sunday Service Offering</div>
                <q-input
                  v-model.number="formData.sundayOffering"
                  type="number"
                  outlined
                  dense
                  prefix="₱"
                  :rules="[
                    (val) =>
                      (val !== null && val !== undefined && val !== '') || 'This field is required',
                  ]"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">Midweek Service Offering</div>
                <q-input
                  v-model.number="formData.midweekOffering"
                  type="number"
                  outlined
                  dense
                  prefix="₱"
                  :rules="[
                    (val) =>
                      (val !== null && val !== undefined && val !== '') || 'This field is required',
                  ]"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">Sunday School Offering</div>
                <q-input
                  v-model.number="formData.sundaySchoolOffering"
                  type="number"
                  outlined
                  dense
                  prefix="₱"
                  :rules="[
                    (val) =>
                      (val !== null && val !== undefined && val !== '') || 'This field is required',
                  ]"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Tithes -->
        <section class="form-section q-mt-lg">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <div class="text-h6">Tithes ({{ formData.tithes.length }} entries)</div>
            </div>
            <div class="col-auto q-gutter-md">
              <q-btn
                rounded
                unelevated
                flat
                color="primary"
                @click="addTithes(10)"
                no-caps
                class="bg-blue-1"
              >
                <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
                Add 10
              </q-btn>
              <q-btn
                rounded
                unelevated
                flat
                color="primary"
                @click="addTithes(5)"
                no-caps
                class="bg-blue-1"
              >
                <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
                Add 5
              </q-btn>
              <q-btn unelevated color="primary" @click="addTithes(1)" rounded no-caps>
                <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
                Add 1
              </q-btn>
            </div>
          </div>
          <q-separator class="q-mb-md"></q-separator>

          <div class="q-my-md">
            <WeeklyCollectionsTitheRow
              v-for="(tithe, index) in formData.tithes"
              :key="index"
              v-model:member-id="tithe.memberId"
              v-model:member-name="tithe.memberName"
              v-model:search-term="tithe.searchTerm"
              v-model:amount="tithe.amount"
              @remove="removeTithe(index)"
            />
          </div>
          <!-- Save Button -->
          <q-btn
            type="submit"
            label="Save Collection"
            color="positive"
            class="full-width"
            no-caps
          />
        </section>
      </q-form>

      <q-separator class="q-my-lg" />
      <!-- Total Display -->
      <div class="total-box q-mt-md q-pa-lg text-white rounded-borders">
        <p class="q-my-none text-caption">Total Weekly Collection</p>
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
        <q-spinner-rings size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { date as dateUtils, type QForm, useQuasar } from 'quasar';
import { useMembersStore } from 'src/stores/members-store';
import { useCategoriesStore } from 'src/stores/categories-store';
import { useTransactionsStore } from 'src/stores/transactions-store';
import { OfferingCategoryName } from 'src/enums/offering_category';
import { TransactionType } from 'src/enums/transaction_type';
import type { Transaction } from 'src/databases/entities/transaction';
import WeeklyCollectionsTitheRow from './WeeklyCollectionsTitheRow.vue';
import CollectionSummaryDialog from './CollectionSummaryDialog.vue';

interface Tithe {
  memberId: number | null;
  memberName: string;
  amount: number;
  searchTerm: string;
}

interface FormData {
  collectionDate: string;
  sundayOffering: number;
  midweekOffering: number;
  sundaySchoolOffering: number;
  tithes: Tithe[];
}

const createDefaultTithe = (): Tithe => ({
  memberId: null,
  memberName: '',
  amount: 0,
  searchTerm: '',
});

const createDefaultFormData = (): FormData => ({
  collectionDate: dateUtils.formatDate(new Date(), 'YYYY-MM-DD'),
  sundayOffering: 0,
  midweekOffering: 0,
  sundaySchoolOffering: 0,
  tithes: [createDefaultTithe()],
});

const formData = ref<FormData>(createDefaultFormData());
const formRef = ref<QForm | null>(null);

const totalAmount = computed(() => {
  const offerings =
    (formData.value.sundayOffering || 0) +
    (formData.value.midweekOffering || 0) +
    (formData.value.sundaySchoolOffering || 0);

  const tithesTotal = formData.value.tithes.reduce((sum, tithe) => {
    return sum + (tithe.amount || 0);
  }, 0);

  return offerings + tithesTotal;
});

function addTithes(count: number) {
  for (let i = 0; i < count; i++) {
    formData.value.tithes.push(createDefaultTithe());
  }
}

function removeTithe(index: number) {
  formData.value.tithes.splice(index, 1);
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const memberStore = useMembersStore();
const categoriesStore = useCategoriesStore();
const transactionsStore = useTransactionsStore();
const $q = useQuasar();
const offeringCategoryNames = [
  OfferingCategoryName.MIDWEEK_SERVICE_OFFERING,
  OfferingCategoryName.SUNDAY_SCHOOL_OFFERING,
  OfferingCategoryName.SUNDAY_SERVICE_OFFERING,
  OfferingCategoryName.TITHES,
];
const offeringCategoryIds = ref<Record<string, number>>({});
const isSaving = ref(false);

function getMissingOfferingCategories(): OfferingCategoryName[] {
  return offeringCategoryNames.filter((name) => offeringCategoryIds.value[name] == null);
}

function getOfferingCategoryId(name: OfferingCategoryName): number {
  const id = offeringCategoryIds.value[name];
  if (id == null) {
    throw new Error(`Missing offering category: ${name}`);
  }
  return id;
}

function handleOpenSummary() {
  console.log('Opening summary for:', formData.value);
  // Open $q.dialog with QTable showing summary of transactions just added.
  $q.dialog({
    component: CollectionSummaryDialog,
    componentProps: {
      rows: buildTransactions(),
    },
  });
}

function resolveMemberLabel(tithe: Tithe): string | null {
  if (tithe.memberName) {
    return tithe.memberName;
  }
  if (tithe.memberId == null) {
    return null;
  }
  return memberStore.member(tithe.memberId)?.name ?? null;
}

function buildTransactions(): Partial<Transaction>[] {
  const tithesCategoryId = getOfferingCategoryId(OfferingCategoryName.TITHES);
  const collectionDate = formData.value.collectionDate;
  const transactions: Partial<Transaction>[] = [
    {
      category_id: getOfferingCategoryId(OfferingCategoryName.SUNDAY_SERVICE_OFFERING),
      amount: formData.value.sundayOffering,
      description: OfferingCategoryName.SUNDAY_SERVICE_OFFERING,
      date: collectionDate,
    },
    {
      category_id: getOfferingCategoryId(OfferingCategoryName.MIDWEEK_SERVICE_OFFERING),
      amount: formData.value.midweekOffering,
      description: OfferingCategoryName.MIDWEEK_SERVICE_OFFERING,
      date: collectionDate,
    },
    {
      category_id: getOfferingCategoryId(OfferingCategoryName.SUNDAY_SCHOOL_OFFERING),
      amount: formData.value.sundaySchoolOffering,
      description: OfferingCategoryName.SUNDAY_SCHOOL_OFFERING,
      date: collectionDate,
    },
  ];

  formData.value.tithes.forEach((tithe) => {
    const memberId = tithe.memberId as number;
    const memberLabel = resolveMemberLabel(tithe);
    const description = memberLabel ? `Tithe - ${memberLabel}` : `Tithe - Member ${memberId}`;

    transactions.push({
      category_id: tithesCategoryId,
      member_id: memberId,
      amount: tithe.amount,
      description,
      date: collectionDate,
    });
  });

  return transactions;
}

function resetForm() {
  formData.value = createDefaultFormData();
  void nextTick(() => {
    formRef.value?.resetValidation();
  });
}

async function saveCollection() {
  if (isSaving.value) {
    return;
  }

  const missingMemberIndex = formData.value.tithes.findIndex((tithe) => tithe.memberId == null);
  if (missingMemberIndex !== -1) {
    $q.notify({
      type: 'negative',
      message:
        'Please select a member for each tithe entry before saving. All fields are required.',
      caption: `Missing member on tithe entry #${missingMemberIndex + 1}`,
      position: 'top-right',
    });
    return;
  }

  isSaving.value = true;
  try {
    const transactions = buildTransactions();
    await transactionsStore.addTransactionsBatch(transactions);

    $q.notify({
      type: 'positive',
      message: 'Weekly collection saved successfully.',
      position: 'top-right',
    });
    handleOpenSummary();
    resetForm();
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to save weekly collection. Please try again.',
      position: 'top-right',
    });
  } finally {
    isSaving.value = false;
  }
}

async function createMissingOfferingCategories(names: OfferingCategoryName[]) {
  await categoriesStore.init(false);
  await Promise.all(
    names.map((name) =>
      categoriesStore.addCategory({
        category_name: name,
        is_active: 1,
        transaction_type: TransactionType.COLLECTIONS,
      }),
    ),
  );
}

async function loadOfferingCategories(skipDialog = false) {
  const categories = await categoriesStore.fetchCategoriesByNames(offeringCategoryNames);
  offeringCategoryIds.value = categories.reduce<Record<string, number>>((acc, category) => {
    if (category.id) {
      acc[category.category_name] = category.id;
    }
    return acc;
  }, {});

  const missingCategories = getMissingOfferingCategories();
  if (missingCategories.length > 0 && !skipDialog) {
    $q.dialog({
      title: 'Missing Categories',
      message:
        'One or more offering categories are missing. Would you like to create them now using the standard names?',
      ok: {
        label: 'Fix',
        color: 'primary',
        unelevated: true,
        rounded: true,
        noCaps: true,
      },
      cancel: { label: 'Cancel', flat: true, class: 'bg-blue-1', rounded: true, noCaps: true },
    }).onOk(() => {
      void (async () => {
        try {
          await createMissingOfferingCategories(missingCategories);
          await loadOfferingCategories(true);
        } catch {
          $q.notify({
            type: 'negative',
            message: 'Failed to create missing categories. Please try again.',
            position: 'top-right',
          });
        }
      })();
    });
  }
}

onMounted(() => {
  void memberStore.init(false);
  void transactionsStore.init();
  void loadOfferingCategories();
});
</script>

<style scoped lang="scss">
.form-section {
  h3 {
    margin: 0;
  }
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.op-70 {
  opacity: 0.7;
}

.total-box {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
}
</style>
