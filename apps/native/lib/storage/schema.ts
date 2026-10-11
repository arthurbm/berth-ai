import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});

export const localModelsTable = sqliteTable("local_models", {
	artifactId: text("artifact_id"),
	bytesOnDisk: integer("bytes_on_disk").notNull(),
	downloadUrl: text("download_url"),
	errorMessage: text("error_message"),
	installedAt: text("installed_at"),
	lastUsedAt: text("last_used_at"),
	localPath: text("local_path"),
	modelId: text("model_id").primaryKey(),
	preparedAt: text("prepared_at"),
	progress: real("progress").notNull(),
	resumeData: text("resume_data"),
	runtimeStatus: text("runtime_status").notNull().default("unloaded"),
	status: text("status").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const conversationsTable = sqliteTable("conversations", {
	createdAt: text("created_at").notNull(),
	id: text("id").primaryKey(),
	modelId: text("model_id").notNull(),
	title: text("title").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const messagesTable = sqliteTable("messages", {
	content: text("content").notNull(),
	conversationId: text("conversation_id").notNull(),
	createdAt: text("created_at").notNull(),
	id: text("id").primaryKey(),
	role: text("role").notNull(),
	status: text("status").notNull(),
});

export const requestLogsTable = sqliteTable("request_logs", {
	clientAddress: text("client_address"),
	createdAt: text("created_at").notNull(),
	endpoint: text("endpoint").notNull(),
	errorMessage: text("error_message"),
	id: text("id").primaryKey(),
	latencyMs: integer("latency_ms").notNull(),
	method: text("method").notNull(),
	modelId: text("model_id"),
	responsePreview: text("response_preview"),
	source: text("source").notNull(),
	status: text("status").notNull(),
	statusCode: integer("status_code"),
	summary: text("summary").notNull(),
});

export const gambiDraftTable = sqliteTable("gambi_draft", {
	credential: text("credential").notNull(),
	id: integer("id").primaryKey(),
	modelId: text("model_id"),
	roomCode: text("room_code").notNull(),
	roomName: text("room_name").notNull(),
	visibility: text("visibility").notNull(),
});
