import { defineBoot } from '#q-app/wrappers';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isDesktop } from 'src/utils/desktop-files';

export default defineBoot(async () => {
  // Desktop uses the native file bridge (save dialog) instead of the
  // Capacitor Filesystem plugin; skip probing it there.
  if (isDesktop()) {
    console.log('[Filesystem Boot] Desktop mode detected, skipping Capacitor probe');
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
