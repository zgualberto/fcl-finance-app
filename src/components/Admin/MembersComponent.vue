<template>
  <q-card class="q-pa-lg shadow-box shadow-3 rounded-borders">
    <q-table
      :rows="members"
      :columns="columns"
      row-key="id"
      flat
      :pagination="pagination"
      :rows-per-page-options="[0, 20, 50, 100]"
    >
      <template v-slot:top>
        <div class="row full-width">
          <div class="col">
            <div class="text-h5 text-weight-bold">Members</div>
            <div class="text-body1 text-grey-7">Manage member list</div>
          </div>
          <div class="col-auto">
            <q-btn color="primary" @click="openAddMemberForm" rounded unelevated no-caps>
              <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
              Add Member
            </q-btn>
          </div>
        </div>

        <div v-if="showForm" class="q-mt-md full-width">
          <MemberForm
            v-bind="editingMember ? { member: editingMember } : {}"
            @ok="handleFormOk"
            @cancel="handleFormCancel"
          />
        </div>
      </template>
      <template v-slot:body-cell-isActive="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.is_active ? 'green-2' : 'red-2'"
            class="q-pa-sm text-black text-weight-bold"
            rounded
          >
            {{ props.row.is_active ? 'Enabled' : 'Disabled' }}
          </q-badge>
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td align="center">
          <q-btn
            flat
            round
            icon="fa-solid fa-edit"
            aria-label="Edit Member"
            size="sm"
            @click="openEditMemberForm(props.row)"
            color="primary"
          />
          <q-btn
            flat
            round
            icon="fa-regular fa-trash-can"
            aria-label="Delete Member"
            color="negative"
            size="sm"
            @click="confirmDeleteMember(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useMembersStore } from 'src/stores/members-store';
import { useQuasar, type QTableColumn } from 'quasar';
import type { Member } from 'src/databases/entities/member';
import MemberForm from './partials/MemberForm.vue';

const membersStore = useMembersStore();

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', classes: 'text-weight-bold' },
  { name: 'name', label: 'Name', field: 'name', align: 'left', classes: 'text-weight-bold' },
  { name: 'isActive', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'actions', field: 'action', label: 'Actions', align: 'center' },
];

const pagination = {
  rowsPerPage: 20,
};

const members = computed(() => membersStore.memberList);
const $q = useQuasar();
const showForm = ref(false);
const editingMember = ref<Member | null>(null);

const openAddMemberForm = () => {
  editingMember.value = null;
  showForm.value = true;
};

const openEditMemberForm = (member: Member) => {
  editingMember.value = member;
  showForm.value = true;
};

const handleFormOk = async (data: Partial<Member>) => {
  if (editingMember.value) {
    membersStore.updateMember(data as Member);
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `${data.name} has been updated successfully`,
      timeout: 2000,
    });
  } else {
    await membersStore.addMember(data);
    $q.notify({
      position: 'bottom-right',
      type: 'positive',
      message: `${data.name} has been created successfully`,
      timeout: 2000,
    });
  }

  showForm.value = false;
  editingMember.value = null;
};

const handleFormCancel = () => {
  showForm.value = false;
  editingMember.value = null;
};
const confirmDeleteMember = (member: Member) => {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete member "${member.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void membersStore.deleteMember(member.id!);
  });
};

onMounted(async () => {
  await membersStore.init();
});
</script>
