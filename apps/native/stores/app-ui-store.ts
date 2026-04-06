import { create } from "zustand";

import type { ProviderTestResult } from "@/types/app-state";

interface AppUiStore {
	chatDraft: string;
	lastProviderTest: ProviderTestResult | null;
	setChatDraft: (value: string) => void;
	setLastProviderTest: (value: ProviderTestResult | null) => void;
}

export const useAppUiStore = create<AppUiStore>((set) => ({
	chatDraft: "",
	setChatDraft: (chatDraft) => set({ chatDraft }),
	lastProviderTest: null,
	setLastProviderTest: (lastProviderTest) => set({ lastProviderTest }),
}));
