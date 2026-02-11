<template>
  <div class="row items-start q-gutter-sm rounded-borders">
    <div class="col">
      <q-select
        v-model="localMemberId"
        v-model:input-value="localSearchTerm"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        :options="normalizedOptions"
        :loading="isMembersLoading"
        dense
        outlined
        use-input
        @filter="memberFilterFn"
        :input-debounce="0"
        label="Member"
        :rules="[(val) => !!val || 'Please select a member']"
        clearable
        @update:model-value="updateMemberName"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No members found. </q-item-section>
          </q-item>
          <q-item v-if="localSearchTerm.length < 3">
            <q-item-section class="text-grey">
              Type at least 3 characters to search.
            </q-item-section>
          </q-item>
          <q-item v-else>
            <q-item-section>
              <q-btn
                flat
                no-caps
                color="primary"
                rounded
                :disable="isCreatingMember"
                @click="createMemberFromSearch"
              >
                <q-icon name="add" size="xs" class="q-mr-md" />
                Create member "{{ localSearchTerm }}"
              </q-btn>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-4 col-sm-3">
      <q-input
        v-model.number="localAmount"
        type="number"
        outlined
        dense
        prefix="₱"
        label="Amount"
        :rules="[(val) => !!val || 'This field should be a valid amount']"
      />
    </div>
    <div class="col-auto">
      <q-btn flat dense round icon="delete" color="negative" size="md" @click="emit('remove')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useMembersStore } from 'src/stores/members-store';

interface MemberOption {
  value: number;
  label: string;
}

const props = defineProps<{
  memberId: number | null;
  memberName: string;
  amount: number;
  searchTerm: string;
}>();

const emit = defineEmits<{
  (event: 'update:memberId', value: number | null): void;
  (event: 'update:memberName', value: string): void;
  (event: 'update:amount', value: number): void;
  (event: 'update:searchTerm', value: string): void;
  (event: 'remove'): void;
}>();

const memberStore = useMembersStore();
const $q = useQuasar();
const memberOptions = ref<MemberOption[]>([]);
const isMembersLoading = ref(false);
const isCreatingMember = ref(false);
const memberFilterRequestId = ref(0);

const localMemberId = computed({
  get: () => props.memberId,
  set: (value) => emit('update:memberId', value),
});

const localAmount = computed({
  get: () => props.amount,
  set: (value) => emit('update:amount', value),
});

const localSearchTerm = computed({
  get: () => props.searchTerm,
  set: (value) => emit('update:searchTerm', value),
});

const normalizedOptions = computed(() => {
  const options = [...memberOptions.value];
  const currentId = props.memberId;
  if (currentId != null && !options.some((option) => option.value === currentId)) {
    const memberName = props.memberName || memberStore.member(currentId)?.name;
    if (memberName) {
      options.unshift({ value: currentId, label: memberName });
    }
  }
  return options;
});

function updateMemberName(value: number | null) {
  if (value == null) {
    emit('update:memberName', '');
    return;
  }
  const option = memberOptions.value.find((entry) => entry.value === value);
  if (option) {
    emit('update:memberName', option.label);
    return;
  }
  const memberName = memberStore.member(value)?.name;
  emit('update:memberName', memberName ?? '');
}

function memberFilterFn(val: string, update: (callback: () => void) => void, abort: () => void) {
  const searchTerm = val.trim();
  localSearchTerm.value = searchTerm;
  if (searchTerm.length < 3) {
    update(() => {
      memberOptions.value = [];
    });
    return;
  }

  const requestId = (memberFilterRequestId.value += 1);
  isMembersLoading.value = true;

  void memberStore
    .searchMembers(searchTerm, 25)
    .then((members) => {
      if (requestId !== memberFilterRequestId.value) {
        abort();
        return;
      }
      update(() => {
        memberOptions.value = members
          .filter((member) => member.id != null)
          .map((member) => ({
            value: member.id as number,
            label: member.name,
          }));
      });
    })
    .catch(() => {
      if (requestId !== memberFilterRequestId.value) {
        abort();
        return;
      }
      update(() => {
        memberOptions.value = [];
      });
    })
    .finally(() => {
      if (requestId === memberFilterRequestId.value) {
        isMembersLoading.value = false;
      }
    });
}

function createMemberFromSearch() {
  const searchTerm = localSearchTerm.value.trim();
  if (!searchTerm) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a member name before creating.',
      position: 'top-right',
    });
    return;
  }
  if (isCreatingMember.value) {
    return;
  }

  isCreatingMember.value = true;
  void (async () => {
    try {
      const newMember = await memberStore.createMember(searchTerm);
      if (!newMember) {
        throw new Error('Failed to create member');
      }
      if (newMember.id == null) {
        throw new Error('Created member missing id');
      }
      memberOptions.value = [
        {
          value: newMember.id,
          label: newMember.name,
        },
      ];
      updateMemberName(newMember.id);
      $q.notify({
        type: 'positive',
        message: 'Member created successfully.',
        position: 'top-right',
      });
      localSearchTerm.value = '';
    } catch {
      $q.notify({
        type: 'negative',
        message: 'Failed to create member. Please try again.',
        position: 'top-right',
      });
    } finally {
      isCreatingMember.value = false;
    }
  })();
}
</script>
