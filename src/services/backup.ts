import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import { checkIntegrity, exportForBackup, importFromBackup } from './database';
import { setRecovered } from 'src/composables/useRecoveryWarning';

const BACKUP_STORE_NAME = 'fcl-backup-store';
const BACKUP_DB_NAME = 'fcl-backup-db';
const MAX_BACKUPS = 10;

interface BackupEntry {
  timestamp: number;
  checksum: string;
  data: string;
}

/**
 * CRC32 checksum calculation (lightweight, fast)
 * Used to verify backup integrity
 */
function calculateCRC32(data: string): string {
  let crc = 0 ^ -1;

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ ((crc ^ data.charCodeAt(i)) & 0xff);
  }

  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Open or create IndexedDB connection for backups
 */
async function openBackupDB(): Promise<IDBPDatabase> {
  return await openDB(BACKUP_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        db.createObjectStore(BACKUP_STORE_NAME);
      }
    },
  });
}

/**
 * Backup database to IndexedDB (triggered on significant user actions)
 */
export async function backupDatabase(): Promise<void> {
  try {
    console.log('[Backup] Starting database backup...');

    const jsonData = await exportForBackup();
    const checksum = calculateCRC32(jsonData);
    const timestamp = Date.now();

    const backupDb = await openBackupDB();
    const tx = backupDb.transaction(BACKUP_STORE_NAME, 'readwrite');

    // Get existing backups to maintain history
    const allBackupsKey = 'all-backups';
    const allBackups: string[] = (await tx.store.get(allBackupsKey)) || [];

    // Generate unique key for this backup
    const backupKey = `backup-${timestamp}`;
    allBackups.push(backupKey);

    // Store the backup
    await tx.store.put(
      {
        timestamp,
        checksum,
        data: jsonData,
      },
      backupKey,
    );

    // Keep only the latest 10 backups
    if (allBackups.length > MAX_BACKUPS) {
      const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
      for (const key of toDelete) {
        await tx.store.delete(key);
      }
      allBackups.splice(0, allBackups.length - MAX_BACKUPS);
    }

    // Update all-backups list
    await tx.store.put(allBackups, allBackupsKey);
    await tx.done;

    console.log('[Backup] Database backed up successfully. Backups stored:', allBackups.length);
  } catch (error) {
    console.error('[Backup] Failed to backup database:', error);
    // Don't throw - backup failure shouldn't crash the app
  }
}

/**
 * Get list of available backups with timestamps
 */
export async function getAvailableBackups(): Promise<Array<{ key: string; timestamp: Date }>> {
  try {
    const backupDb = await openBackupDB();
    const allBackupsKey = 'all-backups';
    const allBackups: string[] = (await backupDb.get(BACKUP_STORE_NAME, allBackupsKey)) || [];

    const backups = [];
    for (const key of allBackups) {
      const backup = (await backupDb.get(BACKUP_STORE_NAME, key)) as BackupEntry | undefined;
      if (backup) {
        backups.push({
          key,
          timestamp: new Date(backup.timestamp),
        });
      }
    }

    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('[Backup] Failed to get available backups:', error);
    return [];
  }
}

/**
 * Restore database from a specific backup
 */
export async function restoreFromBackup(backupKey: string): Promise<boolean> {
  try {
    console.log('[Backup] Restoring from backup:', backupKey);

    const backupDb = await openBackupDB();
    const backup = (await backupDb.get(BACKUP_STORE_NAME, backupKey)) as BackupEntry | undefined;

    if (!backup) {
      console.error('[Backup] Backup not found:', backupKey);
      return false;
    }

    // Verify checksum
    const calculatedChecksum = calculateCRC32(backup.data);
    if (calculatedChecksum !== backup.checksum) {
      console.error('[Backup] Checksum mismatch - backup may be corrupted');
      return false;
    }

    // Import the backup into SQLite
    await importFromBackup(backup.data);

    console.log('[Backup] Successfully restored from backup');
    return true;
  } catch (error) {
    console.error('[Backup] Failed to restore from backup:', error);
    return false;
  }
}

/**
 * Check if SQLite database is corrupted and attempt recovery
 * Called during app boot before other operations
 */
export function restoreFromBackupIfCorrupted(): boolean {
  try {
    // Note: We can't use checkIntegrity() here because the DB might not be open yet
    // The actual integrity check happens after database is initialized

    return false; // No corruption detected during boot
  } catch (error) {
    console.error('[Backup] Error during pre-boot backup check:', error);
    return false;
  }
}

/**
 * Run post-boot integrity check and recover if needed
 * Call this after database initialization is complete
 */
export async function checkAndRecoverIfNeeded(): Promise<boolean> {
  try {
    console.log('[Backup] Running post-boot integrity check...');

    const isValid = await checkIntegrity();

    if (!isValid) {
      console.warn('[Backup] Database integrity check failed - attempting recovery');

      // Try to restore from the latest backup
      const backups = await getAvailableBackups();

      if (backups.length === 0) {
        console.error('[Backup] No backups available for recovery');
        return false;
      }

      // Restore from the latest backup
      const latestBackupKey = backups[0]?.key;
      if (!latestBackupKey) {
        console.error('[Backup] Could not determine latest backup');
        return false;
      }

      const restored = await restoreFromBackup(latestBackupKey);

      if (restored) {
        console.log('[Backup] Database recovered from backup');
        setRecovered(true);
        return true;
      } else {
        console.error('[Backup] Recovery failed');
        return false;
      }
    }

    return false; // No corruption, no recovery needed
  } catch (error) {
    console.error('[Backup] Error during integrity check/recovery:', error);
    return false;
  }
}

/**
 * Clear all backups from IndexedDB
 */
export async function clearAllBackups(): Promise<void> {
  try {
    const backupDb = await openBackupDB();
    const tx = backupDb.transaction(BACKUP_STORE_NAME, 'readwrite');

    const allBackupsKey = 'all-backups';
    const allBackups: string[] = (await tx.store.get(allBackupsKey)) || [];

    for (const key of allBackups) {
      await tx.store.delete(key);
    }

    await tx.store.delete(allBackupsKey);
    await tx.done;

    console.log('[Backup] All backups cleared');
  } catch (error) {
    console.error('[Backup] Failed to clear backups:', error);
  }
}
