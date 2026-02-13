import { defineBoot } from '#q-app/wrappers';
import { Filesystem, Directory } from '@capacitor/filesystem';

export default defineBoot(async () => {
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
