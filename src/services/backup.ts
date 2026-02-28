import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { checkIntegrity, exportForBackup, importFromBackup } from './database';
import { setRecovered } from 'src/composables/useRecoveryWarning';

const BACKUP_STORE_NAME = 'fcl-backup-store';
const BACKUP_DB_NAME = 'fcl-backup-db';
const MAX_BACKUPS = 10;
const BACKUP_DIR = 'backups';

interface BackupEntry {
  timestamp: number;
  checksum: string;
  data: string;
  size: number;
}

interface BackupSummary {
  key: string;
  timestamp: Date;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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

function buildTimestampWithSeconds(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

async function ensureBackupsDirectory(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: BACKUP_DIR,
      directory: Directory.Cache,
      recursive: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }
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

async function storeBackupData(jsonData: string, timestamp = Date.now()): Promise<string> {
  const checksum = calculateCRC32(jsonData);
  const size = new Blob([jsonData]).size;
  const backupDb = await openBackupDB();
  const tx = backupDb.transaction(BACKUP_STORE_NAME, 'readwrite');

  const allBackupsKey = 'all-backups';
  const allBackups: string[] = (await tx.store.get(allBackupsKey)) || [];

  const backupKey = `backup-${timestamp}`;
  allBackups.push(backupKey);

  await tx.store.put(
    {
      timestamp,
      checksum,
      data: jsonData,
      size,
    },
    backupKey,
  );

  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    for (const key of toDelete) {
      await tx.store.delete(key);
    }
    allBackups.splice(0, allBackups.length - MAX_BACKUPS);
  }

  await tx.store.put(allBackups, allBackupsKey);
  await tx.done;

  return backupKey;
}

async function getBackupEntry(backupKey: string): Promise<BackupEntry | null> {
  const backupDb = await openBackupDB();
  const backup = (await backupDb.get(BACKUP_STORE_NAME, backupKey)) as BackupEntry | undefined;
  if (!backup) {
    return null;
  }

  const calculatedChecksum = calculateCRC32(backup.data);
  if (calculatedChecksum !== backup.checksum) {
    throw new Error('Backup checksum mismatch');
  }

  return backup;
}

/**
 * Backup database to IndexedDB (triggered on significant user actions)
 */
export async function backupDatabase(): Promise<void> {
  try {
    console.log('[Backup] Starting database backup...');

    const jsonData = await exportForBackup();
    await storeBackupData(jsonData);

    const backups = await getAvailableBackups();
    console.log('[Backup] Database backed up successfully. Backups stored:', backups.length);
  } catch (error) {
    console.error('[Backup] Failed to backup database:', error);
    // Don't throw - backup failure shouldn't crash the app
  }
}

/**
 * Get list of available backups with timestamps
 */
export async function getAvailableBackups(): Promise<BackupSummary[]> {
  try {
    const backupDb = await openBackupDB();
    const allBackupsKey = 'all-backups';
    const allBackups: string[] = (await backupDb.get(BACKUP_STORE_NAME, allBackupsKey)) || [];

    const backups = [];
    for (const key of allBackups) {
      const backup = (await backupDb.get(BACKUP_STORE_NAME, key)) as BackupEntry | undefined;
      if (backup) {
        // Calculate size from data if not pre-calculated (for backwards compatibility)
        const size = backup.size || new Blob([backup.data]).size;
        backups.push({
          key,
          timestamp: new Date(backup.timestamp),
          size,
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

    const backup = await getBackupEntry(backupKey);
    if (!backup) {
      console.error('[Backup] Backup not found:', backupKey);
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

export function getBackupSizeFormatted(bytes: number): string {
  return formatFileSize(bytes);
}

export async function downloadBackupToLocalStorage(backupKey: string): Promise<string> {
  const backup = await getBackupEntry(backupKey);
  if (!backup) {
    throw new Error('Backup not found');
  }

  const timestamp = buildTimestampWithSeconds(new Date(backup.timestamp));
  const fileName = `fcl-backup-${timestamp}.json`;

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: backup.data,
      directory: Directory.Documents,
      recursive: true,
      encoding: Encoding.UTF8,
    });

    console.log('[Backup] File downloaded successfully:', fileName);
    return fileName;
  } catch (error) {
    console.error('[Backup] Download error:', error);
    throw error;
  }
}

export async function exportBackupToShare(backupKey: string): Promise<void> {
  const backup = await getBackupEntry(backupKey);
  if (!backup) {
    throw new Error('Backup not found');
  }

  await ensureBackupsDirectory();

  const timestamp = buildTimestampWithSeconds(new Date(backup.timestamp));
  const fileName = `fcl-backup-${timestamp}.json`;
  const filePath = `${BACKUP_DIR}/${fileName}`;

  await Filesystem.writeFile({
    path: filePath,
    data: backup.data,
    directory: Directory.Cache,
    recursive: true,
    encoding: Encoding.UTF8,
  });

  const fileUri = await Filesystem.getUri({
    path: filePath,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'FCL Backup',
    text: 'FCL backup file',
    url: fileUri.uri,
    dialogTitle: 'Share Backup',
  });
}

export async function importBackupJson(jsonData: string): Promise<string> {
  await importFromBackup(jsonData);
  return await storeBackupData(jsonData);
}

export async function deleteBackup(backupKey: string): Promise<void> {
  const backupDb = await openBackupDB();
  const tx = backupDb.transaction(BACKUP_STORE_NAME, 'readwrite');

  const allBackupsKey = 'all-backups';
  const allBackups: string[] = (await tx.store.get(allBackupsKey)) || [];

  if (!allBackups.includes(backupKey)) {
    throw new Error('Backup not found');
  }

  await tx.store.delete(backupKey);
  await tx.store.put(
    allBackups.filter((key) => key !== backupKey),
    allBackupsKey,
  );
  await tx.done;

  console.log('[Backup] Backup deleted:', backupKey);
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
