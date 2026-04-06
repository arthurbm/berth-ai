import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import {
	conversationsTable,
	gambiDraftTable,
	localModelsTable,
	messagesTable,
	requestLogsTable,
	settingsTable,
} from "@/lib/storage/schema";

export const expoDb = openDatabaseSync("berth-ai.db");
export const db = drizzle(expoDb, {
	schema: {
		conversationsTable,
		gambiDraftTable,
		localModelsTable,
		messagesTable,
		requestLogsTable,
		settingsTable,
	},
});
