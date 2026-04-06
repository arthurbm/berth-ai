import { nativeInferenceRuntime } from "@/lib/inference/native-runtime";
import {
	buildChatCompletionsResult,
	buildHealthResponse,
	buildModelsResponse,
	buildProviderLog,
	buildResponsesResult,
	normalizeHeaders,
	type ProviderRouteResult,
	type ProviderStreamResponse,
	parseJsonBody,
	validateBearerToken,
} from "@/lib/provider/openai-compatible";
import { truncateText } from "@/lib/utils/format";
import { createId } from "@/lib/utils/id";
import type {
	ProviderServerIncomingRequest,
	ProviderServerNativeModule,
} from "@/modules/provider-server";
import type {
	AppSnapshot,
	ConversationMessage,
	MessageRole,
	ModelCatalogEntry,
	ProviderRequestLog,
} from "@/types/app-state";

const JSON_HEADERS = {
	"Content-Type": "application/json; charset=utf-8",
} as const;

const STREAM_HEADERS = {
	"Cache-Control": "no-cache",
	Connection: "keep-alive",
	"Content-Type": "text/event-stream; charset=utf-8",
} as const;

const CHAT_COMPLETIONS_PATH = "/v1/chat/completions";
const HEALTH_PATH = "/health";
const MODELS_PATH = "/v1/models";
const RESPONSES_PATH = "/v1/responses";

interface ProviderRequestHandlerOptions {
	appendRequestLog: (log: ProviderRequestLog) => Promise<void>;
	request: ProviderServerIncomingRequest;
	serverModule: ProviderServerNativeModule;
	snapshot: AppSnapshot;
}

interface RequestLogBase {
	clientAddress: string | null;
	createdAt: string;
	endpoint: string;
	id: string;
	latencyMs: number;
	method: string;
	modelId: string | null;
	source: string;
}

interface InferenceInput {
	prompt: string;
	providerMessages: ConversationMessage[];
	stream: boolean;
}

function createRequestLogBase(
	request: ProviderServerIncomingRequest,
	modelId: string | null,
	startedAt: number
): RequestLogBase {
	return {
		clientAddress: request.clientAddress,
		createdAt: new Date().toISOString(),
		endpoint: request.path,
		id: createId("req"),
		latencyMs: Date.now() - startedAt,
		method: request.method,
		modelId,
		source: "provider-http",
	};
}

function createErrorLog(
	request: ProviderServerIncomingRequest,
	modelId: string | null,
	startedAt: number,
	statusCode: number,
	message: string
): ProviderRequestLog {
	return {
		...createRequestLogBase(request, modelId, startedAt),
		errorMessage: message,
		responsePreview: null,
		status: "error",
		statusCode,
		summary: message,
	};
}

function createJsonSuccessLog(
	request: ProviderServerIncomingRequest,
	modelId: string | null,
	startedAt: number,
	statusCode: number,
	body: string,
	summary: string
): ProviderRequestLog {
	return {
		...createRequestLogBase(request, modelId, startedAt),
		errorMessage: null,
		responsePreview: truncateText(body, 180),
		status: "success",
		statusCode,
		summary,
	};
}

function extractPromptFromResponsesBody(body: Record<string, unknown>) {
	const input = body.input;

	if (typeof input === "string") {
		return input;
	}

	if (Array.isArray(input)) {
		return input
			.map((item) => {
				if (typeof item === "string") {
					return item;
				}

				if (
					item &&
					typeof item === "object" &&
					"text" in item &&
					typeof item.text === "string"
				) {
					return item.text;
				}

				return "";
			})
			.join("\n")
			.trim();
	}

	return "";
}

function extractConversationMessagesFromChat(
	body: Record<string, unknown>,
	requestId: string
): ConversationMessage[] {
	const rawMessages = Array.isArray(body.messages) ? body.messages : [];

	return rawMessages.flatMap((message, index) => {
		if (!message || typeof message !== "object") {
			return [];
		}

		const role = typeof message.role === "string" ? message.role : null;
		const content =
			typeof message.content === "string" ? message.content : null;

		if (!(role && content)) {
			return [];
		}

		return [
			{
				content,
				conversationId: requestId,
				createdAt: new Date().toISOString(),
				id: `${requestId}_${index}`,
				role: role as MessageRole,
				status: "complete",
			},
		];
	});
}

