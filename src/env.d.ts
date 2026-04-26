declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

interface ElectronSQLiteBridge {
  init: (database: string) => Promise<{ ok: boolean }>;
  execute: (database: string, sql: string) => Promise<{ changes?: { changes?: number } }>;
  query: (
    database: string,
    sql: string,
    params?: unknown[],
  ) => Promise<{ values?: Array<Record<string, unknown>> }>;
  run: (
    database: string,
    sql: string,
    params?: unknown[],
  ) => Promise<{ changes?: { changes?: number; lastId?: number } }>;
  exportJson: (database: string) => Promise<{ export?: unknown }>;
  importJson: (database: string, json: string) => Promise<{ ok: boolean }>;
  reset: (database: string) => Promise<{ ok: boolean }>;
  close: (database: string) => Promise<{ ok: boolean }>;
}

interface Window {
  electronSQLite?: ElectronSQLiteBridge;
}
