import { truncateText } from "@/lib/utils/format";
import type {
	AppSnapshot,
	ModelCatalogEntry,
	ProviderRequestLog,
} from "@/types/app-state";

const WHITESPACE_SPLIT_REGEX = /(\s+)/;

export interface ProviderRouteContext {
	activeModel: ModelCatalogEntry | null;
	snapshot: AppSnapshot;
}

export interface ProviderJsonResponse {
	body: string;
	headers?: Record<string, string>;
	statusCode: number;
}

export interface ProviderStreamResponse {
	headers?: Record<string, string>;
	parts: string[];
	statusCode: number;
	stream: true;
}

export type ProviderRouteResult = ProviderJsonResponse | ProviderStreamResponse;

export function validateBearerToken(
	headers: Record<string, string>,
	expectedToken: string
) {
	const authorization =
		headers.authorization ?? headers.Authorization ?? headers.AUTHORIZATION;

	if (!authorization?.startsWith("Bearer ")) {
		return false;
	}

	return authorization.slice("Bearer ".length).trim() === expectedToken;
}

export function normalizeHeaders(headers: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
	);
}

export function parseJsonBody(body: string) {
	if (!body.trim()) {
		return {};
	}

	return JSON.parse(body) as Record<string, unknown>;
}

function createdAtSeconds() {
	return Math.floor(Date.now() / 1000);
}

function createResponsePayload(modelId: string, outputText: string) {
	return {
		created_at: createdAtSeconds(),
		id: `resp_${Date.now()}`,
		model: modelId,
		object: "response",
		output: [
			{
				content: [
					{
						annotations: [],
						text: outputText,
						type: "output_text",
					},
				],
				id: `msg_${Date.now()}`,
				role: "assistant",
				type: "message",
			},
		],
		output_text: outputText,
		status: "completed",
	};
}

function createChatCompletionPayload(modelId: string, outputText: string) {
	return {
		choices: [
			{
				finish_reason: "stop",
				index: 0,
				message: {
					content: outputText,
					role: "assistant",
				},
			},
		],
		created: createdAtSeconds(),
		id: `chatcmpl_${Date.now()}`,
		model: modelId,
		object: "chat.completion",
	};
}

export function buildModelsResponse(context: ProviderRouteContext) {
	const installedModels = context.snapshot.localModels
		.filter((record) => record.status === "ready" || record.status === "in_use")
		.map((record) => {
			const catalogEntry = context.snapshot.catalog.find(
				(model) => model.id === record.modelId
			);

			return {
				created: catalogEntry?.recommended ? createdAtSeconds() : null,
				id: record.modelId,
				object: "model",
				owned_by: "berth-ai-local",
			};
		});

	return {
		body: JSON.stringify({ data: installedModels, object: "list" }),
		statusCode: 200,
	} satisfies ProviderJsonResponse;
}

export function buildHealthResponse(context: ProviderRouteContext) {
	return {
		body: JSON.stringify({
			activeModelId: context.snapshot.activeModelId,
			capabilities: context.snapshot.providerRuntime.capabilities,
			host: context.snapshot.providerRuntime.host,
			platformSupport: context.snapshot.providerRuntime.platformSupport,
			status: context.snapshot.endpointStatus,
			transportReady: context.snapshot.providerRuntime.transportReady,
		}),
		statusCode: 200,
	} satisfies ProviderJsonResponse;
}

export function buildResponsesResult(
	modelId: string,
	outputText: string,
	stream: boolean
): ProviderRouteResult {
	if (!stream) {
		return {
			body: JSON.stringify(createResponsePayload(modelId, outputText)),
			statusCode: 200,
		};
	}

	const response = createResponsePayload(modelId, outputText);
	const deltaParts = outputText.split(WHITESPACE_SPLIT_REGEX).filter(Boolean);
	const parts = [
		`event: response.created\ndata: ${JSON.stringify(response)}\n\n`,
		...deltaParts.map(
			(delta) =>
				`event: response.output_text.delta\ndata: ${JSON.stringify({
					content_index: 0,
					delta,
					output_index: 0,
					type: "response.output_text.delta",
				})}\n\n`
		),
		`event: response.completed\ndata: ${JSON.stringify(response)}\n\n`,
		"data: [DONE]\n\n",
	];

	return {
		headers: {
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Content-Type": "text/event-stream; charset=utf-8",
		},
		parts,
		statusCode: 200,
		stream: true,
	};
}

export function buildChatCompletionsResult(
	modelId: string,
	outputText: string,
	stream: boolean
): ProviderRouteResult {
	if (!stream) {
		return {
			body: JSON.stringify(createChatCompletionPayload(modelId, outputText)),
			statusCode: 200,
		};
	}

	const baseChunk = {
		created: createdAtSeconds(),
		id: `chatcmpl_${Date.now()}`,
		model: modelId,
		object: "chat.completion.chunk",
	};
	const deltaParts = outputText.split(WHITESPACE_SPLIT_REGEX).filter(Boolean);
	const parts = [
		...deltaParts.map(
			(delta) =>
				`data: ${JSON.stringify({
					...baseChunk,
					choices: [
						{ delta: { content: delta }, finish_reason: null, index: 0 },
					],
				})}\n\n`
		),
		`data: ${JSON.stringify({
			...baseChunk,
			choices: [{ delta: {}, finish_reason: "stop", index: 0 }],
		})}\n\n`,
		"data: [DONE]\n\n",
	];

	return {
		headers: {
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Content-Type": "text/event-stream; charset=utf-8",
		},
		parts,
		statusCode: 200,
		stream: true,
	};
}

export function buildProviderLog(
	base: Omit<ProviderRequestLog, "responsePreview" | "summary">,
	outputText: string | null,
	summary: string
): ProviderRequestLog {
	return {
		...base,
		responsePreview: outputText ? truncateText(outputText, 180) : null,
		summary,
	};
}
