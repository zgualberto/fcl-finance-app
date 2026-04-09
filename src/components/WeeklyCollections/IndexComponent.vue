<template>
  <div
    :class="{
      'q-pa-lg': $q.screen.width > $q.screen.height,
      'q-pa-md': $q.platform.is.mobile,
    }"
  >
    <q-card
      class="relative-position rounded-borders"
      :class="{
        'q-pa-lg': $q.screen.width > $q.screen.height,
        'q-pa-md': $q.platform.is.mobile,
      }"
    >
      <div class="q-mb-md">
        <h1 class="q-my-none text-h5 text-weight-bold">FCL Weekly Collection</h1>
        <p class="q-my-xs text-body1 text-grey-7">Finance Team - Church Collections</p>
      </div>
      <div>
        <q-card
          bordered
          flat
          class="entry-type-card rounded-borders q-mb-md"
          :class="{
            'q-pa-lg': $q.screen.width > $q.screen.height,
            'q-pa-md': $q.platform.is.mobile,
          }"
        >
          <div class="row items-start no-wrap q-col-gutter-sm q-mb-md">
            <div class="col-auto">
              <q-icon name="info" size="20px" color="primary" class="entry-type-icon" />
            </div>
            <div class="col">
              <div class="text-h6 text-weight-bold">Entry Type</div>
              <p class="q-my-xs text-body2 entry-type-subtitle">
                Select the type of collection entry
              </p>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <button
                type="button"
                class="entry-type-option full-width text-left"
                :class="{ 'entry-type-option--active': activeTab === 'regular' }"
                @click="void switchTab('regular')"
              >
                <span class="entry-type-option__title">Regular Collection</span>
                <span class="entry-type-option__description">
                  Enter detailed weekly collections (offerings, tithes, etc.)
                </span>
              </button>
            </div>
            <div class="col-12 col-sm-6">
              <button
                type="button"
                class="entry-type-option full-width text-left"
                :class="{ 'entry-type-option--active': activeTab === 'legacy' }"
                @click="void switchTab('legacy')"
              >
                <span class="entry-type-option__title">Previous Year NET Entry</span>
                <span class="entry-type-option__description">
                  Quick entry for turned-over NET from 2023 or 2024
                </span>
              </button>
            </div>
          </div>
        </q-card>
      </div>

      <RegularCollectionComponent v-if="activeTab === 'regular'" ref="regularRef" />
      <PreviousYearNetEntryComponent v-else ref="legacyRef" />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

import RegularCollectionComponent from './RegularCollectionComponent.vue';
import PreviousYearNetEntryComponent from './PreviousYearNetEntryComponent.vue';

type ActiveTab = 'regular' | 'legacy';
type ExposedComponentState = {
  isFormDirty?: { value: boolean };
  onTabFocused?: () => Promise<void>;
};

const $q = useQuasar();

const activeTab = ref<ActiveTab>('regular');
const regularRef = ref<ExposedComponentState | null>(null);
const legacyRef = ref<ExposedComponentState | null>(null);

function getCurrentRef(tab: ActiveTab): ExposedComponentState | null {
  return tab === 'regular' ? regularRef.value : legacyRef.value;
}

async function confirmDiscardChanges(): Promise<boolean> {
  return await new Promise((resolve) => {
    $q.dialog({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes in this tab. Switch anyway and discard changes?',
      ok: {
        label: 'Switch Tab',
        color: 'negative',
        unelevated: true,
        rounded: true,
        noCaps: true,
      },
      cancel: {
        label: 'Stay Here',
        flat: true,
        class: 'bg-blue-1',
        rounded: true,
        noCaps: true,
      },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });
}

async function switchTab(nextTab: ActiveTab): Promise<void> {
  if (activeTab.value === nextTab) {
    return;
  }

  const currentRef = getCurrentRef(activeTab.value);
  const hasUnsavedChanges = currentRef?.isFormDirty?.value === true;

  if (hasUnsavedChanges) {
    const shouldSwitch = await confirmDiscardChanges();
    if (!shouldSwitch) {
      return;
    }
  }

  activeTab.value = nextTab;
}
</script>

<style scoped lang="scss">
.entry-type-card {
  border-color: #bfd6ff;
  background: #eef5ff;
}

.entry-type-icon {
  margin-top: 4px;
}

.entry-type-subtitle {
  color: var(--color-text-secondary);
}

.entry-type-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 102px;
  width: 100%;
  padding: 20px 18px;
  border: 2px solid var(--color-input-border);
  border-radius: 12px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.entry-type-option:hover {
  border-color: color-mix(in srgb, var(--color-primary) 32%, white);
}

.entry-type-option:focus {
  outline: none;
  border-color: var(--color-primary);
}

.entry-type-option:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 91, 234, 0.18);
}

.entry-type-option--active {
  border-color: var(--color-primary);
  background: var(--color-secondary-action);
  box-shadow: 0 0 0 2px rgba(30, 91, 234, 0.08);
}

.entry-type-option__title {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
}

.entry-type-option__description {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

@media (max-width: 599px) {
  .entry-type-option {
    min-height: auto;
  }
}
</style>