function extractInferenceInput(
	request: ProviderServerIncomingRequest,
	body: Record<string, unknown>
): InferenceInput {
	const stream = Boolean(body.stream);
	const providerMessages =
		request.path === CHAT_COMPLETIONS_PATH
			? extractConversationMessagesFromChat(body, request.requestId)
			: [];
	const prompt =
		request.path === CHAT_COMPLETIONS_PATH
			? (providerMessages.at(-1)?.content ?? "")
			: extractPromptFromResponsesBody(body);

	return {
		prompt,
		providerMessages,
		stream,
	};
}

function isStreamResponse(
	response: ProviderRouteResult
): response is ProviderStreamResponse {
	return "stream" in response && response.stream;
}

async function respondWithJson(
	serverModule: ProviderServerNativeModule,
	requestId: string,
	statusCode: number,
	body: string,
	headers?: Record<string, string>
) {
	await serverModule.respond(
		requestId,
		statusCode,
		{ ...JSON_HEADERS, ...headers },
		body
	);
}

async function respondWithError(
	options: ProviderRequestHandlerOptions,
	modelId: string | null,
	startedAt: number,
	statusCode: number,
	message: string
) {
	await options.serverModule.respondError(
		options.request.requestId,
		statusCode,
		message
	);
	await options.appendRequestLog(
		createErrorLog(options.request, modelId, startedAt, statusCode, message)
	);
}

async function streamInitialResponse(
	serverModule: ProviderServerNativeModule,
	request: ProviderServerIncomingRequest,
	activeModel: ModelCatalogEntry
) {
	await serverModule.respondStreamStart(request.requestId, 200, STREAM_HEADERS);

	if (request.path !== RESPONSES_PATH) {
		return;
	}

	await serverModule.respondStreamChunk(
		request.requestId,
		`event: response.created\ndata: ${JSON.stringify({
			created_at: Math.floor(Date.now() / 1000),
			id: `resp_${request.requestId}`,
			model: activeModel.id,
			object: "response",
			status: "in_progress",
		})}\n\n`
	);
}

async function streamDelta(
	serverModule: ProviderServerNativeModule,
	request: ProviderServerIncomingRequest,
	activeModel: ModelCatalogEntry,
	delta: string
) {
	if (request.path === RESPONSES_PATH) {
		await serverModule.respondStreamChunk(
			request.requestId,
			`event: response.output_text.delta\ndata: ${JSON.stringify({
				content_index: 0,
				delta,
				output_index: 0,
				type: "response.output_text.delta",
			})}\n\n`
		);
		return;
	}

	await serverModule.respondStreamChunk(
		request.requestId,
		`data: ${JSON.stringify({
			choices: [
				{
					delta: { content: delta },
					finish_reason: null,
					index: 0,
				},
			],
			created: Math.floor(Date.now() / 1000),
			id: `chatcmpl_${request.requestId}`,
			model: activeModel.id,
			object: "chat.completion.chunk",
		})}\n\n`
	);
}

async function finalizeStream(
	serverModule: ProviderServerNativeModule,
	request: ProviderServerIncomingRequest,
	activeModel: ModelCatalogEntry,
	finalText: string
) {
	if (request.path === RESPONSES_PATH) {
		await serverModule.respondStreamChunk(
			request.requestId,
			`event: response.completed\ndata: ${JSON.stringify({
				created_at: Math.floor(Date.now() / 1000),
				id: `resp_${request.requestId}`,
				model: activeModel.id,
				object: "response",
				output_text: finalText,
				status: "completed",
			})}\n\n`
		);
	} else {
		await serverModule.respondStreamChunk(
			request.requestId,
			`data: ${JSON.stringify({
				choices: [{ delta: {}, finish_reason: "stop", index: 0 }],
				created: Math.floor(Date.now() / 1000),
				id: `chatcmpl_${request.requestId}`,
				model: activeModel.id,
				object: "chat.completion.chunk",
			})}\n\n`
		);
	}

	await serverModule.respondStreamChunk(request.requestId, "data: [DONE]\n\n");
	await serverModule.respondStreamComplete(request.requestId);
}

async function handleHealthRequest(
	options: ProviderRequestHandlerOptions,
	activeModel: ModelCatalogEntry | null,
	startedAt: number
) {
	const response = buildHealthResponse({
		activeModel,
		snapshot: options.snapshot,
	});

	await respondWithJson(
		options.serverModule,
		options.request.requestId,
		response.statusCode,
		response.body
	);
	await options.appendRequestLog(
		createJsonSuccessLog(
			options.request,
			options.snapshot.activeModelId,
			startedAt,
			response.statusCode,
			response.body,
			"Healthcheck local respondido."
		)
	);
}

