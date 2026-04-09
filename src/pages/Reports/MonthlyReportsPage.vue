<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-card
      class="relative-position rounded-borders"
      :class="{
        'q-pa-lg': $q.screen.width > $q.screen.height,
        'q-pa-md': $q.platform.is.mobile,
      }"
    >
      <MonthlyComponent />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import MonthlyComponent from '../../components/Reports/MonthlyComponent.vue';
</script>
