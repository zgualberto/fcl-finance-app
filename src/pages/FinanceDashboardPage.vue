<template>
  <div class="q-pa-lg">
    <q-card class="relative-position rounded-borders q-mb-md">
      <DashboardComponent />
    </q-card>

    <q-card class="relative-position rounded-borders">
      <YearOverYearComparisonComponent />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import DashboardComponent from 'components/FinanceDashboard/DashboardComponent.vue';
import YearOverYearComparisonComponent from 'src/components/FinanceDashboard/YearOverYearComparisonComponent.vue';
</script>
