import {
	createDownloadResumable,
	type DownloadPauseState,
	type DownloadProgressData,
	type DownloadResumable,
	deleteAsync,
	documentDirectory,
	getInfoAsync,
	makeDirectoryAsync,
} from "expo-file-system/legacy";
import {
	type CompletionParams,
	initLlama,
	type LlamaContext,
	type RNLlamaOAICompatibleMessage,
} from "llama.rn";

import type {
	ConversationMessage,
	LocalModelRecord,
	ModelCatalogEntry,
	RuntimeStatus,
} from "@/types/app-state";

const DEFAULT_STOP_WORDS = [
	"</s>",
	"<|end|>",
	"<|eot_id|>",
	"<|end_of_text|>",
	"<|im_end|>",
	"<|EOT|>",
	"<|END_OF_TURN_TOKEN|>",
	"<|end_of_turn|>",
	"<|endoftext|>",
];

const MODELS_DIRECTORY = `${documentDirectory ?? ""}models/`;

export interface DownloadCallbacks {
	onComplete: (result: {
		bytesOnDisk: number;
		localPath: string;
		resumeData: string | null;
	}) => Promise<void> | void;
	onError: (errorMessage: string) => Promise<void> | void;
	onProgress: (progress: {
		bytesOnDisk: number;
		progress: number;
	}) => Promise<void> | void;
}

export interface GenerateCallbacks {
	onDelta: (delta: string) => Promise<void> | void;
	onRuntimeStatusChange?: (status: RuntimeStatus) => Promise<void> | void;
}

export interface GenerateInput {
	conversationMessages: ConversationMessage[];
	generationKey: string;
	model: ModelCatalogEntry;
	prompt: string;
}

export interface GenerateResult {
	finishReason: "stop" | "length" | "error";
	latencyMs: number;
	responseText: string;
}

function requireDocumentDirectory() {
	if (!documentDirectory) {
		throw new Error("expo-file-system documentDirectory is unavailable.");
	}
}

function normalizeFileUriToPath(fileUri: string) {
	return fileUri.startsWith("file://")
		? fileUri.slice("file://".length)
		: fileUri;
}

function modelFileUri(entry: ModelCatalogEntry) {
	requireDocumentDirectory();
	return `${MODELS_DIRECTORY}${entry.slug}`;
}

function buildMessages(input: GenerateInput): RNLlamaOAICompatibleMessage[] {
	const history = input.conversationMessages
		.filter((message) => message.status !== "error")
		.map<RNLlamaOAICompatibleMessage>((message) => ({
			content: message.content,
			role: message.role,
		}));

	if (history.length > 0) {
		return history;
	}

	return [{ content: input.prompt, role: "user" }];
}

function runCallback(task: Promise<void> | void) {
	Promise.resolve(task).catch(() => undefined);
}

export class NativeInferenceRuntime {
	private activeContext: LlamaContext | null = null;
	private activeModelId: string | null = null;
	private readonly downloadTasks = new Map<string, DownloadResumable>();
	private currentGenerationKey: string | null = null;

	async ensureModelsDirectory() {
		requireDocumentDirectory();

		const info = await getInfoAsync(MODELS_DIRECTORY);

		if (info.exists) {
			return;
		}

		await makeDirectoryAsync(MODELS_DIRECTORY, { intermediates: true });
	}

	async getInstalledModelState(entry: ModelCatalogEntry) {
		await this.ensureModelsDirectory();

		const fileInfo = await getInfoAsync(modelFileUri(entry));

		if (!fileInfo.exists) {
			return {
				bytesOnDisk: 0,
				exists: false,
				localPath: null,
			};
		}

		const bytesOnDisk =
			"size" in fileInfo && typeof fileInfo.size === "number"
				? fileInfo.size
				: 0;

		return {
			bytesOnDisk,
			exists: true,
			localPath: normalizeFileUriToPath(modelFileUri(entry)),
		};
	}

