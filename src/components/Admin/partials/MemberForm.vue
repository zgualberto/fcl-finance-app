<template>
  <q-card class="q-pa-sm rounded-borders" flat bordered>
    <q-card-section class="q-py-md">
      <div class="row items-center">
        <div class="col text-h6">
          {{ member ? 'Edit Member' : 'Add New Member' }}
        </div>
        <div class="col-auto">
          <q-btn flat dense round icon="close" aria-label="Close form" @click="onCancel" />
        </div>
      </div>
    </q-card-section>

    <q-form @submit.prevent="onSubmit">
      <q-card-section class="q-gutter-md">
        <div>
          <div class="text-body1 text-grey-7 q-mb-xs">Member Name</div>
          <q-input v-model="form.name" filled required dense />
        </div>
        <div>
          <div class="text-body1 text-grey-7 q-mb-xs">Status</div>
          <q-select
            v-model="form.is_active"
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
          />
        </div>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Member } from 'src/databases/entities/member';
import { useMembersStore } from 'src/stores/members-store';
import { useQuasar } from 'quasar';

const props = defineProps<{ member?: Member }>();
const emit = defineEmits(['ok', 'cancel']);

const form = ref({
  name: '',
  is_active: true,
});

const $q = useQuasar();
const membersStore = useMembersStore();

const statusOptions = [
  { label: 'Enable', value: true },
  { label: 'Disable', value: false },
];

watch(
  () => props.member,
  (member) => {
    if (member) {
      form.value = {
        name: member.name,
        is_active: member.is_active == 1 ? true : false,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function onSubmit() {
  const name = form.value.name.trim();
  if (props.member) {
    if (
      membersStore.memberList.some(
        (m) => m.name.toLowerCase() == name.toLowerCase() && m.id != props.member?.id,
      )
    ) {
      $q.notify({
        position: 'bottom-right',
        color: 'negative',
        message: 'Member already exists',
        icon: 'warning',
        timeout: 2000,
      });

      return false;
    }
  } else {
    if (membersStore.memberList.some((m) => m.name.toLowerCase() == name.toLowerCase())) {
      $q.notify({
        position: 'bottom-right',
        color: 'negative',
        message: 'Member already exists',
        icon: 'warning',
        timeout: 2000,
      });

      return false;
    }
  }

  emit('ok', {
    ...props.member,
    name,
    is_active: form.value.is_active == true ? 1 : 0,
  });
}

function onCancel() {
  emit('cancel');
}

function resetForm() {
  form.value = {
    name: '',
    is_active: true,
  };
}
</script>

<style scoped>
.col-gap {
  column-gap: 12px;
}
</style>
