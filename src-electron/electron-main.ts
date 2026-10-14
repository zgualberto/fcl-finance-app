import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'node:fs';
import { fileURLToPath } from 'url';

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
    await mainWindow.loadFile('index.html');
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

void app.whenReady().then(createWindow);

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
