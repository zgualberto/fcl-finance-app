<template>
  <div class="q-pa-lg">
    <q-card class="q-pa-lg no-borders rounded-borders">
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
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Tithes -->
        <section class="form-section q-mt-lg">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <h3 class="q-my-none text-subtitle2 text-weight-bold">
                Tithes ({{ formData.tithes.length }} entries)
              </h3>
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

          <div class="q-gutter-sm q-my-md">
            <div
              v-for="(tithe, index) in formData.tithes"
              :key="index"
              class="row items-end q-gutter-sm"
            >
              <div class="col">
                <q-select
                  v-model="tithe.memberId"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  required
                  :options="filteredMemberOptions"
                  dense
                  outlined
                  use-input
                  @filter="memberFilterFn"
                  :input-debounce="0"
                  clearable
                  label="Type search for name"
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
          <q-btn type="submit" label="Save Collection" color="positive" class="full-width" />
        </section>
      </q-form>

      <!-- Total Display -->
      <div class="total-box q-mt-md q-pa-lg text-center text-white rounded-borders">
        <p class="q-my-none text-caption op-70">Total Weekly Collection</p>
        <h2 class="q-my-none text-h4 text-weight-bold">₱{{ formatCurrency(totalAmount) }}</h2>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
const memberOptions = computed(() =>
  memberStore.memberList.map((member) => ({
    value: member.id,
    label: member.name,
  })),
);
const filteredMemberOptions = ref<MemberOptions[]>([]);

function memberFilterFn(val: string, update: (callback: () => void) => void) {
  setTimeout(() => {
    update(() => {
      if (val.length > 3) {
        filteredMemberOptions.value = memberOptions.value.map((v) => v);
      } else {
        const needle = val.toLowerCase();
        filteredMemberOptions.value = memberOptions.value.filter(
          (v) => v.label.toLowerCase().indexOf(needle) > -1,
        );
      }
    });
  }, 1500);
}

onMounted(() => {
  void memberStore.init();
});
</script>

<style scoped lang="scss">
.header {
  border-bottom: 1px solid #e0e0e0;
}

.form-section {
  h3 {
    margin: 0;
  }
}

.full-width {
  width: 100%;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.rounded-borders {
  border-radius: 8px;
}

.op-70 {
  opacity: 0.7;
}

.total-box {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
}
</style>
