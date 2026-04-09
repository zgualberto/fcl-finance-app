<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <TransactionComponent />
  </div>
</template>

<script setup lang="ts">
import TransactionComponent from 'components/Admin/TransactionComponent.vue';
</script>
