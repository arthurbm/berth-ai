import { create } from "zustand";

import type { ProviderTestResult } from "@/types/app-state";

type ChatSegment = "conversa" | "historico";

interface AppUiStore {
	chatActiveSegment: ChatSegment;
	chatDraft: string;
	lastProviderTest: ProviderTestResult | null;
	setChatActiveSegment: (value: ChatSegment) => void;
	setChatDraft: (value: string) => void;
	setLastProviderTest: (value: ProviderTestResult | null) => void;
}

export const useAppUiStore = create<AppUiStore>((set) => ({
	chatActiveSegment: "conversa",
	chatDraft: "",
	lastProviderTest: null,
	setChatActiveSegment: (chatActiveSegment) => set({ chatActiveSegment }),
	setChatDraft: (chatDraft) => set({ chatDraft }),
	setLastProviderTest: (lastProviderTest) => set({ lastProviderTest }),
}));
