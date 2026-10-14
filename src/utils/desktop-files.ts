/**
 * Renderer-side wrapper around the desktop (Electron) preload bridge.
 *
 * Feature-detects `window.fclDesktop` so this module is safe to import on
 * every platform (Android/Capacitor, browser, desktop). Desktop-only
 * behavior branches on {@link isDesktop}; all other platforms keep their
 * existing Capacitor/web code paths untouched.
 */

export interface DesktopSaveResult {
  canceled: boolean;
  filePath?: string;
}

/** True when running inside the Electron desktop shell with the bridge. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && typeof window.fclDesktop?.saveFile === 'function';
}

/** Encode a UTF-8 string (e.g. backup JSON) for the base64-based bridge. */
export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Open a native save dialog and write the file. Returns the saved path.
 * Throws when the bridge is missing or the user cancels the dialog.
 */
export async function saveFileDesktop(defaultName: string, dataBase64: string): Promise<string> {
  if (!window.fclDesktop) {
    throw new Error('Desktop file bridge is unavailable');
  }
  const result = await window.fclDesktop.saveFile({ defaultName, dataBase64 });
  if (result.canceled || !result.filePath) {
    throw new Error('Save dialog canceled');
  }
  return result.filePath;
}

/** Reveal a saved file in the OS file manager. No-op off desktop. */
export async function showInFolderDesktop(filePath: string): Promise<void> {
  await window.fclDesktop?.showInFolder(filePath);
}
