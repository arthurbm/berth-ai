import type { ModelCatalogEntry } from "@/types/app-state";

const GB = 1024 * 1024 * 1024;

export const MODEL_CATALOG: ModelCatalogEntry[] = [
	{
		approxBytes: Math.round(0.4 * GB),
		artifactId:
			"Qwen/Qwen2.5-0.5B-Instruct-GGUF/qwen2.5-0.5b-instruct-q4_k_m.gguf",
		capabilities: ["responses", "chat_completions"],
		displayName: "Qwen 2.5 0.5B Instruct",
		downloadUrl:
			"https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true",
		generationDefaults: {
			maxOutputTokens: 512,
			temperature: 0.7,
			topK: 20,
			topP: 0.8,
		},
		id: "qwen25-05b",
		minDeviceHint: "Ideal para começar em devices intermediários.",
		recommended: true,
		runtimeFamily: "llama.cpp / GGUF",
		sizeLabel: "0.4 GB",
		slug: "qwen2.5-0.5b-instruct-q4-k-m.gguf",
		source: "Hugging Face",
		summary:
			"Modelo leve para primeiros testes, chat rápido e device footprint baixo.",
	},
	{
		approxBytes: Math.round(0.9 * GB),
		artifactId:
			"unsloth/Llama-3.2-1B-Instruct-GGUF/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
		capabilities: ["responses", "chat_completions"],
		displayName: "Llama 3.2 1B Instruct",
		downloadUrl:
			"https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf?download=true",
		generationDefaults: {
			maxOutputTokens: 512,
			temperature: 0.7,
		},
		id: "llama32-1b",
		minDeviceHint: "Melhor em devices com folga de memória e armazenamento.",
		recommended: true,
		runtimeFamily: "llama.cpp / GGUF",
		sizeLabel: "0.9 GB",
		slug: "llama-3.2-1b-instruct-q4-k-m.gguf",
		source: "Meta community build",
		summary:
			"Boa base para provider pessoal com respostas mais consistentes sem sair do mobile.",
	},
	{
		approxBytes: Math.round(2.2 * GB),
		artifactId:
			"bartowski/Phi-3.5-mini-instruct-GGUF/Phi-3.5-mini-instruct-Q4_K_M.gguf",
		capabilities: ["responses", "chat_completions"],
		displayName: "Phi 3.5 Mini Instruct",
		downloadUrl:
			"https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf?download=true",
		generationDefaults: {
			maxOutputTokens: 512,
			temperature: 0.7,
		},
		id: "phi35-mini",
		minDeviceHint: "Use em devices topo de linha ou para testes pontuais.",
		recommended: false,
		runtimeFamily: "llama.cpp / GGUF",
		sizeLabel: "2.2 GB",
		slug: "phi-3.5-mini-instruct-q4-k-m.gguf",
		source: "Microsoft community build",
		summary:
			"Mais pesado, útil para testar qualidade superior no mesmo fluxo de provider.",
	},
	{
		approxBytes: Math.round(0.3 * GB),
		artifactId:
			"nomic-ai/nomic-embed-text-v1.5-GGUF/nomic-embed-text-v1.5.f16.gguf",
		capabilities: ["embeddings"],
		displayName: "Nomic Embed Text v1.5",
		downloadUrl:
			"https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.f16.gguf?download=true",
		id: "nomic-embed",
		minDeviceHint:
			"Ative apenas quando o runtime de embeddings estiver conectado.",
		recommended: false,
		runtimeFamily: "llama.cpp / embeddings",
		sizeLabel: "0.3 GB",
		slug: "nomic-embed-text-v1.5-f16.gguf",
		source: "Nomic community build",
		summary:
			"Reservado para a próxima fase de embeddings; fica visível como capacidade futura.",
	},
];

export const INITIAL_PROVIDER_PORT = 3838;
