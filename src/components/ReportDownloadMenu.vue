<template>
  <q-menu>
    <q-list style="min-width: 250px">
      <q-item clickable v-close-popup @click="emit('download-pdf')">
        <q-item-section avatar>
          <q-icon name="fa-regular fa-file-lines" size="xs" />
        </q-item-section>
        <q-item-section>
          <div class="text-subtitle text-weight-bold">Export as PDF</div>
          <div class="text-caption">Print-ready document</div>
        </q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="emit('download-png')">
        <q-item-section avatar>
          <q-icon name="fa-regular fa-image" size="xs" />
        </q-item-section>
        <q-item-section>
          <div class="text-subtitle text-weight-bold">Export as PNG</div>
          <div class="text-caption">PNG screenshot</div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'download-pdf'): void;
  (e: 'download-png'): void;
}>();
</script>
