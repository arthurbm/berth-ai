import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { router } from "expo-router";
import {
	BottomSheet,
	Button,
	Input,
	ListGroup,
	Spinner,
	useThemeColor,
} from "heroui-native";
import { useRef } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { useAppData } from "@/hooks/use-app-data";
import { formatRelativeTime } from "@/lib/utils/format";
import { getActiveModel } from "@/lib/utils/selectors";
import { useAppUiStore } from "@/stores/app-ui-store";
import type { ConversationMessage } from "@/types/app-state";

function MessageBubble({
	message,
	accentColor,
}: {
	message: ConversationMessage;
	accentColor: string;
}) {
	const isUser = message.role === "user";
	const isStreamingEmpty = message.status === "streaming" && !message.content;

	return (
		<Animated.View entering={FadeInUp.duration(250)}>
			<View
				className={isUser ? "bg-accent" : "bg-surface-secondary"}
				style={[
					{
						maxWidth: isUser ? "85%" : "92%",
						alignSelf: isUser ? "flex-end" : "flex-start",
						borderRadius: 20,
						borderCurve: "continuous",
						paddingHorizontal: 16,
						paddingVertical: 12,
						...(isUser
							? {}
							: {
									borderLeftWidth: 3,
									borderLeftColor: accentColor,
								}),
					},
				]}
			>
				<View className="mb-1.5 flex-row items-center justify-between gap-3">
					<Text
						className={
							isUser
								? "text-accent-foreground text-xs uppercase tracking-[1.2px]"
								: "text-muted text-xs uppercase tracking-[1.2px]"
						}
					>
						{isUser ? "Voce" : "Modelo"}
					</Text>
					<StatusBadge value={message.status} />
				</View>
				{isStreamingEmpty ? (
					<TypingIndicator />
				) : (
					<Text
						className={
							isUser
								? "text-accent-foreground text-base leading-6"
								: "text-base text-foreground leading-6"
						}
						selectable
					>
						{message.content}
					</Text>
				)}
			</View>
		</Animated.View>
	);
}

export default function ChatScreen() {
	const {
		snapshot,
		activeConversation,
		activeConversationMessages,
		createConversation,
		selectConversation,
		sendMessage,
		stopGeneration,
	} = useAppData();
	const { chatDraft: prompt, setChatDraft: setPrompt } = useAppUiStore();
	const activeModel = getActiveModel(snapshot);
	const canSend = prompt.trim().length > 0 && Boolean(activeConversation?.id);
	const accentColor = useThemeColor("accent");
	const scrollRef = useRef<ScrollView>(null);
	const isStreaming = activeConversationMessages.some(
		(m) => m.status === "streaming"
	);

	const handleNewConversation = async () => {
		const conversationId = await createConversation();
		if (conversationId) {
			router.push({
				pathname: "/chat/conversation/[conversationId]",
				params: { conversationId },
			});
		}
	};

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

	return (
		<Container className="bg-background" isScrollable={false}>
			<View className="flex-1 gap-3 px-4 pt-3 pb-3">
				{/* Header */}
				<View className="flex-row items-center justify-between gap-3">
					<View className="flex-1 gap-0.5">
						<Text className="font-semibold text-foreground text-xl">
							{activeConversation?.title ?? "Chat local"}
						</Text>
						<Text className="text-muted text-sm">
							{activeModel
								? activeModel.displayName
								: "Nenhum modelo selecionado"}
						</Text>
					</View>
					<View className="flex-row gap-2">
						{/* Conversations sheet */}
						{snapshot.conversations.length > 0 ? (
							<BottomSheet>
								<BottomSheet.Trigger asChild>
									<Button size="sm" variant="secondary">
										<Button.Label>Conversas</Button.Label>
									</Button>
								</BottomSheet.Trigger>
								<BottomSheet.Portal>
									<BottomSheet.Overlay />
									<BottomSheet.Content>
										<BottomSheet.Close />
										<BottomSheet.Title>Conversas</BottomSheet.Title>
										<View className="gap-2 pt-4">
											<Button onPress={handleNewConversation} variant="primary">
												<Button.Label>Nova conversa</Button.Label>
											</Button>
											<ListGroup>
												{snapshot.conversations.map((conversation) => (
													<ListGroup.Item
														key={conversation.id}
														onPress={async () => {
															await selectConversation(conversation.id);
															router.push({
																pathname: "/chat/conversation/[conversationId]",
																params: {
																	conversationId: conversation.id,
																},
															});
														}}
													>
														<ListGroup.ItemContent>
															<ListGroup.ItemTitle>
																{conversation.title}
															</ListGroup.ItemTitle>
															<ListGroup.ItemDescription>
																{formatRelativeTime(conversation.updatedAt)}
															</ListGroup.ItemDescription>
														</ListGroup.ItemContent>
														<ListGroup.ItemSuffix />
													</ListGroup.Item>
												))}
											</ListGroup>
										</View>
									</BottomSheet.Content>
								</BottomSheet.Portal>
							</BottomSheet>
						) : null}
						<Button onPress={handleNewConversation} size="sm" variant="primary">
							<Button.Label>Nova</Button.Label>
						</Button>
					</View>
				</View>

				{/* Messages area */}
				<View
					className="flex-1 rounded-3xl bg-surface px-4 py-4"
					style={{ borderCurve: "continuous" }}
				>
					{activeConversation ? (
						<ScrollView
							contentInsetAdjustmentBehavior="automatic"
							onContentSizeChange={() =>
								scrollRef.current?.scrollToEnd({ animated: true })
							}
							ref={scrollRef}
						>
							<View className="gap-3 pb-4">
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
							</View>
						</ScrollView>
					) : (
						<EmptyState
							description="Crie uma nova conversa para comecar."
							title="Nenhuma conversa ativa"
						/>
					)}
				</View>

				{/* Input area */}
				<View
					className="rounded-3xl bg-surface-secondary px-4 py-3"
					style={{ borderCurve: "continuous" }}
				>
					<View className="flex-row items-end gap-3">
						<View className="flex-1">
							<Input
								multiline
								numberOfLines={2}
								onChangeText={setPrompt}
								placeholder="Mensagem..."
								value={prompt}
							/>
						</View>
						{isStreaming && activeConversation ? (
							<Pressable
								onPress={() => stopGeneration(activeConversation.id)}
								style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									backgroundColor: `${accentColor}20`,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons color={accentColor} name="stop" size={18} />
							</Pressable>
						) : (
							<Pressable
								onPress={handleSend}
								style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									backgroundColor: canSend ? accentColor : "transparent",
									alignItems: "center",
									justifyContent: "center",
									opacity: canSend ? 1 : 0.3,
								}}
							>
								{isStreaming ? (
									<Spinner size="sm" />
								) : (
									<Ionicons
										color={canSend ? "#fff" : accentColor}
										name="arrow-up"
										size={20}
									/>
								)}
							</Pressable>
						)}
					</View>
				</View>
			</View>
		</Container>
	);
}