	async startDownload(
		entry: ModelCatalogEntry,
		record: Pick<LocalModelRecord, "resumeData">,
		callbacks: DownloadCallbacks
	) {
		await this.ensureModelsDirectory();

		const task = createDownloadResumable(
			entry.downloadUrl,
			modelFileUri(entry),
			{},
			(progressEvent: DownloadProgressData) => {
				const totalBytes =
					progressEvent.totalBytesExpectedToWrite || entry.approxBytes;
				const writtenBytes = progressEvent.totalBytesWritten || 0;

				runCallback(
					callbacks.onProgress({
						bytesOnDisk: writtenBytes,
						progress: totalBytes > 0 ? writtenBytes / totalBytes : 0,
					})
				);
			},
			record.resumeData ?? undefined
		);

		this.downloadTasks.set(entry.id, task);

		try {
			const result = record.resumeData?.length
				? await task.resumeAsync()
				: await task.downloadAsync();

			this.downloadTasks.delete(entry.id);

			if (!result) {
				throw new Error("Download cancelado antes da conclusão.");
			}

			const fileInfo = await getInfoAsync(modelFileUri(entry));

			const bytesOnDisk =
				"size" in fileInfo && typeof fileInfo.size === "number"
					? fileInfo.size
					: entry.approxBytes;

			await callbacks.onComplete({
				bytesOnDisk,
				localPath: normalizeFileUriToPath(modelFileUri(entry)),
				resumeData: null,
			});
		} catch (error) {
			this.downloadTasks.delete(entry.id);
			const message =
				error instanceof Error ? error.message : "Falha ao baixar o modelo.";
			await callbacks.onError(message);
		}
	}

	async pauseDownload(modelId: string) {
		const task = this.downloadTasks.get(modelId);

		if (!task) {
			return null;
		}

		const pauseState = await task.pauseAsync();
		this.downloadTasks.delete(modelId);

		return JSON.stringify(pauseState);
	}

	async cancelDownload(entry: ModelCatalogEntry) {
		const task = this.downloadTasks.get(entry.id);

		if (task) {
			await task.cancelAsync().catch(() => undefined);
			this.downloadTasks.delete(entry.id);
		}

		await deleteAsync(modelFileUri(entry), { idempotent: true });
	}

	async removeModel(entry: ModelCatalogEntry) {
		if (this.activeModelId === entry.id) {
			await this.unloadModel();
		}

		await this.cancelDownload(entry);
	}

	async prepareModel(entry: ModelCatalogEntry) {
		const installed = await this.getInstalledModelState(entry);

		if (!(installed.exists && installed.localPath)) {
			throw new Error("O arquivo do modelo não está disponível no device.");
		}

		if (this.activeContext && this.activeModelId === entry.id) {
			return this.activeContext;
		}

		await this.unloadModel();

		const context = await initLlama({
			model: installed.localPath,
			n_ctx: 4096,
			n_gpu_layers: 99,
			use_mlock: true,
		});

		this.activeContext = context;
		this.activeModelId = entry.id;

		return context;
	}

	async unloadModel() {
		if (this.activeContext) {
			await this.activeContext.release();
		}

		this.activeContext = null;
		this.activeModelId = null;
		this.currentGenerationKey = null;
	}

	async stopGeneration(generationKey: string) {
		if (!this.activeContext || this.currentGenerationKey !== generationKey) {
			return;
		}

		await this.activeContext.stopCompletion();
	}

	async generate(
		input: GenerateInput,
		callbacks: GenerateCallbacks
	): Promise<GenerateResult> {
		const context = await this.prepareModel(input.model);

		await callbacks.onRuntimeStatusChange?.("generating");
		await context.clearCache(false);

		const startedAt = Date.now();
		this.currentGenerationKey = input.generationKey;
		let text = "";

		const completionParams: CompletionParams = {
			messages: buildMessages(input),
			n_predict: 512,
			stop: DEFAULT_STOP_WORDS,
			temperature: 0.7,
		};

		try {
			const result = await context.completion(completionParams, (tokenData) => {
				const delta =
					tokenData.content ??
					tokenData.reasoning_content ??
					tokenData.token ??
					"";

				if (!delta) {
					return;
				}

				text += delta;
				runCallback(callbacks.onDelta(delta));
			});

			const responseText = result.text?.trim() || text.trim();

			return {
				finishReason: result.stopped_limit ? "length" : "stop",
				latencyMs: Date.now() - startedAt,
				responseText,
			};
		} catch (error) {
			await callbacks.onRuntimeStatusChange?.("error");
			const message =
				error instanceof Error ? error.message : "Falha na inferência local.";
			throw new Error(message);
		} finally {
			this.currentGenerationKey = null;
			await callbacks.onRuntimeStatusChange?.("ready");
		}
	}

	restorePausedDownload(resumeData: string) {
		const parsed = JSON.parse(resumeData) as DownloadPauseState;

		return createDownloadResumable(
			parsed.url,
			parsed.fileUri,
			parsed.options,
			undefined,
			parsed.resumeData
		);
	}
}

export const nativeInferenceRuntime = new NativeInferenceRuntime();
