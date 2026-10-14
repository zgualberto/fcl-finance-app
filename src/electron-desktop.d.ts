/**
 * Types for the desktop (Electron) preload bridge.
 *
 * `window.fclDesktop` is exposed by src-electron/electron-preload.ts and is
 * only present when the app runs as a desktop build. Everywhere else it is
 * undefined and callers fall back to the Capacitor/web behavior.
 */
export {};

declare global {
  interface FclDesktopApi {
    saveFile: (options: { defaultName: string; dataBase64: string }) => Promise<{
      canceled: boolean;
      filePath?: string;
    }>;
    showInFolder: (filePath: string) => Promise<void>;
  }

  interface Window {
    fclDesktop?: FclDesktopApi;
  }
}
