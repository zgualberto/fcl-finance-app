<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <BackupsComponent />
  </div>
</template>

<script setup lang="ts">
import BackupsComponent from 'components/Admin/BackupsComponent.vue';
</script>
