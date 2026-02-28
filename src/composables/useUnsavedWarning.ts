import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useRouter, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router';
import { useQuasar } from 'quasar';

interface UseUnsavedWarningOptions {
  formData: Ref<unknown>;
  defaultData: unknown;
  onReset?: () => void;
}

export function useUnsavedWarning({ formData, defaultData, onReset }: UseUnsavedWarningOptions) {
  const $q = useQuasar();
  const router = useRouter();
  const hasUnsavedChanges = ref(false);
  const isIgnoringNavigation = ref(false);

  /**
   * Deep comparison of two objects to detect changes
   */
  const hasChanges = computed(() => {
    return JSON.stringify(formData.value) !== JSON.stringify(defaultData);
  });

  watch(hasChanges, (newVal) => {
    hasUnsavedChanges.value = newVal;
  });

  /**
   * Show warning dialog when user tries to leave with unsaved changes
   */
  const showWarning = (): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Unsaved Changes',
        message:
          'You have unsaved data. Are you sure you want to leave? Your changes will be lost.',
        ok: {
          label: 'Leave Without Saving',
          color: 'negative',
          unelevated: true,
          rounded: true,
          noCaps: true,
        },
        cancel: {
          label: 'Continue Editing',
          flat: true,
          class: 'bg-blue-1',
          rounded: true,
          noCaps: true,
        },
      })
        .onOk(() => {
          isIgnoringNavigation.value = true;
          onReset?.();
          resolve(true);
        })
        .onCancel(() => {
          resolve(false);
        });
    });
  };

  /**
   * Handle beforeunload event (page refresh, close tab, etc.)
   */
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
  };

  /**
   * Handle router navigation
   */
  const handleRouterGuard = async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    if (isIgnoringNavigation.value) {
      isIgnoringNavigation.value = false;
      return next();
    }

    if (hasUnsavedChanges.value) {
      const shouldLeave = await showWarning();
      if (shouldLeave) {
        return next();
      }
      return next(false);
    }

    return next();
  };

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.beforeEach(handleRouterGuard);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  return {
    hasUnsavedChanges: computed(() => hasUnsavedChanges.value),
  };
}
