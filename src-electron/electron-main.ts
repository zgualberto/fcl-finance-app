import { app, BrowserWindow, dialog, ipcMain, Menu, protocol, shell } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'node:fs';
import { fileURLToPath } from 'url';

// Custom scheme serving the packaged renderer (app.asar) over `app://`.
// Unlike file://, it supports the Fetch API, which the SQLite WASM loader
// (jeep-sqlite) requires. Dev mode keeps using the http dev server.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const APP_SCHEME_HOST = 'local';

const mimeByExtension: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.cjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function resolvePackagedFile(requestUrl: string): string | null {
  const root = path.join(process.resourcesPath, 'app.asar');
  const pathname = decodeURIComponent(new URL(requestUrl).pathname);
  const relative = path.normalize(pathname).replace(/^[/\\]+/, '');
  const filePath = path.join(root, relative === '' ? 'index.html' : relative);
  // Block path traversal outside the packaged app.
  if (path.relative(root, filePath).startsWith('..')) {
    return null;
  }
  return filePath;
}

function registerAppProtocol(): void {
  protocol.handle('app', async (request) => {
    try {
      const filePath = resolvePackagedFile(request.url);
      if (!filePath) {
        return new Response('Forbidden', { status: 403 });
      }
      const data = await fs.promises.readFile(filePath);
      const extension = path.extname(filePath).toLowerCase();
      return new Response(new Uint8Array(data), {
        headers: { 'content-type': mimeByExtension[extension] ?? 'application/octet-stream' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

interface SaveFileRequest {
  defaultName?: string;
  dataBase64?: string;
}

// Registered once at module level (createWindow can run multiple times,
// e.g. on macOS activate, and ipcMain.handle rejects duplicate channels).
ipcMain.handle('fcl:save-file', async (event, request: SaveFileRequest) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  const dialogOptions = { defaultPath: request?.defaultName ?? 'fcl-backup.json' };
  const { canceled, filePath } = senderWindow
    ? await dialog.showSaveDialog(senderWindow, dialogOptions)
    : await dialog.showSaveDialog(dialogOptions);
  if (canceled || !filePath) {
    return { canceled: true };
  }
  await fs.promises.writeFile(filePath, Buffer.from(request?.dataBase64 ?? '', 'base64'));
  return { canceled: false, filePath };
});

ipcMain.handle('fcl:show-in-folder', (_event, filePath: unknown) => {
  if (typeof filePath === 'string' && filePath.length > 0) {
    shell.showItemInFolder(filePath);
  }
});

let mainWindow: BrowserWindow | undefined;

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1280,
    height: 720,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  });

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadURL(`app://${APP_SCHEME_HOST}/index.html`);
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(async () => {
  // No menu bar in dev or packaged builds (also clears the macOS app menu).
  Menu.setApplicationMenu(null);
  if (!process.env.DEV) {
    registerAppProtocol();
  }
  await createWindow();
});

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
