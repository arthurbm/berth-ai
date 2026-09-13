export type ProviderCapability =
	| "responses"
	| "chat_completions"
	| "embeddings";

export type ModelDownloadState =
	| "not_downloaded"
	| "queued"
	| "downloading"
	| "paused"
	| "ready"
	| "in_use"
	| "error";

export type EndpointStatus = "offline" | "starting" | "online" | "error";

export type ExposureMode = "lan" | "external_experimental";

export type TransportMode = "simulated" | "native";

export type RequestLogStatus = "success" | "error" | "cancelled";

export type RuntimeStatus =
	| "unloaded"
	| "preparing"
	| "ready"
	| "generating"
	| "error";

export type PlatformSupport = "full" | "experimental" | "unsupported";

export type MessageRole = "system" | "user" | "assistant";

export type MessageStatus = "complete" | "streaming" | "aborted" | "error";

export type GambiVisibility = "private" | "public";

export interface GenerationSettings {
	maxOutputTokens?: number;
	temperature?: number;
	topK?: number;
	topP?: number;
}

export interface ModelCatalogEntry {
	approxBytes: number;
	artifactId: string;
	capabilities: ProviderCapability[];
	displayName: string;
	downloadUrl: string;
	generationDefaults?: GenerationSettings;
	id: string;
	minDeviceHint: string;
	recommended: boolean;
	runtimeFamily: string;
	sizeLabel: string;
	slug: string;
	source: string;
	summary: string;
}

export interface LocalModelRecord {
	artifactId: string | null;
	bytesOnDisk: number;
	downloadUrl: string | null;
	errorMessage: string | null;
	installedAt: string | null;
	lastUsedAt: string | null;
	localPath: string | null;
	modelId: string;
	preparedAt: string | null;
	progress: number;
	resumeData: string | null;
	runtimeStatus: RuntimeStatus;
	status: ModelDownloadState;
	updatedAt: string;
}

export interface Conversation {
	createdAt: string;
	id: string;
	modelId: string;
	title: string;
	updatedAt: string;
}

export interface ConversationMessage {
	content: string;
	conversationId: string;
	createdAt: string;
	id: string;
	role: MessageRole;
	status: MessageStatus;
}

export interface ProviderSettings {
	authRequired: boolean;
	enabled: boolean;
	exposureMode: ExposureMode;
	port: number;
	transportMode: TransportMode;
}

export interface ProviderRuntimeInfo {
	baseUrl: string;
	capabilities: ProviderCapability[];
	host: string;
	lastError: string | null;
	lastStartedAt: string | null;
	platformSupport: PlatformSupport;
	transportLabel: string;
	transportReady: boolean;
}

export interface ProviderRequestLog {
	clientAddress: string | null;
	createdAt: string;
	endpoint: string;
	errorMessage: string | null;
	id: string;
	latencyMs: number;
	method: string;
	modelId: string | null;
	responsePreview: string | null;
	source: string;
	status: RequestLogStatus;
	statusCode: number | null;
	summary: string;
}

export interface ProviderTestResult {
	endpoint: string;
	errorMessage: string | null;
	ok: boolean;
	responsePreview: string | null;
	summary: string;
}

export interface GambiDraftConfig {
	credential: string;
	modelId: string | null;
	roomCode: string;
	roomName: string;
	visibility: GambiVisibility;
}

export interface AppSnapshot {
	activeModelId: string | null;
	catalog: ModelCatalogEntry[];
	conversations: Conversation[];
	currentConversationId: string | null;
	endpointStatus: EndpointStatus;
	gambiDraft: GambiDraftConfig;
	isHydrated: boolean;
	localModels: LocalModelRecord[];
	messages: ConversationMessage[];
	providerRuntime: ProviderRuntimeInfo;
	providerSettings: ProviderSettings;
	providerToken: string;
	requestLogs: ProviderRequestLog[];
}

export interface SendMessageInput {
	conversationId: string;
	prompt: string;
}
