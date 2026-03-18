<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
  >
    <div class="row full-width q-mb-md items-start">
      <div class="col">
        <div class="text-h5 text-weight-bold">Finance Dashboard</div>
        <div class="text-body1 text-grey-7">FCL Church - {{ selectedYear }} overview</div>
      </div>
      <div class="col-auto">
        <div class="row q-col-gutter-sm">
          <div>
            <div class="row items-center q-gutter-md">
              <q-icon name="fa-regular fa-calendar" size="24px" class="text-grey-6" />
              <q-select
                v-model="selectedYear"
                :options="yearsOptions"
                dense
                outlined
                emit-value
                map-options
                class="annual-header-select"
              />
              <q-btn
                color="positive"
                icon="download"
                label="Download"
                unelevated
                rounded
                class="annual-download-button"
                no-caps
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-card class="summary-card summary-card-collection text-white full-height" flat>
          <q-card-section>
            <div class="text-subtitle2">Total Collections</div>
            <div class="text-h4 text-weight-bold">
              ₱{{ formatCurrency(summaryTotals.collections) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card class="summary-card summary-card-expenses text-white full-height" flat>
          <q-card-section>
            <div class="text-subtitle2">Total Expenses</div>
            <div class="text-h4 text-weight-bold">
              ₱{{ formatCurrency(summaryTotals.expenses) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card class="summary-card summary-card-net text-white full-height" flat>
          <q-card-section>
            <div class="text-subtitle2">Net Collection</div>
            <div class="text-h4 text-weight-bold">₱{{ formatCurrency(summaryTotals.net) }}</div>
            <div class="text-caption">
              After National {{ nationalRateLabel }} & District {{ districtRateLabel }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const selectedYear = ref(String(new Date().getFullYear()));
const yearsOptions = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { label: String(year), value: String(year) };
});
</script>
