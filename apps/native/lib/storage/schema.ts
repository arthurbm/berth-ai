import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});

export const localModelsTable = sqliteTable("local_models", {
	modelId: text("model_id").primaryKey(),
	artifactId: text("artifact_id"),
	downloadUrl: text("download_url"),
	localPath: text("local_path"),
	resumeData: text("resume_data"),
	status: text("status").notNull(),
	runtimeStatus: text("runtime_status").notNull().default("unloaded"),
	progress: real("progress").notNull(),
	bytesOnDisk: integer("bytes_on_disk").notNull(),
	installedAt: text("installed_at"),
	preparedAt: text("prepared_at"),
	updatedAt: text("updated_at").notNull(),
	lastUsedAt: text("last_used_at"),
	errorMessage: text("error_message"),
});

export const conversationsTable = sqliteTable("conversations", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	modelId: text("model_id").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const messagesTable = sqliteTable("messages", {
	id: text("id").primaryKey(),
	conversationId: text("conversation_id").notNull(),
	role: text("role").notNull(),
	content: text("content").notNull(),
	status: text("status").notNull(),
	createdAt: text("created_at").notNull(),
});

export const requestLogsTable = sqliteTable("request_logs", {
	id: text("id").primaryKey(),
	endpoint: text("endpoint").notNull(),
	method: text("method").notNull(),
	status: text("status").notNull(),
	statusCode: integer("status_code"),
	modelId: text("model_id"),
	latencyMs: integer("latency_ms").notNull(),
	source: text("source").notNull(),
	clientAddress: text("client_address"),
	createdAt: text("created_at").notNull(),
	summary: text("summary").notNull(),
	errorMessage: text("error_message"),
	responsePreview: text("response_preview"),
});

export const gambiDraftTable = sqliteTable("gambi_draft", {
	id: integer("id").primaryKey(),
	roomName: text("room_name").notNull(),
	roomCode: text("room_code").notNull(),
	credential: text("credential").notNull(),
	modelId: text("model_id"),
	visibility: text("visibility").notNull(),
});
