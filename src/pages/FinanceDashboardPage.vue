<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-card
      class="relative-position rounded-borders q-mb-lg"
      :class="{
        'q-pa-lg': $q.screen.width > $q.screen.height,
        'q-pa-md': $q.platform.is.mobile,
      }"
    >
      <DashboardComponent />
    </q-card>

    <q-card
      class="relative-position rounded-borders"
      :class="{
        'q-pa-lg': $q.screen.width > $q.screen.height,
        'q-pa-md': $q.platform.is.mobile,
      }"
    >
      <YearOverYearComparisonComponent />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import DashboardComponent from 'components/FinanceDashboard/DashboardComponent.vue';
import YearOverYearComparisonComponent from 'src/components/FinanceDashboard/YearOverYearComparisonComponent.vue';
</script>
