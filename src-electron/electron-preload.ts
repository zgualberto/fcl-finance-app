/*
 * Preload script for Electron renderer isolation boundary.
 * Keep this bridge minimal and expose only explicit, safe APIs.
 */

import { contextBridge, ipcRenderer } from 'electron';

const electronSQLite = {
	init: (database: string) => ipcRenderer.invoke('sqlite:init', database) as Promise<{ ok: boolean }>,
	execute: (database: string, sql: string) =>
		ipcRenderer.invoke('sqlite:execute', { database, sql }) as Promise<{ changes?: { changes?: number } }>,
	query: (database: string, sql: string, params: unknown[] = []) =>
		ipcRenderer.invoke('sqlite:query', { database, sql, params }) as Promise<{
			values?: Array<Record<string, unknown>>;
		}>,
	run: (database: string, sql: string, params: unknown[] = []) =>
		ipcRenderer.invoke('sqlite:run', { database, sql, params }) as Promise<{
			changes?: { changes?: number; lastId?: number };
		}>,
	exportJson: (database: string) =>
		ipcRenderer.invoke('sqlite:export-json', database) as Promise<{ export?: unknown }>,
	importJson: (database: string, json: string) =>
		ipcRenderer.invoke('sqlite:import-json', { database, json }) as Promise<{ ok: boolean }>,
	reset: (database: string) => ipcRenderer.invoke('sqlite:reset', database) as Promise<{ ok: boolean }>,
	close: (database: string) => ipcRenderer.invoke('sqlite:close', database) as Promise<{ ok: boolean }>,
};

contextBridge.exposeInMainWorld('electronSQLite', electronSQLite);

export {};
