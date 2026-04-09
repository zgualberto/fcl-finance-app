<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <CategoryComponent />
  </div>
</template>

<script setup lang="ts">
import CategoryComponent from 'components/Admin/CategoryComponent.vue';
</script>
