import { ref } from 'vue';

/**
 * Reactive state for database recovery warning
 * Tracks if database was recovered from backup during this session
 */
const recovered = ref(false);
const recoveryTime = ref<Date | null>(null);

/**
 * Mark that recovery occurred
 */
export function setRecovered(isRecovered: boolean, time?: Date): void {
  recovered.value = isRecovered;
  recoveryTime.value = isRecovered ? time || new Date() : null;
}

/**
 * Dismiss the recovery warning (user acknowledged it)
 */
export function dismissRecoveryWarning(): void {
  recovered.value = false;
  recoveryTime.value = null;
}

/**
 * Composable hook to use recovery state in components
 */
export function useRecoveryWarning() {
  return {
    recovered,
    recoveryTime,
    setRecovered,
    dismissRecoveryWarning,
  };
}
