import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Needed in case process is undefined under Linux.
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;

type SqliteElectronPlugin = {
  createConnection: (options: {
    database: string;
    version: number;
    encrypted: boolean;
    mode: string;
    readonly: boolean;
  }) => Promise<void>;
  open: (options: { database: string; readonly: boolean }) => Promise<void>;
  close: (options: { database: string; readonly: boolean }) => Promise<void>;
  closeConnection: (options: { database: string; readonly: boolean }) => Promise<void>;
  deleteDatabase: (options: { database: string; readonly: boolean }) => Promise<void>;
  execute: (options: {
    database: string;
    statements: string;
    transaction: boolean;
    readonly: boolean;
    isSQL92: boolean;
  }) => Promise<{ changes?: { changes?: number } }>;
  query: (options: {
    database: string;
    statement: string;
    values: unknown[];
    readonly: boolean;
    isSQL92: boolean;
  }) => Promise<{ values?: Array<Record<string, unknown>> }>;
  run: (options: {
    database: string;
    statement: string;
    values: unknown[];
    transaction: boolean;
    readonly: boolean;
    returnMode: string;
    isSQL92: boolean;
  }) => Promise<{ changes?: { changes?: number; lastId?: number } }>;
  exportToJson: (options: {
    database: string;
    jsonexportmode: string;
    readonly: boolean;
    encrypted: boolean;
  }) => Promise<{ export?: unknown }>;
  importFromJson: (options: { jsonstring: string }) => Promise<{ changes?: { changes?: number } }>;
};

let sqlitePluginPromise: Promise<SqliteElectronPlugin> | null = null;

async function getSqlitePlugin(): Promise<SqliteElectronPlugin> {
  if (!sqlitePluginPromise) {
    sqlitePluginPromise = (async () => {
      const module = (await import('@capacitor-community/sqlite/electron/dist/plugin.js')) as {
        default?: { CapacitorSQLite?: new () => SqliteElectronPlugin };
        CapacitorSQLite?: new () => SqliteElectronPlugin;
      };

      const SqliteClass = module.default?.CapacitorSQLite ?? module.CapacitorSQLite;
      if (!SqliteClass) {
        throw new Error('Failed to load Capacitor SQLite Electron plugin');
      }

      return new SqliteClass();
    })();
  }

  return sqlitePluginPromise;
}

async function ensureConnection(database: string): Promise<SqliteElectronPlugin> {
  const plugin = await getSqlitePlugin();

  try {
    await plugin.createConnection({
      database,
      version: 1,
      encrypted: false,
      mode: 'no-encryption',
      readonly: false,
    });
  } catch (error) {
    const message = String(error).toLowerCase();
    if (!message.includes('already')) {
      throw error;
    }
  }

  await plugin.open({ database, readonly: false });
  return plugin;
}

async function resetDatabase(database: string): Promise<void> {
  const plugin = await getSqlitePlugin();

  try {
    await ensureConnection(database);
  } catch {
    // Ignore init/open failures; reset still attempts best-effort cleanup.
  }

  try {
    await plugin.deleteDatabase({ database, readonly: false });
  } finally {
    try {
      await plugin.closeConnection({ database, readonly: false });
    } catch {
      // Ignore close failures during reset cleanup.
    }
  }
}

function registerSqliteIpcHandlers(): void {
  ipcMain.handle('sqlite:init', async (_event, database: string) => {
    await ensureConnection(database);
    return { ok: true };
  });

  ipcMain.handle('sqlite:execute', async (_event, payload: { database: string; sql: string }) => {
    const plugin = await ensureConnection(payload.database);
    return await plugin.execute({
      database: payload.database,
      statements: payload.sql,
      transaction: true,
      readonly: false,
      isSQL92: true,
    });
  });

  ipcMain.handle(
    'sqlite:query',
    async (
      _event,
      payload: { database: string; sql: string; params?: unknown[] },
    ): Promise<{ values?: Array<Record<string, unknown>> }> => {
      const plugin = await ensureConnection(payload.database);
      return await plugin.query({
        database: payload.database,
        statement: payload.sql,
        values: payload.params ?? [],
        readonly: false,
        isSQL92: true,
      });
    },
  );

  ipcMain.handle(
    'sqlite:run',
    async (
      _event,
      payload: { database: string; sql: string; params?: unknown[] },
    ): Promise<{ changes?: { changes?: number; lastId?: number } }> => {
      const plugin = await ensureConnection(payload.database);
      return await plugin.run({
        database: payload.database,
        statement: payload.sql,
        values: payload.params ?? [],
        transaction: true,
        readonly: false,
        returnMode: 'no',
        isSQL92: true,
      });
    },
  );

  ipcMain.handle('sqlite:export-json', async (_event, database: string) => {
    const plugin = await ensureConnection(database);
    return await plugin.exportToJson({
      database,
      jsonexportmode: 'full',
      readonly: false,
      encrypted: false,
    });
  });

  ipcMain.handle('sqlite:import-json', async (_event, payload: { database: string; json: string }) => {
    const plugin = await getSqlitePlugin();
    await plugin.importFromJson({ jsonstring: payload.json });
    await ensureConnection(payload.database);
    return { ok: true };
  });

  ipcMain.handle('sqlite:reset', async (_event, database: string) => {
    await resetDatabase(database);
    return { ok: true };
  });

  ipcMain.handle('sqlite:close', async (_event, database: string) => {
    const plugin = await getSqlitePlugin();

    try {
      await plugin.close({ database, readonly: false });
    } catch {
      // Ignore if database is already closed.
    }

    try {
      await plugin.closeConnection({ database, readonly: false });
    } catch {
      // Ignore if connection is already removed.
    }

    return { ok: true };
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          `electron-preload${process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION}`,
        ),
      ),
    },
  });

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(createWindow);
registerSqliteIpcHandlers();

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});
