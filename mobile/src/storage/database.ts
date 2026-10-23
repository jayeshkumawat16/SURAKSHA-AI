import * as SQLite from "expo-sqlite";

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Memory cache fallback for tests or when SQLite is unavailable in browser/Node
const memoryStore: Record<string, Record<string, any>> = {
  trusted_contacts: {},
  app_settings: {},
  saved_guides: {},
  checklist_items: {},
  cached_sos: {}
};

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await SQLite.openDatabaseAsync("suraksha.db");
    await initTables(dbInstance);
    return dbInstance;
  } catch (error) {
    console.warn("Could not open native SQLite database. Using safe memory fallback:", error);
    return null;
  }
}

async function initTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      relationship TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cached_sos (
      id TEXT PRIMARY KEY NOT NULL,
      message TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export { memoryStore };
