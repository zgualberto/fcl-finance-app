<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-sm-6 col-md-4">
      <div>
        <div class="text-caption text-grey-7 q-mb-xs">Sunday Service Offering</div>
        <q-input
          v-model.number="localSundayOffering"
          type="number"
          outlined
          dense
          prefix="₱"
          :rules="[
            (val) => (val !== null && val !== undefined && val !== '') || 'This field is required',
          ]"
        />
      </div>
    </div>
    <div class="col-12 col-sm-6 col-md-4">
      <div>
        <div class="text-caption text-grey-7 q-mb-xs">Midweek Service Offering</div>
        <q-input
          v-model.number="localMidweekOffering"
          type="number"
          outlined
          dense
          prefix="₱"
          :rules="[
            (val) => (val !== null && val !== undefined && val !== '') || 'This field is required',
          ]"
        />
      </div>
    </div>
    <div class="col-12 col-sm-6 col-md-4">
      <div>
        <div class="text-caption text-grey-7 q-mb-xs">Sunday School Offering</div>
        <q-input
          v-model.number="localSundaySchoolOffering"
          type="number"
          outlined
          dense
          prefix="₱"
          :rules="[
            (val) => (val !== null && val !== undefined && val !== '') || 'This field is required',
          ]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  sundayOffering: number;
  midweekOffering: number;
  sundaySchoolOffering: number;
}>();

const emit = defineEmits<{
  (event: 'update:sundayOffering', value: number): void;
  (event: 'update:midweekOffering', value: number): void;
  (event: 'update:sundaySchoolOffering', value: number): void;
}>();

const localSundayOffering = computed({
  get: () => props.sundayOffering,
  set: (value) => emit('update:sundayOffering', value),
});

const localMidweekOffering = computed({
  get: () => props.midweekOffering,
  set: (value) => emit('update:midweekOffering', value),
});

const localSundaySchoolOffering = computed({
  get: () => props.sundaySchoolOffering,
  set: (value) => emit('update:sundaySchoolOffering', value),
});
</script>
