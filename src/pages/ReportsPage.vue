<template>
  <div class="q-pa-lg">
    <q-card class="q-pa-lg relative-position">
      <div class="q-mb-md text-center">
        <h1 class="q-my-none text-h5 text-weight-bold text-primary">
          Financial Report for February 2026
        </h1>
        <p class="q-my-xs text-caption text-grey-7">Monthly Collections and Expenses Summary</p>
      </div>

      <ReportsComponent />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import ReportsComponent from '../components/ReportsComponent.vue';
</script>
