import { expoDb } from "@/lib/storage/client";

async function ensureColumn(
	tableName: string,
	columnName: string,
	columnDefinition: string
) {
	const columns = await expoDb.getAllAsync<{ name: string }>(
		`PRAGMA table_info(${tableName});`
	);

	if (columns.some((column) => column.name === columnName)) {
		return;
	}

	await expoDb.execAsync(
		`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`
	);
}

export async function migrateDatabase() {
	await expoDb.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_models (
      model_id TEXT PRIMARY KEY NOT NULL,
      artifact_id TEXT,
      download_url TEXT,
      local_path TEXT,
      resume_data TEXT,
      status TEXT NOT NULL,
      runtime_status TEXT NOT NULL DEFAULT 'unloaded',
      progress REAL NOT NULL,
      bytes_on_disk INTEGER NOT NULL,
      installed_at TEXT,
      prepared_at TEXT,
      updated_at TEXT NOT NULL,
      last_used_at TEXT,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      model_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      status_code INTEGER,
      model_id TEXT,
      latency_ms INTEGER NOT NULL,
      source TEXT NOT NULL,
      client_address TEXT,
      created_at TEXT NOT NULL,
      summary TEXT NOT NULL,
      error_message TEXT,
      response_preview TEXT
    );

    CREATE TABLE IF NOT EXISTS gambi_draft (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      room_name TEXT NOT NULL,
      room_code TEXT NOT NULL,
      credential TEXT NOT NULL,
      model_id TEXT,
      visibility TEXT NOT NULL
    );
  `);

	await ensureColumn("local_models", "artifact_id", "TEXT");
	await ensureColumn("local_models", "download_url", "TEXT");
	await ensureColumn("local_models", "local_path", "TEXT");
	await ensureColumn("local_models", "resume_data", "TEXT");
	await ensureColumn(
		"local_models",
		"runtime_status",
		"TEXT NOT NULL DEFAULT 'unloaded'"
	);
	await ensureColumn("local_models", "prepared_at", "TEXT");
	await ensureColumn("request_logs", "status_code", "INTEGER");
	await ensureColumn("request_logs", "client_address", "TEXT");
}
