<template>
  <div class="q-pa-lg">
    <q-card class="q-pa-lg relative-position">
      <div class="q-mb-md">
        <h1 class="q-my-none text-h5 text-weight-bold">FCL Weekly Collection</h1>
        <p class="q-my-xs text-body1 text-grey-7">Finance Team - Church Collections</p>
      </div>

      <q-form ref="formRef" @submit="saveCollection">
        <section class="form-section q-mb-lg">
          <div class="text-h6">Collection Date</div>
          <q-separator class="q-mb-md"></q-separator>
          <div class="row">
            <div class="col-12 col-sm-4">
              <div class="text-body1 text-grey-7 q-mb-xs">Collection Date</div>
              <q-input
                v-model="formData.collectionDate"
                type="date"
                outlined
                dense
                class="full-width"
                :rules="[(val) => !!val || 'This field is required']"
                icon="event"
              />
            </div>
          </div>
        </section>

        <!-- Service Offerings -->
        <section class="form-section">
          <div class="text-h6">Service Offerings</div>
          <q-separator class="q-mb-md"></q-separator>
          <ServiceOfferingsRow
            v-model:sunday-offering="formData.sundayOffering"
            v-model:midweek-offering="formData.midweekOffering"
            v-model:sunday-school-offering="formData.sundaySchoolOffering"
          />
        </section>

        <!-- Other Offerings -->
        <section class="form-section q-mt-lg">
          <div class="text-h6">Other Offerings</div>
          <q-separator class="q-mb-md"></q-separator>
          <OtherOfferingsRow
            v-model:everybodys-birthday="formData.everybodysBirthday"
            v-model:special-funding="formData.specialFunding"
          />
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
import { WeeklyOfferingCategoryName } from 'src/enums/weekly_offering_category';
import { CollectionsCategoryName } from 'src/enums/collections_category';
import { OtherOfferingCategoryName } from 'src/enums/other_offering_category';
import { TransactionType } from 'src/enums/transaction_type';
import type { Transaction } from 'src/databases/entities/transaction';
import type { Category } from 'src/databases/entities/category';

import WeeklyCollectionsTitheRow from './Tithes/RowComponent.vue';
import ServiceOfferingsRow from './ServiceOfferings/RowComponent.vue';
import OtherOfferingsRow from './OtherOfferings/RowComponent.vue';
import CollectionSummaryDialog from './SummaryDialogComponent.vue';

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
  everybodysBirthday: number;
  specialFunding: number;
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
  everybodysBirthday: 0,
  specialFunding: 0,
  tithes: [createDefaultTithe()],
});

const formData = ref<FormData>(createDefaultFormData());
const formRef = ref<QForm | null>(null);

const totalAmount = computed(() => {
  const offerings =
    (formData.value.sundayOffering || 0) +
    (formData.value.midweekOffering || 0) +
    (formData.value.sundaySchoolOffering || 0) +
    (formData.value.everybodysBirthday || 0) +
    (formData.value.specialFunding || 0);

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
const offeringCategoryNames: WeeklyOfferingCategoryName[] = [
  WeeklyOfferingCategoryName.MIDWEEK_SERVICE_OFFERING,
  WeeklyOfferingCategoryName.SUNDAY_SCHOOL_OFFERING,
  WeeklyOfferingCategoryName.SUNDAY_SERVICE_OFFERING,
  WeeklyOfferingCategoryName.TITHES,
];
const otherOfferingCategoryNames: OtherOfferingCategoryName[] = [
  OtherOfferingCategoryName.EVERYBODYS_BIRTHDAY,
  OtherOfferingCategoryName.SPECIAL_FUNDING,
];
type HierarchyGroup = {
  parentName: CollectionsCategoryName;
  childNames: string[];
};

const categoryHierarchyGroups: HierarchyGroup[] = [
  {
    parentName: CollectionsCategoryName.SERVICE_OFFERINGS,
    childNames: [...offeringCategoryNames],
  },
  {
    parentName: CollectionsCategoryName.OTHER_COLLECTIONS,
    childNames: [...otherOfferingCategoryNames],
  },
];
const allCategoryNames: string[] = [
  ...categoryHierarchyGroups.map((group) => group.parentName),
  ...categoryHierarchyGroups.flatMap((group) => group.childNames),
];
const offeringCategoryIds = ref<Record<string, number>>({});
const otherOfferingCategoryIds = ref<Record<string, number>>({});
const isSaving = ref(false);

function buildCategoryMap(categories: Category[]): Record<string, Category> {
  return categories.reduce<Record<string, Category>>((acc, category) => {
    acc[category.category_name] = category;
    return acc;
  }, {});
}

function getHierarchyIssues(categoryMap: Record<string, Category>) {
  const missingParents: string[] = [];
  const missingChildren: string[] = [];
  const mismatchedChildren: Category[] = [];

  categoryHierarchyGroups.forEach((group) => {
    const parent = categoryMap[group.parentName];
    if (!parent?.id) {
      missingParents.push(group.parentName);
      return;
    }

    const parentId = parent.id;

    group.childNames.forEach((childName) => {
      const child = categoryMap[childName];
      if (!child?.id) {
        missingChildren.push(childName);
        return;
      }

      if (child.parent_id !== parentId) {
        mismatchedChildren.push(child);
      }
    });
  });

  return { missingParents, missingChildren, mismatchedChildren };
}

function getOfferingCategoryId(name: WeeklyOfferingCategoryName): number {
  const id = offeringCategoryIds.value[name];
  if (id == null) {
    throw new Error(`Missing offering category: ${name}`);
  }
  return id;
}

function getOtherOfferingCategoryId(name: OtherOfferingCategoryName): number {
  const id = otherOfferingCategoryIds.value[name];
  if (id == null) {
    throw new Error(`Missing other offering category: ${name}`);
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
  const tithesCategoryId = getOfferingCategoryId(WeeklyOfferingCategoryName.TITHES);
  const collectionDate = formData.value.collectionDate;
  const transactions: Partial<Transaction>[] = [
    {
      category_id: getOfferingCategoryId(WeeklyOfferingCategoryName.SUNDAY_SERVICE_OFFERING),
      amount: formData.value.sundayOffering,
      description: WeeklyOfferingCategoryName.SUNDAY_SERVICE_OFFERING,
      date: collectionDate,
    },
    {
      category_id: getOfferingCategoryId(WeeklyOfferingCategoryName.MIDWEEK_SERVICE_OFFERING),
      amount: formData.value.midweekOffering,
      description: WeeklyOfferingCategoryName.MIDWEEK_SERVICE_OFFERING,
      date: collectionDate,
    },
    {
      category_id: getOfferingCategoryId(WeeklyOfferingCategoryName.SUNDAY_SCHOOL_OFFERING),
      amount: formData.value.sundaySchoolOffering,
      description: WeeklyOfferingCategoryName.SUNDAY_SCHOOL_OFFERING,
      date: collectionDate,
    },
    {
      category_id: getOtherOfferingCategoryId(OtherOfferingCategoryName.EVERYBODYS_BIRTHDAY),
      amount: formData.value.everybodysBirthday,
      description: OtherOfferingCategoryName.EVERYBODYS_BIRTHDAY,
      date: collectionDate,
    },
    {
      category_id: getOtherOfferingCategoryId(OtherOfferingCategoryName.SPECIAL_FUNDING),
      amount: formData.value.specialFunding,
      description: OtherOfferingCategoryName.SPECIAL_FUNDING,
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
      message: 'Weekly collection saved successfully.',
      position: 'bottom-right',
    });
    handleOpenSummary();
    resetForm();
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to save weekly collection. Please try again.',
      position: 'bottom-right',
    });
  } finally {
    isSaving.value = false;
  }
}

