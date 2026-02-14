<template>
  <div class="q-pa-md">
    <div class="q-mb-md">
      <h1 class="q-my-none text-h5 text-weight-bold text-primary">Activity Logs</h1>
      <p class="q-my-xs text-body1 text-grey-7">Finance Team - Check Activity Logs</p>
    </div>

    <ActivityLogsComponent />
  </div>
</template>

<script setup lang="ts">
import ActivityLogsComponent from 'src/components/Admin/ActivityLogsComponent.vue';
</script>
