import { useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";
import { setStringAsync } from "expo-clipboard";
import { getIpAddressAsync } from "expo-network";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import {
	createContext,
	type PropsWithChildren,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	INITIAL_PROVIDER_PORT,
	MODEL_CATALOG,
} from "@/lib/constants/model-catalog";
import { APP_SNAPSHOT_QUERY_KEY } from "@/lib/query/query-client";
import { db } from "@/lib/storage/client";
import { migrateDatabase } from "@/lib/storage/database";
import {
	conversationsTable,
	gambiDraftTable,
	localModelsTable,
	messagesTable,
	requestLogsTable,
	settingsTable,
} from "@/lib/storage/schema";
import { getConversationTitle, truncateText } from "@/lib/utils/format";
import { createId } from "@/lib/utils/id";
import type {
	AppSnapshot,
	Conversation,
	ConversationMessage,
	GambiDraftConfig,
	LocalModelRecord,
	MessageRole,
	MessageStatus,
	ModelDownloadState,
	ProviderRuntimeInfo,
	ProviderSettings,
	ProviderTestResult,
	RequestLogStatus,
	SendMessageInput,
} from "@/types/app-state";

const SETTINGS_KEYS = {
	activeModelId: "active_model_id",
	currentConversationId: "current_conversation_id",
	providerEnabled: "provider_enabled",
	providerExposureMode: "provider_exposure_mode",
	providerPort: "provider_port",
	providerAuthRequired: "provider_auth_required",
	providerTransportMode: "provider_transport_mode",
} as const;

const PROVIDER_TOKEN_KEY = "provider_token";

const DEFAULT_GAMBI_DRAFT: GambiDraftConfig = {
	roomName: "",
	roomCode: "",
	credential: "",
	modelId: null,
	visibility: "private",
};

interface AppDataContextValue {
	activeConversation: Conversation | null;
	activeConversationMessages: ConversationMessage[];
	cancelDownload: (modelId: string) => Promise<void>;
	clearConversation: (conversationId: string) => Promise<void>;
	copyToClipboard: (value: string) => Promise<void>;
	createConversation: () => Promise<string | null>;
	hydrateError: string | null;
	installedStorageBytes: number;
	pauseDownload: (modelId: string) => Promise<void>;
	regenerateProviderToken: () => Promise<void>;
	removeModel: (modelId: string) => Promise<void>;
	resetActivity: () => Promise<void>;
	runProviderTest: () => Promise<ProviderTestResult>;
	saveGambiDraft: (draft: GambiDraftConfig) => Promise<void>;
	selectConversation: (conversationId: string) => Promise<void>;
	sendMessage: (input: SendMessageInput) => Promise<void>;
	setActiveModel: (modelId: string) => Promise<void>;
	setProviderEnabled: (enabled: boolean) => Promise<void>;
	snapshot: AppSnapshot;
	startDownload: (modelId: string) => Promise<void>;
	stopGeneration: (conversationId: string) => Promise<void>;
}

export const AppDataContext = createContext<AppDataContextValue | undefined>(
	undefined
);

type DownloadTimerMap = Map<string, ReturnType<typeof setInterval>>;

interface GenerationSession {
	messageId: string;
	requestId: string;
	startedAt: number;
	timerId: ReturnType<typeof setInterval>;
}

const runInBackground = (task: Promise<unknown>) => {
	task.catch(() => undefined);
};

const buildProviderRuntime = (
	host: string,
	providerSettings: ProviderSettings,
	capabilities: ProviderRuntimeInfo["capabilities"]
): ProviderRuntimeInfo => ({
	baseUrl: `http://${host}:${providerSettings.port}/v1`,
	host,
	transportLabel:
		providerSettings.transportMode === "native"
			? "HTTP local nativo"
			: "Adapter Open Responses simulado",
	transportReady: providerSettings.transportMode === "native",
	capabilities,
});

const createToken = () => {
	const segments = [Math.random(), Math.random(), Math.random()].map((value) =>
		value.toString(36).slice(2, 10)
	);

	return `berth_${segments.join("")}`;
};

const createInitialSnapshot = (): AppSnapshot => ({
	catalog: MODEL_CATALOG,
	localModels: [],
	activeModelId: null,
	conversations: [],
	messages: [],
	currentConversationId: null,
	providerSettings: {
		enabled: false,
		authRequired: true,
		exposureMode: "lan",
		port: INITIAL_PROVIDER_PORT,
		transportMode: "simulated",
	},
	providerToken: "",
	endpointStatus: "offline",
	providerRuntime: buildProviderRuntime(
		"127.0.0.1",
		{
			enabled: false,
			authRequired: true,
			exposureMode: "lan",
			port: INITIAL_PROVIDER_PORT,
			transportMode: "simulated",
		},
		[]
	),
	requestLogs: [],
	gambiDraft: DEFAULT_GAMBI_DRAFT,
	isHydrated: false,
});

async function getSetting(key: string) {
	const row = await db.query.settingsTable.findFirst({
		where: eq(settingsTable.key, key),
	});

	return row?.value ?? null;
}

async function setSetting(key: string, value: string) {
	await db
		.insert(settingsTable)
		.values({ key, value })
		.onConflictDoUpdate({ target: settingsTable.key, set: { value } });
}

async function deleteSetting(key: string) {
	await db.delete(settingsTable).where(eq(settingsTable.key, key));
}

async function loadProviderSettings(): Promise<ProviderSettings> {
	const [enabled, exposureMode, port, authRequired, transportMode] =
		await Promise.all([
			getSetting(SETTINGS_KEYS.providerEnabled),
			getSetting(SETTINGS_KEYS.providerExposureMode),
			getSetting(SETTINGS_KEYS.providerPort),
			getSetting(SETTINGS_KEYS.providerAuthRequired),
			getSetting(SETTINGS_KEYS.providerTransportMode),
		]);

	return {
		enabled: enabled === "true",
		exposureMode:
			exposureMode === "external_experimental"
				? "external_experimental"
				: "lan",
		port: Number(port ?? INITIAL_PROVIDER_PORT),
		authRequired: authRequired !== "false",
		transportMode: transportMode === "native" ? "native" : "simulated",
	};
}

async function getProviderToken() {
	const existing = await getItemAsync(PROVIDER_TOKEN_KEY);

	if (existing) {
		return existing;
	}

	const nextToken = createToken();
	await setItemAsync(PROVIDER_TOKEN_KEY, nextToken);

	return nextToken;
}

async function updateProviderToken() {
	const nextToken = createToken();
	await setItemAsync(PROVIDER_TOKEN_KEY, nextToken);

	return nextToken;
}

async function resolveHost(currentHost: string) {
	try {
		return (await getIpAddressAsync()) || currentHost;
	} catch {
		return currentHost;
	}
}

async function loadSnapshot(): Promise<AppSnapshot> {
	const [
		localModels,
		conversations,
		messages,
		requestLogs,
		gambiDraft,
		activeModelId,
		currentConversationId,
	] = await Promise.all([
		db
			.select()
			.from(localModelsTable)
			.orderBy(desc(localModelsTable.updatedAt)),
		db
			.select()
			.from(conversationsTable)
			.orderBy(desc(conversationsTable.updatedAt)),
		db.select().from(messagesTable).orderBy(messagesTable.createdAt),
		db
			.select()
			.from(requestLogsTable)
			.orderBy(desc(requestLogsTable.createdAt))
			.limit(50),
		db.query.gambiDraftTable.findFirst({ where: eq(gambiDraftTable.id, 1) }),
		getSetting(SETTINGS_KEYS.activeModelId),
		getSetting(SETTINGS_KEYS.currentConversationId),
	]);

	const typedLocalModels: LocalModelRecord[] = localModels.map((model) => ({
		...model,
		status: model.status as ModelDownloadState,
	}));
	const typedMessages: ConversationMessage[] = messages.map((message) => ({
		...message,
		role: message.role as MessageRole,
		status: message.status as MessageStatus,
	}));
	const typedRequestLogs: AppSnapshot["requestLogs"] = requestLogs.map(
		(log) => ({
			...log,
			status: log.status as RequestLogStatus,
		})
	);
	const typedGambiDraft: GambiDraftConfig = gambiDraft
		? {
				roomName: gambiDraft.roomName,
				roomCode: gambiDraft.roomCode,
				credential: gambiDraft.credential,
				modelId: gambiDraft.modelId,
				visibility: gambiDraft.visibility as GambiDraftConfig["visibility"],
			}
		: DEFAULT_GAMBI_DRAFT;

	const normalizedLocalModels = typedLocalModels.map((model) =>
		model.status === "downloading" || model.status === "queued"
			? { ...model, status: "paused" as const }
			: model
	);

	await Promise.all(
		normalizedLocalModels
			.filter((model) => model.status === "paused")
			.map((model) =>
				db
					.update(localModelsTable)
					.set({ status: "paused", updatedAt: new Date().toISOString() })
					.where(eq(localModelsTable.modelId, model.modelId))
			)
	);

	const providerSettings = await loadProviderSettings();
	const providerToken = await getProviderToken();
	const activeModel =
		normalizedLocalModels.find(
			(item) => item.modelId === activeModelId && item.status === "ready"
		) ?? null;
	const activeModelCapabilities =
		MODEL_CATALOG.find(
			(model) => model.id === activeModel?.modelId
		)?.capabilities.filter((capability) => capability !== "embeddings") ?? [];
	const host = await resolveHost("127.0.0.1");

	return {
		catalog: MODEL_CATALOG,
		localModels: normalizedLocalModels,
		activeModelId: activeModel?.modelId ?? null,
		conversations,
		messages: typedMessages,
		currentConversationId,
		providerSettings,
		providerToken,
		endpointStatus: providerSettings.enabled ? "online" : "offline",
		providerRuntime: buildProviderRuntime(
			host,
			providerSettings,
			activeModelCapabilities
		),
		requestLogs: typedRequestLogs,
		gambiDraft: typedGambiDraft,
		isHydrated: true,
	};
}

function createStreamingResponse(prompt: string, modelName: string) {
	const compactPrompt = truncateText(prompt.trim(), 120);

	return [
		`${modelName} recebeu: "${compactPrompt}".`,
		"Esta build já compartilha o mesmo adapter entre chat e provider, então o fluxo aqui representa a resposta canônica orientada a Responses.",
		"O próximo passo técnico é substituir o transport simulado pelo servidor HTTP local nativo, sem mexer na UI nem nos contratos internos.",
	].join(" ");
}

export function AppDataProvider({ children }: PropsWithChildren) {
	const [snapshot, setSnapshot] = useState<AppSnapshot>(createInitialSnapshot);
	const queryClient = useQueryClient();
	const downloadTimersRef = useRef<DownloadTimerMap>(new Map());
	const generationSessionsRef = useRef<Map<string, GenerationSession>>(
		new Map()
	);
	const snapshotQuery = useQuery({
		queryKey: APP_SNAPSHOT_QUERY_KEY,
		queryFn: async () => {
			await migrateDatabase();
			return loadSnapshot();
		},
	});

	useEffect(() => {
		return () => {
			for (const timerId of downloadTimersRef.current.values()) {
				clearInterval(timerId);
			}

			for (const session of generationSessionsRef.current.values()) {
				clearInterval(session.timerId);
			}
		};
	}, []);

	useEffect(() => {
		if (snapshotQuery.data) {
			setSnapshot(snapshotQuery.data);
		}
	}, [snapshotQuery.data]);

	useEffect(() => {
		if (snapshot.isHydrated) {
			queryClient.setQueryData(APP_SNAPSHOT_QUERY_KEY, snapshot);
		}
	}, [queryClient, snapshot]);

	const refreshRuntime = async (draft: AppSnapshot): Promise<AppSnapshot> => {
		const host = await resolveHost(draft.providerRuntime.host);
		const activeModelCapabilities =
			draft.catalog
				.find((model) => model.id === draft.activeModelId)
				?.capabilities.filter((capability) => capability !== "embeddings") ??
			[];

		return {
			...draft,
			providerRuntime: buildProviderRuntime(
				host,
				draft.providerSettings,
				activeModelCapabilities
			),
			endpointStatus: draft.providerSettings.enabled ? "online" : "offline",
		};
	};

	const persistLocalModel = async (record: LocalModelRecord) => {
		await db
			.insert(localModelsTable)
			.values(record)
			.onConflictDoUpdate({
				target: localModelsTable.modelId,
				set: {
					status: record.status,
					progress: record.progress,
					bytesOnDisk: record.bytesOnDisk,
					installedAt: record.installedAt,
					updatedAt: record.updatedAt,
					lastUsedAt: record.lastUsedAt,
					errorMessage: record.errorMessage,
				},
			});
	};

	const persistConversation = async (conversation: Conversation) => {
		await db
			.insert(conversationsTable)
			.values(conversation)
			.onConflictDoUpdate({
				target: conversationsTable.id,
				set: {
					title: conversation.title,
					modelId: conversation.modelId,
					updatedAt: conversation.updatedAt,
				},
			});
	};

	const persistMessage = async (message: ConversationMessage) => {
		await db
			.insert(messagesTable)
			.values(message)
			.onConflictDoUpdate({
				target: messagesTable.id,
				set: {
					content: message.content,
					status: message.status,
				},
			});
	};

	const appendRequestLog = async (log: AppSnapshot["requestLogs"][number]) => {
		await db.insert(requestLogsTable).values(log);
		setSnapshot((current) => ({
			...current,
			requestLogs: [log, ...current.requestLogs].slice(0, 50),
		}));
	};

	const startDownload = async (modelId: string) => {
		const catalogEntry = snapshot.catalog.find((item) => item.id === modelId);

		if (!catalogEntry) {
			return;
		}

		const currentRecord = snapshot.localModels.find(
			(record) => record.modelId === modelId
		) ?? {
			modelId,
			status: "queued" as const,
			progress: 0,
			bytesOnDisk: 0,
			installedAt: null,
			updatedAt: new Date().toISOString(),
			lastUsedAt: null,
			errorMessage: null,
		};

		const queuedRecord: LocalModelRecord = {
			...currentRecord,
			status: "downloading",
			updatedAt: new Date().toISOString(),
			errorMessage: null,
		};

		await persistLocalModel(queuedRecord);
		setSnapshot((current) => ({
			...current,
			localModels: [
				queuedRecord,
				...current.localModels.filter((record) => record.modelId !== modelId),
			],
		}));

		const existingTimer = downloadTimersRef.current.get(modelId);

		if (existingTimer) {
			clearInterval(existingTimer);
		}

		const timerId = setInterval(() => {
			setSnapshot((current) => {
				const existing = current.localModels.find(
					(record) => record.modelId === modelId
				);

				if (!existing || existing.status !== "downloading") {
					return current;
				}

				const nextProgress = Math.min(1, existing.progress + 0.08);
				const nextStatus = nextProgress >= 1 ? "ready" : "downloading";
				const nextRecord: LocalModelRecord = {
					...existing,
					status: nextStatus,
					progress: nextProgress,
					bytesOnDisk: Math.round(catalogEntry.approxBytes * nextProgress),
					installedAt:
						nextStatus === "ready"
							? new Date().toISOString()
							: existing.installedAt,
					updatedAt: new Date().toISOString(),
					errorMessage: null,
				};

				runInBackground(persistLocalModel(nextRecord));

				if (nextStatus === "ready") {
					clearInterval(timerId);
					downloadTimersRef.current.delete(modelId);
				}

				return {
					...current,
					localModels: current.localModels.map((record) =>
						record.modelId === modelId ? nextRecord : record
					),
				};
			});
		}, 550);

		downloadTimersRef.current.set(modelId, timerId);
	};

	const pauseDownload = async (modelId: string) => {
		const timerId = downloadTimersRef.current.get(modelId);

		if (timerId) {
			clearInterval(timerId);
			downloadTimersRef.current.delete(modelId);
		}

		const record = snapshot.localModels.find(
			(item) => item.modelId === modelId
		);

		if (!record) {
			return;
		}

		const nextRecord: LocalModelRecord = {
			...record,
			status: "paused",
			updatedAt: new Date().toISOString(),
		};

		await persistLocalModel(nextRecord);
		setSnapshot((current) => ({
			...current,
			localModels: current.localModels.map((item) =>
				item.modelId === modelId ? nextRecord : item
			),
		}));
	};

	const cancelDownload = async (modelId: string) => {
		const timerId = downloadTimersRef.current.get(modelId);

		if (timerId) {
			clearInterval(timerId);
			downloadTimersRef.current.delete(modelId);
		}

		await db
			.delete(localModelsTable)
			.where(eq(localModelsTable.modelId, modelId));

		if (snapshot.activeModelId === modelId) {
			await deleteSetting(SETTINGS_KEYS.activeModelId);
		}

		setSnapshot((current) => ({
			...current,
			activeModelId:
				current.activeModelId === modelId ? null : current.activeModelId,
			localModels: current.localModels.filter(
				(item) => item.modelId !== modelId
			),
		}));
	};

	const removeModel = async (modelId: string) => {
		await cancelDownload(modelId);
	};

	const setActiveModel = async (modelId: string) => {
		const readyRecord = snapshot.localModels.find(
			(item) =>
				item.modelId === modelId &&
				(item.status === "ready" || item.status === "in_use")
		);

		if (!readyRecord) {
			return;
		}

		const nextUpdatedAt = new Date().toISOString();
		const nextLocalModels = snapshot.localModels.map((record) => {
			if (record.modelId === modelId) {
				const nextRecord: LocalModelRecord = {
					...record,
					status: "in_use",
					lastUsedAt: nextUpdatedAt,
					updatedAt: nextUpdatedAt,
				};

				runInBackground(persistLocalModel(nextRecord));

				return nextRecord;
			}

			if (record.status === "in_use") {
				const nextRecord: LocalModelRecord = {
					...record,
					status: "ready",
					updatedAt: nextUpdatedAt,
				};

				runInBackground(persistLocalModel(nextRecord));

				return nextRecord;
			}

			return record;
		});

		await setSetting(SETTINGS_KEYS.activeModelId, modelId);
		const nextSnapshot = await refreshRuntime({
			...snapshot,
			activeModelId: modelId,
			localModels: nextLocalModels,
		});
		setSnapshot(nextSnapshot);
	};

	const createConversation = async () => {
		const modelId = snapshot.activeModelId;

		if (!modelId) {
			return null;
		}

		const now = new Date().toISOString();
		const conversation: Conversation = {
			id: createId("conv"),
			title: "Nova conversa",
			modelId,
			createdAt: now,
			updatedAt: now,
		};

		await persistConversation(conversation);
		await setSetting(SETTINGS_KEYS.currentConversationId, conversation.id);
		setSnapshot((current) => ({
			...current,
			currentConversationId: conversation.id,
			conversations: [conversation, ...current.conversations],
		}));

		return conversation.id;
	};

	const selectConversation = async (conversationId: string) => {
		await setSetting(SETTINGS_KEYS.currentConversationId, conversationId);
		setSnapshot((current) => ({
			...current,
			currentConversationId: conversationId,
		}));
	};

	const clearConversation = async (conversationId: string) => {
		await db
			.delete(messagesTable)
			.where(eq(messagesTable.conversationId, conversationId));

		const currentConversation = snapshot.conversations.find(
			(conversation) => conversation.id === conversationId
		);

		if (!currentConversation) {
			return;
		}

		const nextConversation = {
			...currentConversation,
			title: "Nova conversa",
			updatedAt: new Date().toISOString(),
		};

		await persistConversation(nextConversation);

		setSnapshot((current) => ({
			...current,
			conversations: current.conversations.map((conversation) =>
				conversation.id === conversationId ? nextConversation : conversation
			),
			messages: current.messages.filter(
				(message) => message.conversationId !== conversationId
			),
		}));
	};

	const stopGeneration = async (conversationId: string) => {
		const session = generationSessionsRef.current.get(conversationId);

		if (!session) {
			return;
		}

		clearInterval(session.timerId);
		generationSessionsRef.current.delete(conversationId);

		await Promise.all([
			db
				.update(messagesTable)
				.set({ status: "aborted" })
				.where(eq(messagesTable.id, session.messageId)),
			db
				.update(requestLogsTable)
				.set({
					status: "cancelled",
					errorMessage: "Geração interrompida manualmente.",
					latencyMs: Date.now() - session.startedAt,
				})
				.where(eq(requestLogsTable.id, session.requestId)),
		]);

		setSnapshot((current) => ({
			...current,
			messages: current.messages.map((message) =>
				message.id === session.messageId
					? { ...message, status: "aborted" }
					: message
			),
			requestLogs: current.requestLogs.map((log) =>
				log.id === session.requestId
					? {
							...log,
							status: "cancelled",
							errorMessage: "Geração interrompida manualmente.",
							latencyMs: Date.now() - session.startedAt,
						}
					: log
			),
		}));
	};

	const sendMessage = async ({ conversationId, prompt }: SendMessageInput) => {
		const activeModelId = snapshot.activeModelId;

		if (!activeModelId) {
			await appendRequestLog({
				id: createId("req"),
				endpoint: "/internal/generate",
				method: "POST",
				status: "error",
				modelId: null,
				latencyMs: 0,
				source: "app-chat",
				createdAt: new Date().toISOString(),
				summary: "Tentativa de gerar sem modelo ativo.",
				errorMessage: "Selecione um modelo pronto antes de conversar.",
				responsePreview: null,
			});

			return;
		}

		const conversation =
			snapshot.conversations.find((item) => item.id === conversationId) ??
			(await (async () => {
				const createdId = await createConversation();

				return (
					snapshot.conversations.find((item) => item.id === createdId) ?? null
				);
			})());

		if (!conversation) {
			return;
		}

		const userMessage: ConversationMessage = {
			id: createId("msg"),
			conversationId,
			role: "user",
			content: prompt.trim(),
			status: "complete",
			createdAt: new Date().toISOString(),
		};
		const assistantMessage: ConversationMessage = {
			id: createId("msg"),
			conversationId,
			role: "assistant",
			content: "",
			status: "streaming",
			createdAt: new Date().toISOString(),
		};
		const nextConversation: Conversation = {
			...conversation,
			title:
				snapshot.messages.filter(
					(message) => message.conversationId === conversationId
				).length === 0
					? getConversationTitle(prompt)
					: conversation.title,
			updatedAt: new Date().toISOString(),
			modelId: activeModelId,
		};

		await Promise.all([
			persistConversation(nextConversation),
			persistMessage(userMessage),
			persistMessage(assistantMessage),
			setSetting(SETTINGS_KEYS.currentConversationId, conversationId),
		]);

		const modelName =
			snapshot.catalog.find((model) => model.id === activeModelId)
				?.displayName ?? "Modelo local";
		const response = createStreamingResponse(prompt, modelName);
		const chunks = response
			.match(/.{1,36}(\s|$)/g)
			?.map((chunk) => chunk.trimStart()) ?? [response];
		const requestId = createId("req");

		setSnapshot((current) => ({
			...current,
			currentConversationId: conversationId,
			conversations: [
				nextConversation,
				...current.conversations.filter((item) => item.id !== conversationId),
			],
			messages: [...current.messages, userMessage, assistantMessage],
		}));

		let currentContent = "";
		let chunkIndex = 0;
		const startedAt = Date.now();

		const timerId = setInterval(() => {
			if (chunkIndex >= chunks.length) {
				clearInterval(timerId);
				generationSessionsRef.current.delete(conversationId);

				const completedLog = {
					id: requestId,
					endpoint: "/internal/generate",
					method: "POST",
					status: "success" as const,
					modelId: activeModelId,
					latencyMs: Date.now() - startedAt,
					source: "app-chat",
					createdAt: new Date().toISOString(),
					summary: `Resposta local concluída em ${modelName}.`,
					errorMessage: null,
					responsePreview: truncateText(currentContent.trim(), 140),
				};

				runInBackground(
					Promise.all([
						db
							.update(messagesTable)
							.set({ status: "complete" })
							.where(eq(messagesTable.id, assistantMessage.id)),
						appendRequestLog(completedLog),
					])
				);

				setSnapshot((current) => ({
					...current,
					messages: current.messages.map((message) =>
						message.id === assistantMessage.id
							? { ...message, status: "complete" }
							: message
					),
				}));

				return;
			}

			currentContent += `${chunks[chunkIndex]} `;
			chunkIndex += 1;
			const nextContent = currentContent.trimEnd();

			setSnapshot((current) => ({
				...current,
				messages: current.messages.map((message) =>
					message.id === assistantMessage.id
						? { ...message, content: nextContent }
						: message
				),
			}));
			runInBackground(
				db
					.update(messagesTable)
					.set({ content: nextContent })
					.where(eq(messagesTable.id, assistantMessage.id))
			);
		}, 180);

		generationSessionsRef.current.set(conversationId, {
			timerId,
			messageId: assistantMessage.id,
			requestId,
			startedAt,
		});
	};

	const setProviderEnabled = async (enabled: boolean) => {
		await setSetting(SETTINGS_KEYS.providerEnabled, String(enabled));
		const nextSnapshot = await refreshRuntime({
			...snapshot,
			providerSettings: {
				...snapshot.providerSettings,
				enabled,
			},
		});
		setSnapshot(nextSnapshot);
	};

	const regenerateProviderToken = async () => {
		const nextToken = await updateProviderToken();
		setSnapshot((current) => ({ ...current, providerToken: nextToken }));
	};

	const runProviderTest = async (): Promise<ProviderTestResult> => {
		const activeModel = snapshot.catalog.find(
			(model) => model.id === snapshot.activeModelId
		);

		if (!snapshot.providerSettings.enabled) {
			const result = {
				ok: false,
				endpoint: `${snapshot.providerRuntime.baseUrl}/responses`,
				summary: "Provider desligado.",
				responsePreview: null,
				errorMessage: "Ative a exposição antes de testar o endpoint.",
			};

			await appendRequestLog({
				id: createId("req"),
				endpoint: "/v1/responses",
				method: "POST",
				status: "error",
				modelId: snapshot.activeModelId,
				latencyMs: 0,
				source: "app-api-test",
				createdAt: new Date().toISOString(),
				summary: result.summary,
				errorMessage: result.errorMessage,
				responsePreview: null,
			});

			return result;
		}

		if (!activeModel) {
			const result = {
				ok: false,
				endpoint: `${snapshot.providerRuntime.baseUrl}/responses`,
				summary: "Sem modelo ativo.",
				responsePreview: null,
				errorMessage: "Escolha um modelo pronto para testar o provider.",
			};

			await appendRequestLog({
				id: createId("req"),
				endpoint: "/v1/responses",
				method: "POST",
				status: "error",
				modelId: null,
				latencyMs: 0,
				source: "app-api-test",
				createdAt: new Date().toISOString(),
				summary: result.summary,
				errorMessage: result.errorMessage,
				responsePreview: null,
			});

			return result;
		}

		const responsePreview = truncateText(
			createStreamingResponse(
				"Faça um healthcheck do provider local.",
				activeModel.displayName
			),
			160
		);
		const result = {
			ok: true,
			endpoint: `${snapshot.providerRuntime.baseUrl}/responses`,
			summary: `Contrato Open Responses validado com ${activeModel.displayName}.`,
			responsePreview,
			errorMessage: snapshot.providerRuntime.transportReady
				? null
				: "Teste executado no adapter interno; o transporte HTTP externo ainda está em modo simulado nesta build.",
		};

		await appendRequestLog({
			id: createId("req"),
			endpoint: "/v1/responses",
			method: "POST",
			status: "success",
			modelId: activeModel.id,
			latencyMs: 180,
			source: "app-api-test",
			createdAt: new Date().toISOString(),
			summary: result.summary,
			errorMessage: result.errorMessage,
			responsePreview,
		});

		return result;
	};

	const copyToClipboard = async (value: string) => {
		await setStringAsync(value);
	};

	const saveGambiDraft = async (draft: GambiDraftConfig) => {
		await db
			.insert(gambiDraftTable)
			.values({ id: 1, ...draft })
			.onConflictDoUpdate({
				target: gambiDraftTable.id,
				set: {
					roomName: draft.roomName,
					roomCode: draft.roomCode,
					credential: draft.credential,
					modelId: draft.modelId,
					visibility: draft.visibility,
				},
			});

		setSnapshot((current) => ({ ...current, gambiDraft: draft }));
	};

	const resetActivity = async () => {
		await db.delete(requestLogsTable);
		setSnapshot((current) => ({ ...current, requestLogs: [] }));
	};

	const installedStorageBytes = useMemo(
		() =>
			snapshot.localModels.reduce((total, item) => total + item.bytesOnDisk, 0),
		[snapshot.localModels]
	);

	const activeConversation = useMemo(
		() =>
			snapshot.conversations.find(
				(conversation) => conversation.id === snapshot.currentConversationId
			) ?? null,
		[snapshot.conversations, snapshot.currentConversationId]
	);

	const activeConversationMessages = useMemo(
		() =>
			activeConversation
				? snapshot.messages.filter(
						(message) => message.conversationId === activeConversation.id
					)
				: [],
		[activeConversation, snapshot.messages]
	);

	const value = {
		snapshot,
		installedStorageBytes,
		activeConversation,
		activeConversationMessages,
		hydrateError:
			snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null,
		startDownload,
		pauseDownload,
		cancelDownload,
		removeModel,
		setActiveModel,
		createConversation,
		selectConversation,
		clearConversation,
		sendMessage,
		stopGeneration,
		setProviderEnabled,
		regenerateProviderToken,
		runProviderTest,
		copyToClipboard,
		saveGambiDraft,
		resetActivity,
	} satisfies AppDataContextValue;

	return (
		<AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
	);
}
