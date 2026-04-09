<template>
  <q-card
    class="relative-position rounded-borders"
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-table
      :rows="members"
      :columns="columns"
      row-key="id"
      flat
      v-model:pagination="pagination"
      :rows-per-page-options="[20, 50, 100]"
      :loading="loading"
      @request="onRequest"
    >
      <template v-slot:top>
        <div class="row full-width items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h5 text-weight-bold">Members</div>
            <div class="text-body1 text-grey-7">Manage member list</div>
          </div>
          <div class="col-12 col-sm-auto">
            <q-input
              v-model="searchTerm"
              filled
              dense
              debounce="300"
              placeholder="Search members"
              style="min-width: 240px"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn color="primary" @click="openAddMemberForm" rounded unelevated no-caps>
              <q-icon name="add" size="xs" class="q-mr-sm"></q-icon>
              Add Member
            </q-btn>
          </div>
        </div>

        <div v-if="showForm" ref="formContainerRef" class="q-mt-md full-width">
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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});
const loading = ref(false);

const members = computed(() => membersStore.memberList);
const $q = useQuasar();
const showForm = ref(false);
const editingMember = ref<Member | null>(null);
const formContainerRef = ref<HTMLElement | null>(null);
const searchTerm = ref('');

async function focusForm() {
  await nextTick();
  formContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const openAddMemberForm = async () => {
  editingMember.value = null;
  showForm.value = true;
  await focusForm();
};

const openEditMemberForm = async (member: Member) => {
  editingMember.value = member;
  showForm.value = true;
  await focusForm();
};

async function refreshCurrentPage() {
  loading.value = true;
  const keyword = searchTerm.value.trim();
  const { total } = keyword
    ? await membersStore.searchMembersPage(
        keyword,
        pagination.value.page,
        pagination.value.rowsPerPage,
      )
    : await membersStore.fetchPage(pagination.value.page, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  loading.value = true;
  const { page, rowsPerPage } = props.pagination;
  const keyword = searchTerm.value.trim();
  const { total } = keyword
    ? await membersStore.searchMembersPage(keyword, page, rowsPerPage)
    : await membersStore.fetchPage(page, rowsPerPage);
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = total;
  loading.value = false;
}

watch(searchTerm, async (value) => {
  loading.value = true;
  pagination.value.page = 1;
  const keyword = value.trim();
  const { total } = keyword
    ? await membersStore.searchMembersPage(keyword, 1, pagination.value.rowsPerPage)
    : await membersStore.fetchPage(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
});

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
  await refreshCurrentPage();
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
    void refreshCurrentPage();
  });
};

onMounted(async () => {
  await membersStore.init(false);
  loading.value = true;
  const { total } = await membersStore.fetchPage(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = total;
  loading.value = false;
});
</script>
