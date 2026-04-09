<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <ActivityLogsComponent />
  </div>
</template>

<script setup lang="ts">
import ActivityLogsComponent from 'src/components/Admin/ActivityLogsComponent.vue';
</script>
