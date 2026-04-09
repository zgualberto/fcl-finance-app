<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <MembersComponent />
  </div>
</template>

<script setup lang="ts">
import MembersComponent from 'components/Admin/MembersComponent.vue';
</script>
