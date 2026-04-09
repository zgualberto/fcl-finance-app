<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <SettingsComponent />
  </div>
</template>

<script setup lang="ts">
import SettingsComponent from 'src/components/Admin/SettingsComponent.vue';
</script>