async function ensureCategoryHierarchy(): Promise<void> {
  await categoriesStore.init(false);

  let categories = await categoriesStore.fetchCategoriesByNames(allCategoryNames);
  let categoryMap = buildCategoryMap(categories);
  const { missingParents } = getHierarchyIssues(categoryMap);

  if (missingParents.length > 0) {
    await Promise.all(
      missingParents.map((name) =>
        categoriesStore.addCategory({
          category_name: name,
          is_active: 1,
          transaction_type: TransactionType.COLLECTIONS,
        }),
      ),
    );
  }

  categories = await categoriesStore.fetchCategoriesByNames(allCategoryNames);
  categoryMap = buildCategoryMap(categories);

  const createChildPromises: Promise<void>[] = [];
  categoryHierarchyGroups.forEach((group) => {
    const parent = categoryMap[group.parentName];
    if (!parent?.id) {
      return;
    }

    const parentId = parent.id;

    group.childNames.forEach((childName) => {
      const child = categoryMap[childName];
      if (!child?.id) {
        createChildPromises.push(
          categoriesStore.addCategory({
            category_name: childName,
            is_active: 1,
            parent_id: parentId,
          }),
        );
        return;
      }

      if (child.parent_id !== parentId) {
        void categoriesStore.updateCategory({
          id: child.id,
          category_name: child.category_name,
          is_active: child.is_active,
          parent_id: parentId,
        });
      }
    });
  });

  if (createChildPromises.length > 0) {
    await Promise.all(createChildPromises);
  }
}

async function loadOfferingCategories(skipDialog = false) {
  await categoriesStore.init(false);
  const categories = await categoriesStore.fetchCategoriesByNames(allCategoryNames);
  const categoryMap = buildCategoryMap(categories);
  const { missingParents, missingChildren, mismatchedChildren } = getHierarchyIssues(categoryMap);

  offeringCategoryIds.value = offeringCategoryNames.reduce<Record<string, number>>((acc, name) => {
    const category = categoryMap[name];
    if (category?.id) {
      acc[name] = category.id;
    }
    return acc;
  }, {});

  otherOfferingCategoryIds.value = otherOfferingCategoryNames.reduce<Record<string, number>>(
    (acc, name) => {
      const category = categoryMap[name];
      if (category?.id) {
        acc[name] = category.id;
      }
      return acc;
    },
    {},
  );

  const hasIssues =
    missingParents.length > 0 || missingChildren.length > 0 || mismatchedChildren.length > 0;
  if (hasIssues && !skipDialog) {
    $q.dialog({
      title: 'Missing Categories',
      message:
        'One or more categories are missing or not linked to their parent. Would you like to fix them now?',
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
          await ensureCategoryHierarchy();
          await loadOfferingCategories(true);
        } catch {
          $q.notify({
            type: 'negative',
            message: 'Failed to create missing categories. Please try again.',
            position: 'bottom-right',
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