async function handleModelsRequest(
	options: ProviderRequestHandlerOptions,
	activeModel: ModelCatalogEntry | null,
	startedAt: number
) {
	const response = buildModelsResponse({
		activeModel,
		snapshot: options.snapshot,
	});

	await respondWithJson(
		options.serverModule,
		options.request.requestId,
		response.statusCode,
		response.body
	);
	await options.appendRequestLog(
		createJsonSuccessLog(
			options.request,
			options.snapshot.activeModelId,
			startedAt,
			response.statusCode,
			response.body,
			"Lista de modelos locais exposta."
		)
	);
}

async function handleInferenceRequest(
	options: ProviderRequestHandlerOptions,
	activeModel: ModelCatalogEntry,
	startedAt: number
) {
	const parsedBody = parseJsonBody(options.request.body);
	const { prompt, providerMessages, stream } = extractInferenceInput(
		options.request,
		parsedBody
	);

	if (!prompt.trim()) {
		await respondWithError(
			options,
			activeModel.id,
			startedAt,
			400,
			"O request precisa trazer texto para inferência."
		);
		return;
	}

	let generatedText = "";

	if (stream) {
		await streamInitialResponse(
			options.serverModule,
			options.request,
			activeModel
		);
	}

	const generation = await nativeInferenceRuntime.generate(
		{
			conversationMessages: providerMessages,
			generationKey: `provider:${options.request.requestId}`,
			model: activeModel,
			prompt,
		},
		{
			onDelta: (delta) => {
				generatedText += delta;

				if (!stream) {
					return;
				}

				return streamDelta(
					options.serverModule,
					options.request,
					activeModel,
					delta
				);
			},
		}
	);

	const finalText = generation.responseText || generatedText.trim();
	const response =
		options.request.path === RESPONSES_PATH
			? buildResponsesResult(activeModel.id, finalText, stream)
			: buildChatCompletionsResult(activeModel.id, finalText, stream);

	if (isStreamResponse(response)) {
		await finalizeStream(
			options.serverModule,
			options.request,
			activeModel,
			finalText
		);
		return;
	}

	await respondWithJson(
		options.serverModule,
		options.request.requestId,
		response.statusCode,
		response.body,
		response.headers
	);

	await options.appendRequestLog(
		buildProviderLog(
			{
				...createRequestLogBase(options.request, activeModel.id, startedAt),
				errorMessage: null,
				status: "success",
				statusCode: 200,
			},
			finalText,
			`Request OpenAI-compatible atendido com ${activeModel.displayName}.`
		)
	);
}

export async function handleProviderRequest(
	options: ProviderRequestHandlerOptions
) {
	const activeModel =
		options.snapshot.catalog.find(
			(model) => model.id === options.snapshot.activeModelId
		) ?? null;
	const headers = normalizeHeaders(options.request.headers);
	const startedAt = Date.now();

	if (
		options.request.path === HEALTH_PATH &&
		options.request.method === "GET"
	) {
		await handleHealthRequest(options, activeModel, startedAt);
		return;
	}

	if (!validateBearerToken(headers, options.snapshot.providerToken)) {
		await respondWithError(
			options,
			options.snapshot.activeModelId,
			startedAt,
			401,
			"Token inválido ou ausente."
		);
		return;
	}

	if (
		options.request.path === MODELS_PATH &&
		options.request.method === "GET"
	) {
		await handleModelsRequest(options, activeModel, startedAt);
		return;
	}

	if (!activeModel) {
		await respondWithError(
			options,
			options.snapshot.activeModelId,
			startedAt,
			400,
			"Nenhum modelo ativo está pronto para servir requests."
		);
		return;
	}

	const isSupportedPath =
		options.request.path === RESPONSES_PATH ||
		options.request.path === CHAT_COMPLETIONS_PATH;

	if (!isSupportedPath) {
		await respondWithError(
			options,
			activeModel.id,
			startedAt,
			404,
			"Endpoint local não encontrado."
		);
		return;
	}

	if (options.request.method !== "POST") {
		await respondWithError(
			options,
			activeModel.id,
			startedAt,
			405,
			"Método HTTP não suportado."
		);
		return;
	}

	try {
		await handleInferenceRequest(options, activeModel, startedAt);
	} catch (error) {
		await respondWithError(
			options,
			activeModel.id,
			startedAt,
			500,
			error instanceof Error ? error.message : "Falha ao processar request."
		);
	}
}
