import { useQuery } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";
import { setStringAsync } from "expo-clipboard";
import { getIpAddressAsync } from "expo-network";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import {
	createContext,
	type PropsWithChildren,
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

import {
	INITIAL_PROVIDER_PORT,
	MODEL_CATALOG,
} from "@/lib/constants/model-catalog";
import { nativeInferenceRuntime } from "@/lib/inference/native-runtime";
import { handleProviderRequest } from "@/lib/provider/request-handler";
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
import {
	getProviderServerModule,
	type ProviderServerIncomingRequest,
} from "@/modules/provider-server";
import type {
	AppSnapshot,
	Conversation,
	ConversationMessage,
	GambiDraftConfig,
	LocalModelRecord,
	MessageRole,
	MessageStatus,
	ModelCatalogEntry,
	ModelDownloadState,
	ProviderRequestLog,
	ProviderRuntimeInfo,
	ProviderSettings,
	ProviderTestResult,
	RequestLogStatus,
	RuntimeStatus,
	SendMessageInput,
} from "@/types/app-state";

const SETTINGS_KEYS = {
	activeModelId: "active_model_id",
	currentConversationId: "current_conversation_id",
	providerAuthRequired: "provider_auth_required",
	providerEnabled: "provider_enabled",
	providerExposureMode: "provider_exposure_mode",
	providerPort: "provider_port",
	providerTransportMode: "provider_transport_mode",
} as const;

const PROVIDER_TOKEN_KEY = "provider_token";
const PROVIDER_MODULE = getProviderServerModule();
const PROVIDER_SUPPORTED = Platform.OS === "android";
const V1_PATH_SUFFIX_REGEX = /\/v1$/;

const DEFAULT_GAMBI_DRAFT: GambiDraftConfig = {
	credential: "",
	modelId: null,
	roomCode: "",
	roomName: "",
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

interface GenerationSession {
	messageId: string;
	requestId: string;
	startedAt: number;
}

const runInBackground = (task: Promise<unknown>) => {
	task.catch(() => undefined);
};

const buildProviderRuntime = (
	host: string,
	providerSettings: ProviderSettings,
	capabilities: ProviderRuntimeInfo["capabilities"],
	overrides?: Partial<ProviderRuntimeInfo>
): ProviderRuntimeInfo => {
	const platformSupport = PROVIDER_SUPPORTED ? "full" : "experimental";

	return {
		baseUrl: `http://${host}:${providerSettings.port}/v1`,
		capabilities,
		host,
		lastError: null,
		lastStartedAt: null,
		platformSupport,
		transportLabel: PROVIDER_SUPPORTED
			? "HTTP local nativo"
			: "Provider HTTP experimental nesta plataforma",
		transportReady:
			PROVIDER_SUPPORTED && providerSettings.transportMode === "native",
		...overrides,
	};
};

const createToken = () => {
	const segments = [Math.random(), Math.random(), Math.random()].map((value) =>
		value.toString(36).slice(2, 10)
	);

	return `berth_${segments.join("")}`;
};

const createInitialSnapshot = (): AppSnapshot => ({
	activeModelId: null,
	catalog: MODEL_CATALOG,
	conversations: [],
	currentConversationId: null,
	endpointStatus: "offline",
	gambiDraft: DEFAULT_GAMBI_DRAFT,
	isHydrated: false,
	localModels: [],
	messages: [],
	providerRuntime: buildProviderRuntime(
		"127.0.0.1",
		{
			authRequired: true,
			enabled: false,
			exposureMode: "lan",
			port: INITIAL_PROVIDER_PORT,
			transportMode: "native",
		},
		[]
	),
	providerSettings: {
		authRequired: true,
		enabled: false,
		exposureMode: "lan",
		port: INITIAL_PROVIDER_PORT,
		transportMode: "native",
	},
	providerToken: "",
	requestLogs: [],
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
	const [enabled, exposureMode, port, authRequired] = await Promise.all([
		getSetting(SETTINGS_KEYS.providerEnabled),
		getSetting(SETTINGS_KEYS.providerExposureMode),
		getSetting(SETTINGS_KEYS.providerPort),
		getSetting(SETTINGS_KEYS.providerAuthRequired),
	]);

	return {
		authRequired: authRequired !== "false",
		enabled: enabled === "true",
		exposureMode:
			exposureMode === "external_experimental"
				? "external_experimental"
				: "lan",
		port: Number(port ?? INITIAL_PROVIDER_PORT),
		transportMode: "native",
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

function castLocalModel(model: Record<string, unknown>): LocalModelRecord {
	return {
		artifactId: (model.artifactId as string | null) ?? null,
		bytesOnDisk: Number(model.bytesOnDisk ?? 0),
		downloadUrl: (model.downloadUrl as string | null) ?? null,
		errorMessage: (model.errorMessage as string | null) ?? null,
		installedAt: (model.installedAt as string | null) ?? null,
		lastUsedAt: (model.lastUsedAt as string | null) ?? null,
		localPath: (model.localPath as string | null) ?? null,
		modelId: String(model.modelId),
		preparedAt: (model.preparedAt as string | null) ?? null,
		progress: Number(model.progress ?? 0),
		resumeData: (model.resumeData as string | null) ?? null,
		runtimeStatus: ((model.runtimeStatus as RuntimeStatus | null) ??
			"unloaded") as RuntimeStatus,
		status: model.status as ModelDownloadState,
		updatedAt: String(model.updatedAt),
	};
}

function castMessage(message: Record<string, unknown>): ConversationMessage {
	return {
		content: String(message.content),
		conversationId: String(message.conversationId),
		createdAt: String(message.createdAt),
		id: String(message.id),
		role: message.role as MessageRole,
		status: message.status as MessageStatus,
	};
}

function castRequestLog(log: Record<string, unknown>): ProviderRequestLog {
	return {
		clientAddress: (log.clientAddress as string | null) ?? null,
		createdAt: String(log.createdAt),
		endpoint: String(log.endpoint),
		errorMessage: (log.errorMessage as string | null) ?? null,
		id: String(log.id),
		latencyMs: Number(log.latencyMs ?? 0),
		method: String(log.method),
		modelId: (log.modelId as string | null) ?? null,
		responsePreview: (log.responsePreview as string | null) ?? null,
		source: String(log.source),
		status: log.status as RequestLogStatus,
		statusCode: (log.statusCode as number | null) ?? null,
		summary: String(log.summary),
	};
}

async function synchronizeLocalModel(
	record: LocalModelRecord
): Promise<LocalModelRecord> {
	const catalogEntry = MODEL_CATALOG.find(
		(model) => model.id === record.modelId
	);

	if (!catalogEntry) {
		return record;
	}

	const installed =
		await nativeInferenceRuntime.getInstalledModelState(catalogEntry);

	if (
		!installed.exists &&
		(record.status === "ready" || record.status === "in_use")
	) {
		return {
			...record,
			bytesOnDisk: 0,
			errorMessage: "Arquivo do modelo não encontrado no armazenamento local.",
			localPath: null,
			runtimeStatus: "error" as const,
			status: "error" as const,
		};
	}

	if (!installed.exists) {
		return record;
	}

	return {
		...record,
		artifactId: record.artifactId ?? catalogEntry.artifactId,
		bytesOnDisk: installed.bytesOnDisk,
		downloadUrl: record.downloadUrl ?? catalogEntry.downloadUrl,
		localPath: installed.localPath,
	};
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

	const synchronizedLocalModels = await Promise.all(
		localModels.map((model) => synchronizeLocalModel(castLocalModel(model)))
	);
	const typedMessages = messages.map((message) => castMessage(message));
	const typedRequestLogs = requestLogs.map((log) => castRequestLog(log));
	const typedGambiDraft: GambiDraftConfig = gambiDraft
		? {
				credential: gambiDraft.credential,
				modelId: gambiDraft.modelId,
				roomCode: gambiDraft.roomCode,
				roomName: gambiDraft.roomName,
				visibility: gambiDraft.visibility as GambiDraftConfig["visibility"],
			}
		: DEFAULT_GAMBI_DRAFT;
	const providerSettings = await loadProviderSettings();
	const providerToken = await getProviderToken();
	const activeModel =
		synchronizedLocalModels.find(
			(item) =>
				item.modelId === activeModelId &&
				(item.status === "ready" || item.status === "in_use")
		) ?? null;
	const activeModelCapabilities =
		MODEL_CATALOG.find(
			(model) => model.id === activeModel?.modelId
		)?.capabilities.filter((capability) => capability !== "embeddings") ?? [];
	const host = await resolveHost("127.0.0.1");

	return {
		activeModelId: activeModel?.modelId ?? null,
		catalog: MODEL_CATALOG,
		conversations,
		currentConversationId,
		endpointStatus: "offline",
		gambiDraft: typedGambiDraft,
		isHydrated: true,
		localModels: synchronizedLocalModels,
		messages: typedMessages,
		providerRuntime: buildProviderRuntime(
			host,
			providerSettings,
			activeModelCapabilities
		),
		providerSettings,
		providerToken,
		requestLogs: typedRequestLogs,
	};
}

export function AppDataProvider({ children }: PropsWithChildren) {
	const [snapshot, setSnapshot] = useState<AppSnapshot>(createInitialSnapshot);
	const snapshotRef = useRef(snapshot);
	const generationSessionsRef = useRef<Map<string, GenerationSession>>(
		new Map()
	);
	const abortedGenerationsRef = useRef<Set<string>>(new Set());
	const appStateRef = useRef<AppStateStatus>(AppState.currentState);
	const snapshotQuery = useQuery({
		queryKey: APP_SNAPSHOT_QUERY_KEY,
		queryFn: async () => {
			await migrateDatabase();
			await nativeInferenceRuntime.ensureModelsDirectory();
			return loadSnapshot();
		},
	});

	useEffect(() => {
		snapshotRef.current = snapshot;
	}, [snapshot]);

	useEffect(() => {
		if (snapshotQuery.data && !snapshotRef.current.isHydrated) {
			setSnapshot(snapshotQuery.data);
		}
	}, [snapshotQuery.data]);

	const refreshRuntime = useEffectEvent(
		async (
			draft: AppSnapshot,
			overrides?: Partial<ProviderRuntimeInfo>
		): Promise<AppSnapshot> => {
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
					activeModelCapabilities,
					overrides
				),
			};
		}
	);

	const persistLocalModel = async (record: LocalModelRecord) => {
		await db
			.insert(localModelsTable)
			.values(record)
			.onConflictDoUpdate({
				target: localModelsTable.modelId,
				set: {
					artifactId: record.artifactId,
					bytesOnDisk: record.bytesOnDisk,
					downloadUrl: record.downloadUrl,
					errorMessage: record.errorMessage,
					installedAt: record.installedAt,
					lastUsedAt: record.lastUsedAt,
					localPath: record.localPath,
					preparedAt: record.preparedAt,
					progress: record.progress,
					resumeData: record.resumeData,
					runtimeStatus: record.runtimeStatus,
					status: record.status,
					updatedAt: record.updatedAt,
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
					modelId: conversation.modelId,
					title: conversation.title,
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

	const appendRequestLog = async (log: ProviderRequestLog) => {
		await db.insert(requestLogsTable).values(log);
		setSnapshot((current) => ({
			...current,
			requestLogs: [log, ...current.requestLogs].slice(0, 50),
		}));
	};

	const updateLocalModelRuntimeStatus = async (
		modelId: string,
		runtimeStatus: RuntimeStatus,
		errorMessage: string | null = null
	) => {
		const currentRecord = snapshotRef.current.localModels.find(
			(item) => item.modelId === modelId
		);

		if (!currentRecord) {
			return;
		}

		const nextRecord: LocalModelRecord = {
			...currentRecord,
			errorMessage,
			preparedAt:
				runtimeStatus === "ready"
					? new Date().toISOString()
					: currentRecord.preparedAt,
			runtimeStatus,
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

	const startProviderServer = useEffectEvent(async () => {
		const current = snapshotRef.current;

		if (!(current.isHydrated && current.providerSettings.enabled)) {
			return;
		}

		if (!PROVIDER_SUPPORTED) {
			const nextSnapshot = await refreshRuntime(current, {
				lastError:
					"Provider HTTP real ainda não está habilitado nesta plataforma.",
				platformSupport: "experimental",
				transportReady: false,
			});
			setSnapshot({ ...nextSnapshot, endpointStatus: "error" });
			return;
		}

		setSnapshot((value) => ({ ...value, endpointStatus: "starting" }));

		try {
			const result = await PROVIDER_MODULE.start(current.providerSettings.port);
			const nextSnapshot = await refreshRuntime(current, {
				lastError:
					result.status === "online" ? null : "Falha ao subir o provider.",
				lastStartedAt: new Date().toISOString(),
				transportReady: result.status === "online",
			});

			setSnapshot({
				...nextSnapshot,
				endpointStatus: result.status === "online" ? "online" : "error",
			});
		} catch (error) {
			const nextSnapshot = await refreshRuntime(current, {
				lastError:
					error instanceof Error
						? error.message
						: "Falha ao iniciar o provider.",
				transportReady: false,
			});
			setSnapshot({ ...nextSnapshot, endpointStatus: "error" });
		}
	});

	const stopProviderServer = useEffectEvent(async () => {
		try {
			await PROVIDER_MODULE.stop();
		} finally {
			setSnapshot((current) => ({ ...current, endpointStatus: "offline" }));
		}
	});

	const handleProviderHttpRequest = useEffectEvent(
		(requestEvent: ProviderServerIncomingRequest) =>
			handleProviderRequest({
				appendRequestLog,
				request: requestEvent,
				serverModule: PROVIDER_MODULE,
				snapshot: snapshotRef.current,
			})
	);

	useEffect(() => {
		const subscription = PROVIDER_MODULE.addListener("onRequest", (event) => {
			runInBackground(handleProviderHttpRequest(event));
		});

		return () => {
			subscription.remove();
		};
	}, []);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextState) => {
			const previousState = appStateRef.current;
			appStateRef.current = nextState;

			if (
				(previousState === "active" || previousState === "inactive") &&
				nextState === "background"
			) {
				runInBackground(stopProviderServer());
				return;
			}

			if (
				nextState === "active" &&
				snapshotRef.current.providerSettings.enabled &&
				PROVIDER_SUPPORTED
			) {
				runInBackground(startProviderServer());
			}
		});

		return () => {
			subscription.remove();
		};
	}, []);

	const createLocalModelRecord = (
		entry: ModelCatalogEntry,
		status: ModelDownloadState,
		existing?: Partial<LocalModelRecord>
	): LocalModelRecord => ({
		artifactId: entry.artifactId,
		bytesOnDisk: existing?.bytesOnDisk ?? 0,
		downloadUrl: entry.downloadUrl,
		errorMessage: existing?.errorMessage ?? null,
		installedAt: existing?.installedAt ?? null,
		lastUsedAt: existing?.lastUsedAt ?? null,
		localPath: existing?.localPath ?? null,
		modelId: entry.id,
		preparedAt: existing?.preparedAt ?? null,
		progress: existing?.progress ?? 0,
		resumeData: existing?.resumeData ?? null,
		runtimeStatus: existing?.runtimeStatus ?? "unloaded",
		status,
		updatedAt: new Date().toISOString(),
	});

	const startDownload = async (modelId: string) => {
		const entry = snapshotRef.current.catalog.find(
			(item) => item.id === modelId
		);

		if (!entry || entry.capabilities.includes("embeddings")) {
			return;
		}

		const existing = snapshotRef.current.localModels.find(
			(item) => item.modelId === modelId
		);
		const queuedRecord = createLocalModelRecord(entry, "downloading", existing);

		await persistLocalModel(queuedRecord);
		setSnapshot((current) => ({
			...current,
			localModels: [
				queuedRecord,
				...current.localModels.filter((item) => item.modelId !== modelId),
			],
		}));

		runInBackground(
			nativeInferenceRuntime.startDownload(entry, queuedRecord, {
				onComplete: async ({ bytesOnDisk, localPath, resumeData }) => {
					const nextRecord: LocalModelRecord = {
						...queuedRecord,
						bytesOnDisk,
						errorMessage: null,
						installedAt: new Date().toISOString(),
						localPath,
						progress: 1,
						resumeData,
						runtimeStatus: "unloaded",
						status: "ready",
						updatedAt: new Date().toISOString(),
					};

					await persistLocalModel(nextRecord);
					setSnapshot((current) => ({
						...current,
						localModels: current.localModels.map((item) =>
							item.modelId === modelId ? nextRecord : item
						),
					}));
				},
				onError: async (errorMessage) => {
					const nextRecord: LocalModelRecord = {
						...queuedRecord,
						errorMessage,
						runtimeStatus: "error",
						status: "error",
						updatedAt: new Date().toISOString(),
					};

					await persistLocalModel(nextRecord);
					setSnapshot((current) => ({
						...current,
						localModels: current.localModels.map((item) =>
							item.modelId === modelId ? nextRecord : item
						),
					}));
				},
				onProgress: async ({ bytesOnDisk, progress }) => {
					const currentRecord =
						snapshotRef.current.localModels.find(
							(item) => item.modelId === modelId
						) ?? queuedRecord;
					const nextRecord: LocalModelRecord = {
						...currentRecord,
						bytesOnDisk,
						progress,
						status: "downloading",
						updatedAt: new Date().toISOString(),
					};

					await persistLocalModel(nextRecord);
					setSnapshot((current) => ({
						...current,
						localModels: current.localModels.map((item) =>
							item.modelId === modelId ? nextRecord : item
						),
					}));
				},
			})
		);
	};

	const pauseDownload = async (modelId: string) => {
		const record = snapshotRef.current.localModels.find(
			(item) => item.modelId === modelId
		);

		if (!record) {
			return;
		}

		const resumeData = await nativeInferenceRuntime.pauseDownload(modelId);
		const nextRecord: LocalModelRecord = {
			...record,
			resumeData,
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
		const entry = snapshotRef.current.catalog.find(
			(item) => item.id === modelId
		);

		if (!entry) {
			return;
		}

		await nativeInferenceRuntime.cancelDownload(entry);
		await db
			.delete(localModelsTable)
			.where(eq(localModelsTable.modelId, modelId));

		if (snapshotRef.current.activeModelId === modelId) {
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
		const entry = snapshotRef.current.catalog.find(
			(item) => item.id === modelId
		);

		if (!entry) {
			return;
		}

		await nativeInferenceRuntime.removeModel(entry);
		await cancelDownload(modelId);
	};

	const setActiveModel = async (modelId: string) => {
		const current = snapshotRef.current;
		const entry = current.catalog.find((item) => item.id === modelId);
		const record = current.localModels.find(
			(item) =>
				item.modelId === modelId &&
				(item.status === "ready" || item.status === "in_use")
		);

		if (!(entry && record)) {
			return;
		}

		const nextUpdatedAt = new Date().toISOString();
		const nextLocalModels = current.localModels.map((item) => {
			if (item.modelId === modelId) {
				return {
					...item,
					errorMessage: null,
					lastUsedAt: nextUpdatedAt,
					runtimeStatus: "preparing" as const,
					status: "in_use" as const,
					updatedAt: nextUpdatedAt,
				};
			}

			if (item.status === "in_use") {
				return {
					...item,
					runtimeStatus: "unloaded" as const,
					status: "ready" as const,
					updatedAt: nextUpdatedAt,
				};
			}

			return item;
		});

		await Promise.all([
			setSetting(SETTINGS_KEYS.activeModelId, modelId),
			...nextLocalModels.map((item) => persistLocalModel(item)),
		]);
		setSnapshot((value) => ({
			...value,
			activeModelId: modelId,
			localModels: nextLocalModels,
		}));

		try {
			await nativeInferenceRuntime.prepareModel(entry);
			await updateLocalModelRuntimeStatus(modelId, "ready");
			const nextSnapshot = await refreshRuntime({
				...snapshotRef.current,
				activeModelId: modelId,
				localModels: nextLocalModels.map((item) =>
					item.modelId === modelId
						? {
								...item,
								preparedAt: new Date().toISOString(),
								runtimeStatus: "ready",
							}
						: item
				),
			});
			setSnapshot(nextSnapshot);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Falha ao preparar o modelo.";
			await updateLocalModelRuntimeStatus(modelId, "error", message);
		}
	};

	const createConversation = async () => {
		const modelId = snapshotRef.current.activeModelId;

		if (!modelId) {
			return null;
		}

		const now = new Date().toISOString();
		const conversation: Conversation = {
			createdAt: now,
			id: createId("conv"),
			modelId,
			title: "Nova conversa",
			updatedAt: now,
		};

		await persistConversation(conversation);
		await setSetting(SETTINGS_KEYS.currentConversationId, conversation.id);
		setSnapshot((current) => ({
			...current,
			conversations: [conversation, ...current.conversations],
			currentConversationId: conversation.id,
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

		const currentConversation = snapshotRef.current.conversations.find(
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

		abortedGenerationsRef.current.add(conversationId);
		await nativeInferenceRuntime.stopGeneration(conversationId);

		await Promise.all([
			db
				.update(messagesTable)
				.set({ status: "aborted" })
				.where(eq(messagesTable.id, session.messageId)),
			db
				.update(requestLogsTable)
				.set({
					errorMessage: "Geração interrompida manualmente.",
					latencyMs: Date.now() - session.startedAt,
					status: "cancelled",
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
							errorMessage: "Geração interrompida manualmente.",
							latencyMs: Date.now() - session.startedAt,
							status: "cancelled",
						}
					: log
			),
		}));
	};

	const sendMessage = async ({ conversationId, prompt }: SendMessageInput) => {
		const current = snapshotRef.current;
		const activeModelId = current.activeModelId;
		const activeModel = current.catalog.find(
			(model) => model.id === activeModelId
		);

		if (!(activeModelId && activeModel)) {
			await appendRequestLog({
				clientAddress: null,
				createdAt: new Date().toISOString(),
				endpoint: "/internal/generate",
				errorMessage: "Selecione um modelo pronto antes de conversar.",
				id: createId("req"),
				latencyMs: 0,
				method: "POST",
				modelId: null,
				responsePreview: null,
				source: "app-chat",
				status: "error",
				statusCode: null,
				summary: "Tentativa de gerar sem modelo ativo.",
			});
			return;
		}

		const conversation =
			current.conversations.find((item) => item.id === conversationId) ?? null;

		if (!conversation) {
			return;
		}

		const now = new Date().toISOString();
		const userMessage: ConversationMessage = {
			content: prompt.trim(),
			conversationId,
			createdAt: now,
			id: createId("msg"),
			role: "user",
			status: "complete",
		};
		const assistantMessage: ConversationMessage = {
			content: "",
			conversationId,
			createdAt: now,
			id: createId("msg"),
			role: "assistant",
			status: "streaming",
		};
		const nextConversation: Conversation = {
			...conversation,
			modelId: activeModelId,
			title:
				current.messages.filter(
					(message) => message.conversationId === conversationId
				).length === 0
					? getConversationTitle(prompt)
					: conversation.title,
			updatedAt: now,
		};

		await Promise.all([
			persistConversation(nextConversation),
			persistMessage(userMessage),
			persistMessage(assistantMessage),
			setSetting(SETTINGS_KEYS.currentConversationId, conversationId),
		]);

		const requestId = createId("req");
		generationSessionsRef.current.set(conversationId, {
			messageId: assistantMessage.id,
			requestId,
			startedAt: Date.now(),
		});

		setSnapshot((value) => ({
			...value,
			conversations: [
				nextConversation,
				...value.conversations.filter((item) => item.id !== conversationId),
			],
			currentConversationId: conversationId,
			messages: [...value.messages, userMessage, assistantMessage],
		}));

		const history = [
			...current.messages.filter(
				(message) => message.conversationId === conversationId
			),
			userMessage,
		];

		try {
			const generation = await nativeInferenceRuntime.generate(
				{
					conversationMessages: history,
					generationKey: conversationId,
					model: activeModel,
					prompt: prompt.trim(),
				},
				{
					onDelta: (delta) => {
						setSnapshot((value) => {
							const currentMessage = value.messages.find(
								(message) => message.id === assistantMessage.id
							);
							const nextContent = `${currentMessage?.content ?? ""}${delta}`;

							runInBackground(
								db
									.update(messagesTable)
									.set({ content: nextContent })
									.where(eq(messagesTable.id, assistantMessage.id))
							);

							return {
								...value,
								messages: value.messages.map((message) =>
									message.id === assistantMessage.id
										? { ...message, content: nextContent }
										: message
								),
							};
						});
					},
					onRuntimeStatusChange: async (runtimeStatus) => {
						await updateLocalModelRuntimeStatus(activeModelId, runtimeStatus);
					},
				}
			);

			const wasAborted = abortedGenerationsRef.current.has(conversationId);
			abortedGenerationsRef.current.delete(conversationId);
			generationSessionsRef.current.delete(conversationId);

			if (wasAborted) {
				return;
			}

			await Promise.all([
				db
					.update(messagesTable)
					.set({ status: "complete" })
					.where(eq(messagesTable.id, assistantMessage.id)),
				appendRequestLog({
					clientAddress: null,
					createdAt: new Date().toISOString(),
					endpoint: "/internal/generate",
					errorMessage: null,
					id: requestId,
					latencyMs: generation.latencyMs,
					method: "POST",
					modelId: activeModel.id,
					responsePreview: truncateText(generation.responseText, 180),
					source: "app-chat",
					status: "success",
					statusCode: null,
					summary: `Resposta local concluída em ${activeModel.displayName}.`,
				}),
			]);

			setSnapshot((value) => ({
				...value,
				messages: value.messages.map((message) =>
					message.id === assistantMessage.id
						? { ...message, status: "complete" }
						: message
				),
			}));
		} catch (error) {
			const wasAborted = abortedGenerationsRef.current.has(conversationId);
			abortedGenerationsRef.current.delete(conversationId);
			generationSessionsRef.current.delete(conversationId);

			if (wasAborted) {
				return;
			}

			const errorMessage =
				error instanceof Error ? error.message : "Falha ao gerar resposta.";

			await Promise.all([
				db
					.update(messagesTable)
					.set({ status: "error" })
					.where(eq(messagesTable.id, assistantMessage.id)),
				appendRequestLog({
					clientAddress: null,
					createdAt: new Date().toISOString(),
					endpoint: "/internal/generate",
					errorMessage,
					id: requestId,
					latencyMs: 0,
					method: "POST",
					modelId: activeModel.id,
					responsePreview: null,
					source: "app-chat",
					status: "error",
					statusCode: null,
					summary: "Geração local falhou.",
				}),
			]);

			setSnapshot((value) => ({
				...value,
				messages: value.messages.map((message) =>
					message.id === assistantMessage.id
						? { ...message, status: "error" }
						: message
				),
			}));
		}
	};

	const setProviderEnabled = async (enabled: boolean) => {
		await setSetting(SETTINGS_KEYS.providerEnabled, String(enabled));
		const nextSnapshot = await refreshRuntime({
			...snapshotRef.current,
			providerSettings: {
				...snapshotRef.current.providerSettings,
				enabled,
			},
		});
		setSnapshot(nextSnapshot);

		if (enabled) {
			await startProviderServer();
			return;
		}

		await stopProviderServer();
	};

	const regenerateProviderToken = async () => {
		const nextToken = await updateProviderToken();
		setSnapshot((current) => ({ ...current, providerToken: nextToken }));
	};

	const runProviderTest = async (): Promise<ProviderTestResult> => {
		const current = snapshotRef.current;
		const activeModel = current.catalog.find(
			(model) => model.id === current.activeModelId
		);

		if (!current.providerSettings.enabled) {
			const result = {
				endpoint: `${current.providerRuntime.baseUrl}/responses`,
				errorMessage: "Ative a exposição antes de testar o endpoint.",
				ok: false,
				responsePreview: null,
				summary: "Provider desligado.",
			};

			await appendRequestLog({
				clientAddress: null,
				createdAt: new Date().toISOString(),
				endpoint: "/v1/responses",
				errorMessage: result.errorMessage,
				id: createId("req"),
				latencyMs: 0,
				method: "POST",
				modelId: current.activeModelId,
				responsePreview: null,
				source: "app-api-test",
				status: "error",
				statusCode: null,
				summary: result.summary,
			});

			return result;
		}

		if (!PROVIDER_SUPPORTED) {
			return {
				endpoint: `${current.providerRuntime.baseUrl}/responses`,
				errorMessage:
					"Esta build expõe o provider HTTP real apenas no Android nesta etapa.",
				ok: false,
				responsePreview: null,
				summary: "Plataforma experimental para provider HTTP.",
			};
		}

		if (!activeModel) {
			return {
				endpoint: `${current.providerRuntime.baseUrl}/responses`,
				errorMessage: "Escolha um modelo pronto para testar o provider.",
				ok: false,
				responsePreview: null,
				summary: "Sem modelo ativo.",
			};
		}

		const healthUrl = current.providerRuntime.baseUrl.replace(
			V1_PATH_SUFFIX_REGEX,
			"/health"
		);
		const headers = {
			Authorization: `Bearer ${current.providerToken}`,
			"Content-Type": "application/json",
		};
		const startedAt = Date.now();

		try {
			const [healthResponse, modelsResponse, inferenceResponse] =
				await Promise.all([
					fetch(healthUrl),
					fetch(`${current.providerRuntime.baseUrl}/models`, { headers }),
					fetch(`${current.providerRuntime.baseUrl}/responses`, {
						body: JSON.stringify({
							input: "Faça um healthcheck do provider local.",
							model: activeModel.id,
							stream: false,
						}),
						headers,
						method: "POST",
					}),
				]);

			if (!(healthResponse.ok && modelsResponse.ok && inferenceResponse.ok)) {
				throw new Error("O endpoint retornou uma resposta HTTP inesperada.");
			}

			const inferenceJson = (await inferenceResponse.json()) as {
				output_text?: string;
			};
			const responsePreview = truncateText(
				inferenceJson.output_text ?? "",
				180
			);
			const result = {
				endpoint: `${current.providerRuntime.baseUrl}/responses`,
				errorMessage: null,
				ok: true,
				responsePreview,
				summary: `Contrato OpenAI-compatible validado com ${activeModel.displayName}.`,
			};

			await appendRequestLog({
				clientAddress: null,
				createdAt: new Date().toISOString(),
				endpoint: "/v1/responses",
				errorMessage: null,
				id: createId("req"),
				latencyMs: Date.now() - startedAt,
				method: "POST",
				modelId: activeModel.id,
				responsePreview,
				source: "app-api-test",
				status: "success",
				statusCode: 200,
				summary: result.summary,
			});

			return result;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Falha ao validar o endpoint.";
			const result = {
				endpoint: `${current.providerRuntime.baseUrl}/responses`,
				errorMessage: message,
				ok: false,
				responsePreview: null,
				summary: "Teste do provider falhou.",
			};

			await appendRequestLog({
				clientAddress: null,
				createdAt: new Date().toISOString(),
				endpoint: "/v1/responses",
				errorMessage: message,
				id: createId("req"),
				latencyMs: Date.now() - startedAt,
				method: "POST",
				modelId: activeModel.id,
				responsePreview: null,
				source: "app-api-test",
				status: "error",
				statusCode: null,
				summary: result.summary,
			});

			return result;
		}
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
					credential: draft.credential,
					modelId: draft.modelId,
					roomCode: draft.roomCode,
					roomName: draft.roomName,
					visibility: draft.visibility,
				},
			});

		setSnapshot((current) => ({ ...current, gambiDraft: draft }));
	};

	const resetActivity = async () => {
		await db.delete(requestLogsTable);
		setSnapshot((current) => ({ ...current, requestLogs: [] }));
	};

	useEffect(() => {
		if (
			snapshot.isHydrated &&
			snapshot.providerSettings.enabled &&
			PROVIDER_SUPPORTED
		) {
			runInBackground(startProviderServer());
		}
	}, [snapshot.isHydrated, snapshot.providerSettings.enabled]);

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
		activeConversation,
		activeConversationMessages,
		cancelDownload,
		clearConversation,
		copyToClipboard,
		createConversation,
		hydrateError:
			snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null,
		installedStorageBytes,
		pauseDownload,
		regenerateProviderToken,
		removeModel,
		resetActivity,
		runProviderTest,
		saveGambiDraft,
		selectConversation,
		sendMessage,
		setActiveModel,
		setProviderEnabled,
		snapshot,
		startDownload,
		stopGeneration,
	};

	return (
		<AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
	);
}
