<template>
  <div class="q-pa-lg">
    <q-card class="q-pa-lg">
      <div class="q-mb-md">
        <h1 class="q-my-none text-h5 text-weight-bold text-primary">FCL Weekly Collection</h1>
        <p class="q-my-xs text-caption text-grey-7">Finance Team - Church Collections</p>
      </div>

      <q-form @submit="saveCollection">
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
            clearable
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
                  @update:model-value="calculateTotal"
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
                  @update:model-value="calculateTotal"
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
                  @update:model-value="calculateTotal"
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
            <div
              v-for="(tithe, index) in formData.tithes"
              :key="index"
              class="row items-start q-gutter-sm rounded-borders"
            >
              <div class="col">
                <q-select
                  v-model="tithe.memberId"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  :options="filteredMemberOptions"
                  :loading="isMembersLoading"
                  dense
                  outlined
                  use-input
                  @filter="memberFilterFn"
                  :input-debounce="300"
                  clearable
                  label="Member"
                  :rules="[(val) => !!val || 'Please select a member']"
                />
              </div>
              <div class="col-4 col-sm-3">
                <q-input
                  v-model.number="tithe.amount"
                  type="number"
                  outlined
                  dense
                  prefix="₱"
                  label="Amount"
                  @update:model-value="calculateTotal"
                  :rules="[(val) => !!val || 'This field should be a valid amount']"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  size="md"
                  @click="removeTithe(index)"
                />
              </div>
            </div>
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
      <div class="total-box q-mt-md q-pa-lg text-center text-white rounded-borders">
        <p class="q-my-none text-caption">Total Weekly Collection</p>
        <h2 class="q-my-none text-h4 text-weight-bold">₱{{ formatCurrency(totalAmount) }}</h2>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { date as dateUtils } from 'quasar';
import { useMembersStore } from 'src/stores/members-store';

interface Tithe {
  memberId: number | null;
  amount: number;
}

interface FormData {
  collectionDate: string;
  sundayOffering: number;
  midweekOffering: number;
  sundaySchoolOffering: number;
  tithes: Tithe[];
}

const formData = ref<FormData>({
  collectionDate: dateUtils.formatDate(new Date(), 'YYYY-MM-DD'),
  sundayOffering: 0,
  midweekOffering: 0,
  sundaySchoolOffering: 0,
  tithes: [
    {
      memberId: null,
      amount: 0,
    },
  ],
});

const totalAmount = ref(0);

function addTithes(count: number) {
  for (let i = 0; i < count; i++) {
    formData.value.tithes.push({
      memberId: null,
      amount: 0,
    });
  }
}

function removeTithe(index: number) {
  formData.value.tithes.splice(index, 1);
  calculateTotal();
}

function calculateTotal() {
  const offerings =
    (formData.value.sundayOffering || 0) +
    (formData.value.midweekOffering || 0) +
    (formData.value.sundaySchoolOffering || 0);

  const tithesTotal = formData.value.tithes.reduce((sum, tithe) => {
    return sum + (tithe.amount || 0);
  }, 0);

  totalAmount.value = offerings + tithesTotal;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function saveCollection() {
  console.log('Saving collection:', formData.value);
  // TODO: Implement database save
}

const memberStore = useMembersStore();
interface MemberOptions {
  value: number | undefined;
  label: string;
}
const filteredMemberOptions = ref<MemberOptions[]>([]);
const isMembersLoading = ref(false);
let memberFilterRequestId = 0;

function memberFilterFn(val: string, update: (callback: () => void) => void, abort: () => void) {
  const searchTerm = val.trim();
  if (searchTerm.length < 3) {
    update(() => {
      filteredMemberOptions.value = [];
    });
    return;
  }

  const requestId = (memberFilterRequestId += 1);
  isMembersLoading.value = true;

  void memberStore
    .searchMembers(searchTerm, 25)
    .then((members) => {
      if (requestId !== memberFilterRequestId) {
        abort();
        return;
      }
      update(() => {
        filteredMemberOptions.value = members.map((member) => ({
          value: member.id,
          label: member.name,
        }));
      });
    })
    .catch(() => {
      if (requestId !== memberFilterRequestId) {
        abort();
        return;
      }
      update(() => {
        filteredMemberOptions.value = [];
      });
    })
    .finally(() => {
      if (requestId === memberFilterRequestId) {
        isMembersLoading.value = false;
      }
    });
}

onMounted(() => {
  void memberStore.init(false);
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
