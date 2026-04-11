import { defineBoot } from '#q-app/wrappers';
import { initializeDatabase } from 'src/services/database';
import { checkAndRecoverIfNeeded } from 'src/services/backup';

let initError: Error | null = null;

export default defineBoot(async (/* { app, router, ... } */) => {
  try {
    console.log('[SQLite Boot] Initializing SQLite database...');

    // Initialize the database with schema and migrations
    await initializeDatabase();

    const recovered = await checkAndRecoverIfNeeded();
    if (recovered) {
      console.warn('[SQLite Boot] Database recovered from backup after integrity check');
    }

    console.log('[SQLite Boot] SQLite database initialized successfully');
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    console.error('[SQLite Boot] Failed to initialize SQLite database:', error);
    throw new Error(
      `SQLite initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
});

/**
 * Get the initialization error if one occurred
 */
export function getInitError(): Error | null {
  return initError;
}
