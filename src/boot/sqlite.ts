import { defineBoot } from '#q-app/wrappers';
import { Capacitor } from '@capacitor/core';
import { initializeDatabase } from 'src/services/database';
import { checkAndRecoverIfNeeded } from 'src/services/backup';

let initError: Error | null = null;

export default defineBoot(async (/* { app, router, ... } */) => {
  try {
    // Register the jeep-sqlite web component before touching the SQLite
    // plugin. No-op on native (Android/iOS) where the element is unused.
    if (!Capacitor.isNativePlatform()) {
      const { defineCustomElements: defineJeepSqliteElements } = await import('jeep-sqlite/loader');
      defineJeepSqliteElements(window);
    }

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
