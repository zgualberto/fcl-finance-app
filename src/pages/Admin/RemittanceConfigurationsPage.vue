<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <RemittanceConfigurationComponent />
  </div>
</template>

<script setup lang="ts">
import RemittanceConfigurationComponent from 'components/Admin/RemittanceConfigurationComponent.vue';
</script>
