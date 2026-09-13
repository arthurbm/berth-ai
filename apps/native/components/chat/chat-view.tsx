import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import { getActiveModel } from "@/lib/utils/selectors";
import { useAppUiStore } from "@/stores/app-ui-store";

import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";

export function ChatView() {
	const {
		snapshot,
		activeConversation,
		activeConversationMessages,
		sendMessage,
		stopGeneration,
	} = useAppData();
	const { chatDraft: prompt, setChatDraft: setPrompt } = useAppUiStore();
	const activeModel = getActiveModel(snapshot);
	const canSend = prompt.trim().length > 0 && Boolean(activeConversation?.id);
	const accentColor = useThemeColor("accent");
	const scrollRef = useRef<ScrollView>(null);
	const isStreaming = activeConversationMessages.some(
		(m) => m.status === "streaming",
	);

	const handleSend = async () => {
		if (!(activeConversation && prompt.trim())) {
			return;
		}
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
		}
		const nextPrompt = prompt;
		setPrompt("");
		await sendMessage({
			conversationId: activeConversation.id,
			prompt: nextPrompt,
		});
	};

	const handleStop = () => {
		if (activeConversation) {
			stopGeneration(activeConversation.id);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={{ flex: 1 }}
		>
			<View className="flex-1 gap-3">
				{/* Messages area */}
				<View
					className="flex-1 rounded-3xl bg-surface px-4 py-4"
					style={{ borderCurve: "continuous" }}
				>
					{activeConversation ? (
						<ScrollView
							contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
							contentInsetAdjustmentBehavior="automatic"
							onContentSizeChange={() =>
								scrollRef.current?.scrollToEnd({ animated: true })
							}
							ref={scrollRef}
							style={{ flex: 1 }}
						>
							{activeConversationMessages.map((message) => (
								<MessageBubble
									accentColor={accentColor}
									key={message.id}
									message={message}
								/>
							))}

							{activeConversationMessages.length === 0 ? (
								<EmptyState
									description="Envie uma mensagem para comecar."
									title="Conversa pronta"
								/>
							) : null}
						</ScrollView>
					) : (
						<EmptyState
							description="Crie uma nova conversa para comecar."
							title="Nenhuma conversa ativa"
						/>
					)}
				</View>

				{/* Input area */}
				<ChatInput
					accentColor={accentColor}
					canSend={canSend}
					isStreaming={isStreaming}
					onSend={handleSend}
					onStop={handleStop}
					prompt={prompt}
					setPrompt={setPrompt}
				/>
			</View>
		</KeyboardAvoidingView>
	);
}
