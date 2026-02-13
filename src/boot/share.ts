import { defineBoot } from '#q-app/wrappers';
import { Share } from '@capacitor/share';

export default defineBoot(async () => {
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
