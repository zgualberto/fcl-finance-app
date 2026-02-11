<template>
  <q-card style="min-width: 320px">
    <q-card-section>
      <div class="text-h6">Select Report Period</div>
    </q-card-section>
    <q-card-section>
      <q-date v-model="localDate" default-view="Months" emit-immediately mask="YYYY-MM" />
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat label="Cancel" color="primary" @click="onDialogCancel" />
      <q-btn unelevated label="Apply" color="primary" @click="onDialogOK(localDate)" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';

const props = defineProps<{ modelValue: string }>();

const localDate = ref(props.modelValue);

const { onDialogOK, onDialogCancel } = useDialogPluginComponent();
</script>
