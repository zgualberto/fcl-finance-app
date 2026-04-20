import { defineBoot } from '#q-app/wrappers';
import { Filesystem, Directory } from '@capacitor/filesystem';

function isElectronRuntime(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
}

export default defineBoot(async () => {
  if (isElectronRuntime()) {
    console.log('[Filesystem Boot] Skipping Capacitor Filesystem warmup in Electron runtime');
    return;
  }

  try {
    console.log('[Filesystem Boot] Initializing Filesystem plugin...');

    // Force plugin registration by checking app directory
    await Filesystem.readdir({
      path: '.',
      directory: Directory.Cache,
    })
      .then(() => {
        console.log('[Filesystem Boot] Filesystem plugin initialized');
      })
      .catch((error) => {
        console.error('[Filesystem Boot] Warning: Filesystem initialization:', error);
      });
  } catch (error) {
    console.error('[Filesystem Boot] Warning: Filesystem initialization:', error);
    // Don't throw - plugin might still be available
  }
});
