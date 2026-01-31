<template>
  <q-table title="Members" :rows="members" :columns="columns" row-key="id" flat bordered>
    <template v-slot:top-right>
      <q-btn color="primary" @click="openAddMemberDialog" rounded unelevated no-caps>
        <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
        Add Member
      </q-btn>
    </template>
    <template v-slot:body-cell-actions="props">
      <q-td align="center">
        <q-btn
          flat
          dense
          round
          icon="fa-solid fa-edit"
          aria-label="Edit Member"
          @click="openEditMemberDialog(props.row)"
        />
        <q-btn
          flat
          dense
          round
          icon="fa-solid fa-trash"
          aria-label="Delete Member"
          color="negative"
          @click="confirmDeleteMember(props.row)"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMembersStore } from 'src/stores/members-store';
import { useQuasar, type QTableColumn } from 'quasar';
import type { Member } from 'src/databases/entities/member';

const membersStore = useMembersStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const members = computed(() => membersStore.memberList);
const $q = useQuasar();

const openAddMemberDialog = () => {
  $q.dialog({
    title: 'New Member',
    message: 'Please enter name:',
    prompt: {
      model: '',
      type: 'text', // optional
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    void membersStore.addMember(data as string);
  });
};
const openEditMemberDialog = (member: Member) => {
  $q.dialog({
    title: 'Edit Member',
    message: 'Update name:',
    prompt: {
      model: member.name,
      type: 'text', // optional
    },
    cancel: true,
    persistent: true,
  })
    .onOk((data) => {
      console.log('Updating member', member, 'to new name', data);
    })
    .onCancel(() => {
      console.log('Edit cancelled');
    });
};
const confirmDeleteMember = (member: Member) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete member "${member.name}"?`,
    cancel: true,
    persistent: true,
  })
    .onOk(() => {
      console.log('Deleting member', member);
    })
    .onCancel(() => {
      console.log('Delete cancelled');
    });
};

onMounted(async () => {
  await membersStore.init();
});
</script>
