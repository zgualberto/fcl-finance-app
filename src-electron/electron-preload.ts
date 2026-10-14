/**
 * Preload bridge for the desktop (Electron) build.
 *
 * Exposes a minimal, purpose-built API to the renderer through
 * `window.fclDesktop`. Everything else stays behind context isolation.
 * Only 'electron' (the framework package) is imported here, so no extra
 * runtime dependency is introduced.
 */
import { contextBridge, ipcRenderer } from 'electron';

export interface DesktopSaveFileOptions {
  /** Suggested file name shown in the save dialog. */
  defaultName: string;
  /** File contents, base64-encoded (binary-safe for JSON, PDF, PNG). */
  dataBase64: string;
}

export interface DesktopSaveFileResult {
  canceled: boolean;
  filePath?: string;
}

contextBridge.exposeInMainWorld('fclDesktop', {
  saveFile: (options: DesktopSaveFileOptions): Promise<DesktopSaveFileResult> =>
    ipcRenderer.invoke('fcl:save-file', options),
  showInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fcl:show-in-folder', filePath),
});
