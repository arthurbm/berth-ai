import type { ModelCatalogEntry } from "@/types/app-state";

const GB = 1024 * 1024 * 1024;

export const MODEL_CATALOG: ModelCatalogEntry[] = [
	{
		id: "qwen25-05b",
		slug: "qwen2.5-0.5b-instruct-q4",
		displayName: "Qwen 2.5 0.5B Instruct",
		runtimeFamily: "llama.cpp / GGUF",
		source: "Hugging Face",
		sizeLabel: "0.4 GB",
		approxBytes: Math.round(0.4 * GB),
		capabilities: ["responses", "chat_completions"],
		recommended: true,
		summary:
			"Modelo leve para primeiros testes, chat rápido e device footprint baixo.",
		minDeviceHint: "Ideal para começar em devices intermediários.",
	},
	{
		id: "llama32-1b",
		slug: "llama-3.2-1b-instruct-q4",
		displayName: "Llama 3.2 1B Instruct",
		runtimeFamily: "llama.cpp / GGUF",
		source: "Meta community build",
		sizeLabel: "0.9 GB",
		approxBytes: Math.round(0.9 * GB),
		capabilities: ["responses", "chat_completions"],
		recommended: true,
		summary:
			"Boa base para provider pessoal com respostas mais consistentes sem sair do mobile.",
		minDeviceHint: "Melhor em devices com folga de memória e armazenamento.",
	},
	{
		id: "phi35-mini",
		slug: "phi-3.5-mini-instruct-q4",
		displayName: "Phi 3.5 Mini Instruct",
		runtimeFamily: "llama.cpp / GGUF",
		source: "Microsoft community build",
		sizeLabel: "2.2 GB",
		approxBytes: Math.round(2.2 * GB),
		capabilities: ["responses", "chat_completions"],
		recommended: false,
		summary:
			"Mais pesado, útil para testar qualidade superior no mesmo fluxo de provider.",
		minDeviceHint: "Use em devices topo de linha ou para testes pontuais.",
	},
	{
		id: "nomic-embed",
		slug: "nomic-embed-text-v1.5-q8",
		displayName: "Nomic Embed Text v1.5",
		runtimeFamily: "llama.cpp / embeddings",
		source: "Nomic community build",
		sizeLabel: "0.3 GB",
		approxBytes: Math.round(0.3 * GB),
		capabilities: ["embeddings"],
		recommended: false,
		summary:
			"Reservado para a próxima fase de embeddings; fica visível como capacidade futura.",
		minDeviceHint:
			"Ative apenas quando o runtime de embeddings estiver conectado.",
	},
];

export const INITIAL_PROVIDER_PORT = 3838;
