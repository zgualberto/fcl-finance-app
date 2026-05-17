<template>
  <q-card
    class="rounded-borders"
    :class="{ 'q-pa-sm': $q.screen.width > $q.screen.height, 'q-pa-xs': $q.screen.lt.sm }"
    flat
    bordered
  >
    <q-card-section
      :class="{ 'q-py-md': $q.screen.width > $q.screen.height, 'q-py-xs': $q.screen.lt.sm }"
    >
      <div class="row items-center">
        <div class="col text-h6">
          {{ configuration ? 'Edit Remittance Configuration' : 'Add New Remittance Configuration' }}
        </div>
        <div class="col-auto">
          <q-btn flat dense round icon="close" aria-label="Close form" @click="onCancel" />
        </div>
      </div>
    </q-card-section>

    <q-form @submit.prevent="onSubmit">
      <q-card-section
        class="q-gutter-md"
        :class="{ 'q-py-md': $q.screen.width > $q.screen.height, 'q-py-xs': $q.screen.lt.sm }"
      >
        <div class="row" :class="{ 'no-wrap': $q.screen.width > $q.screen.height }">
          <div class="col-12 col-sm-6">
            <div :class="{ 'q-pr-md': $q.screen.width > $q.screen.height }">
              <div class="text-body1 text-grey-7 q-mb-xs">Start Date</div>
              <q-input
                v-model="form.start_date"
                filled
                dense
                type="date"
                :rules="[(val) => !!val || 'Start date is required']"
                @update:model-value="validateDateRange"
              />
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-body1 text-grey-7 q-mb-xs">End Date</div>
            <q-input
              v-model="form.end_date"
              filled
              dense
              type="date"
              :rules="[(val) => !!val || 'End date is required']"
              @update:model-value="validateDateRange"
            />
          </div>
        </div>

        <div v-if="dateRangeError" class="q-mb-md">
          <q-banner class="bg-red-1 text-negative text-weight-bold rounded-borders q-pa-md">
            {{ dateRangeError }}
          </q-banner>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-body1 text-grey-7 q-mb-xs">Status</div>
          <q-select
            v-model="form.status"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            filled
            :options="statusOptions"
            dense
          />
        </div>

        <div class="row justify-start col-gap">
          <q-btn
            flat
            unelevated
            rounded
            no-caps
            label="Cancel"
            @click="onCancel"
            class="bg-blue-1 q-px-lg"
            color="primary"
          />
          <q-btn
            unelevated
            rounded
            no-caps
            label="Save"
            type="submit"
            color="primary"
            class="q-px-lg"
            :disable="!!dateRangeError"
          />
        </div>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { RemittanceConfiguration } from 'src/databases/entities/remittance-configuration';
import { date as dateUtils, useQuasar } from 'quasar';

const props = defineProps<{ configuration?: RemittanceConfiguration }>();
const emit = defineEmits(['ok', 'cancel']);

function todayDate() {
  return dateUtils.formatDate(new Date(), 'YYYY-MM-DD');
}

function normalizeDateInput(value: RemittanceConfiguration['start_date']): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.substring(0, 10);
  }

  return dateUtils.formatDate(value, 'YYYY-MM-DD');
}

const form = ref({
  start_date: todayDate(),
  end_date: todayDate(),
  status: true,
});

const dateRangeError = ref('');
const $q = useQuasar();

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

function validateDateRange() {
  dateRangeError.value = '';

  if (!form.value.start_date || !form.value.end_date) {
    return;
  }

  const startDate = new Date(form.value.start_date);
  const endDate = new Date(form.value.end_date);

  if (endDate < startDate) {
    dateRangeError.value = 'End date must be greater than or equal to start date';
    return;
  }
}

watch(
  () => props.configuration,
  (config) => {
    if (config) {
      form.value = {
        start_date: normalizeDateInput(config.start_date) || '',
        end_date: normalizeDateInput(config.end_date) || '',
        status: config.status === 1,
      };
    } else {
      resetForm();
    }
    dateRangeError.value = '';
  },
  { immediate: true },
);

function onSubmit() {
  // Final validation
  if (!form.value.start_date || !form.value.end_date) {
    $q.notify({
      position: 'bottom-right',
      color: 'negative',
      message: 'Both dates are required',
      icon: 'warning',
      timeout: 2000,
    });
    return;
  }

  if (dateRangeError.value) {
    $q.notify({
      position: 'bottom-right',
      color: 'negative',
      message: dateRangeError.value,
      icon: 'warning',
      timeout: 2000,
    });
    return;
  }

  emit('ok', {
    ...props.configuration,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
    status: form.value.status ? 1 : 0,
  });
}

function onCancel() {
  emit('cancel');
}

function resetForm() {
  form.value = {
    start_date: todayDate(),
    end_date: todayDate(),
    status: true,
  };
}
</script>

<style scoped>
.col-gap {
  column-gap: 12px;
}
</style>
