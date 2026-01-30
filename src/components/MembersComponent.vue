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
import { computed } from 'vue';
import { useMembersStore } from 'src/stores/members-store';
import type { QTableColumn } from 'quasar';
import type { Member } from 'src/databases/entities/member';

const membersStore = useMembersStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const members = computed(() => membersStore.memberList);

const openAddMemberDialog = () => {
  
};
const openEditMemberDialog = (member: Member) => {
  // Logic to open edit member dialog with member data
  console.log('Edit member:', member);
};
const confirmDeleteMember = (member: Member) => {
  // Logic to confirm and delete member
  console.log('Delete member:', member);
};
</script>
