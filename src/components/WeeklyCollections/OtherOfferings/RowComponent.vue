<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-sm-4">
      <div>
        <div class="text-body1 text-grey-7 q-mb-xs">Everybody's Birthday</div>
        <q-input
          v-model.number="localEverybodysBirthday"
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
    <div class="col-12 col-sm-4">
      <div>
        <div class="text-body1 text-grey-7 q-mb-xs">Special Funding</div>
        <q-input
          v-model.number="localSpecialFunding"
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
  everybodysBirthday: number;
  specialFunding: number;
}>();

const emit = defineEmits<{
  (event: 'update:everybodysBirthday', value: number): void;
  (event: 'update:specialFunding', value: number): void;
}>();

const localEverybodysBirthday = computed({
  get: () => props.everybodysBirthday,
  set: (value) => emit('update:everybodysBirthday', value),
});

const localSpecialFunding = computed({
  get: () => props.specialFunding,
  set: (value) => emit('update:specialFunding', value),
});
</script>
