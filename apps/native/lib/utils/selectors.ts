import type { AppSnapshot, ModelCatalogEntry } from "@/types/app-state";

export const getCatalogModelState = (
	snapshot: AppSnapshot,
	entry: ModelCatalogEntry
) => {
	const localRecord = snapshot.localModels.find(
		(item) => item.modelId === entry.id
	);

	return {
		entry,
		localRecord,
		isActive: snapshot.activeModelId === entry.id,
		status: localRecord?.status ?? "not_downloaded",
		progress: localRecord?.progress ?? 0,
	};
};

export const getActiveModel = (snapshot: AppSnapshot) =>
	snapshot.catalog.find((model) => model.id === snapshot.activeModelId) ?? null;
