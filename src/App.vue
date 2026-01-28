<template>
  <div class="app-container">
    <!-- Database Recovery Warning Banner -->
    <q-banner v-if="recovered" class="bg-warning text-white" dense @click="dismissRecoveryWarning">
      <template #avatar>
        <q-icon name="warning" />
      </template>
      <strong>Database Recovery</strong> - Your database was corrupted and has been restored from a
      backup at {{ formattedTime }}. Please verify your data. Click to dismiss.
    </q-banner>

    <!-- Main App Content -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRecoveryWarning } from 'src/composables/useRecoveryWarning';

const { recovered, recoveryTime, dismissRecoveryWarning } = useRecoveryWarning();

const formattedTime = computed(() => {
  if (!recoveryTime.value) return '';
  return recoveryTime.value.toLocaleTimeString();
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
