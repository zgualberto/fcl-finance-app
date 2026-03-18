<template>
  <div class="q-pa-lg">
    <q-card
      class="relative-position rounded-borders q-mb-md"
      :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
    >
      <DashboardComponent />
    </q-card>

    <q-card
      class="relative-position rounded-borders"
      :class="{ 'q-ma-sm q-pa-lg': $q.screen.width > $q.screen.height, 'q-pa-md': $q.screen.lt.sm }"
    >
      <YearOverYearComparisonComponent />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import DashboardComponent from 'components/FinanceDashboard/DashboardComponent.vue';
import YearOverYearComparisonComponent from 'src/components/FinanceDashboard/YearOverYearComparisonComponent.vue';
</script>
