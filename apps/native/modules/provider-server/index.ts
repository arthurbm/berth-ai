import { requireNativeModule } from "expo";

export interface ProviderServerIncomingRequest {
	body: string;
	clientAddress: string | null;
	headers: Record<string, string>;
	method: string;
	path: string;
	query: string | null;
	requestId: string;
}

type ProviderServerEventName = "onRequest";
type ProviderServerEventListener = (
	payload: ProviderServerIncomingRequest
) => void;

export interface ProviderServerNativeModule {
	addListener(
		eventName: ProviderServerEventName,
		listener: ProviderServerEventListener
	): { remove: () => void };
	getPlatformSupport(): string;
	getStatus(): Promise<string>;
	respond(
		requestId: string,
		statusCode: number,
		headers: Record<string, string>,
		body: string
	): Promise<void>;
	respondError(
		requestId: string,
		statusCode: number,
		message: string
	): Promise<void>;
	respondStreamChunk(requestId: string, chunk: string): Promise<void>;
	respondStreamComplete(requestId: string): Promise<void>;
	respondStreamStart(
		requestId: string,
		statusCode: number,
		headers: Record<string, string>
	): Promise<void>;
	start(port: number): Promise<{ port: number; status: string }>;
	stop(): Promise<void>;
}

let cachedModule: ProviderServerNativeModule | undefined;

function removeNoop() {
	return undefined;
}

function createStubModule(): ProviderServerNativeModule {
	return {
		addListener() {
			return { remove: removeNoop };
		},
		getPlatformSupport() {
			return "unsupported";
		},
		getStatus() {
			return Promise.resolve("offline");
		},
		respond() {
			return Promise.resolve();
		},
		respondError() {
			return Promise.resolve();
		},
		respondStreamChunk() {
			return Promise.resolve();
		},
		respondStreamComplete() {
			return Promise.resolve();
		},
		respondStreamStart() {
			return Promise.resolve();
		},
		start(port: number) {
			return Promise.resolve({ port, status: "error" });
		},
		stop() {
			return Promise.resolve();
		},
	};
}

export function getProviderServerModule(): ProviderServerNativeModule {
	if (cachedModule) {
		return cachedModule;
	}

	try {
		cachedModule = requireNativeModule(
			"ProviderServer"
		) as ProviderServerNativeModule;
	} catch {
		cachedModule = createStubModule();
	}

	return cachedModule;
}
