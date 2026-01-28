import { defineBoot } from '#q-app/wrappers';
import { initializeDatabase } from 'src/services/database';
import { restoreFromBackupIfCorrupted } from 'src/services/backup';

let initError: Error | null = null;

export default defineBoot(async (/* { app, router, ... } */) => {
  try {
    console.log('[SQLite Boot] Initializing SQLite database...');

    // Check if database needs recovery from backup
    const recovered = restoreFromBackupIfCorrupted();
    if (recovered) {
      console.log('[SQLite Boot] Database marked for recovery check');
    }

    // Initialize the database with schema and migrations
    await initializeDatabase();

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
