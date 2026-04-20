import { defineBoot } from '#q-app/wrappers';
import { Share } from '@capacitor/share';

function isElectronRuntime(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
}

export default defineBoot(async () => {
  if (isElectronRuntime()) {
    console.log('[Share Boot] Skipping Capacitor Share warmup in Electron runtime');
    return;
  }

  try {
    console.log('[Share Boot] Initializing Share plugin...');

    // Force plugin registration by checking if share is available
    await Share.canShare()
      .then((result) => {
        console.log('[Share Boot] Share plugin initialized, canShare:', result.value);
      })
      .catch((error) => {
        console.error('[Share Boot] Warning: Share initialization:', error);
      });
  } catch (error) {
    console.error('[Share Boot] Warning: Share initialization:', error);
    // Don't throw - plugin might still be available
  }
});
