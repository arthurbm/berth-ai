import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { useAppData } from "@/hooks/use-app-data";

import ChatScreen from "../index";

export default function ConversationScreen() {
	const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
	const { selectConversation } = useAppData();

	useEffect(() => {
		if (conversationId) {
			selectConversation(conversationId).catch(() => undefined);
		}
	}, [conversationId, selectConversation]);

	return <ChatScreen hasStackHeader />;
}
