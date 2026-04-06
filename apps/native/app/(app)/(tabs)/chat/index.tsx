import { router } from "expo-router";
import { Button, Description, Input, Label, TextField } from "heroui-native";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import { getActiveModel } from "@/lib/utils/selectors";
import { useAppUiStore } from "@/stores/app-ui-store";

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

		const nextPrompt = prompt;
		setPrompt("");
		await sendMessage({
			conversationId: activeConversation.id,
			prompt: nextPrompt,
		});
	};

	return (
		<Container className="bg-background" isScrollable={false}>
			<View className="flex-1 gap-4 px-4 pt-4 pb-4">
				<View className="gap-3">
					<View className="flex-row items-center justify-between gap-3">
						<View className="gap-1">
							<Text className="font-semibold text-2xl text-foreground">
								{activeConversation?.title ?? "Chat local"}
							</Text>
							<Text className="text-muted text-sm">
								{activeModel
									? `Executando em ${activeModel.displayName}.`
									: "Escolha um modelo pronto antes de abrir uma thread."}
							</Text>
						</View>
						<Button
							onPress={handleNewConversation}
							size="sm"
							variant="secondary"
						>
							<Button.Label>Nova conversa</Button.Label>
						</Button>
					</View>

					{snapshot.conversations.length > 0 ? (
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<View className="flex-row gap-2">
								{snapshot.conversations.map((conversation) => (
									<Button
										key={conversation.id}
										onPress={async () => {
											await selectConversation(conversation.id);
											router.push({
												pathname: "/chat/conversation/[conversationId]",
												params: { conversationId: conversation.id },
											});
										}}
										size="sm"
										variant={
											conversation.id === activeConversation?.id
												? "primary"
												: "secondary"
										}
									>
										<Button.Label>{conversation.title}</Button.Label>
									</Button>
								))}
							</View>
						</ScrollView>
					) : null}
				</View>

				<View className="flex-1 rounded-[28px] bg-surface px-4 py-4">
					{activeConversation ? (
						<ScrollView contentInsetAdjustmentBehavior="automatic">
							<View className="gap-4 pb-6">
								{activeConversationMessages.map((message) => (
									<View
										className={
											message.role === "user"
												? "max-w-[88%] self-end rounded-[24px] bg-accent px-4 py-3"
												: "max-w-[92%] rounded-[24px] bg-surface-secondary px-4 py-3"
										}
										key={message.id}
									>
										<View className="mb-2 flex-row items-center justify-between gap-3">
											<Text
												className={
													message.role === "user"
														? "text-accent-foreground text-xs uppercase tracking-[1.4px]"
														: "text-muted text-xs uppercase tracking-[1.4px]"
												}
											>
												{message.role === "user" ? "Você" : "Modelo"}
											</Text>
											<StatusBadge value={message.status} />
										</View>
										<Text
											className={
												message.role === "user"
													? "text-accent-foreground text-base leading-6"
													: "text-base text-foreground leading-6"
											}
											selectable
										>
											{message.content || "Gerando..."}
										</Text>
									</View>
								))}

								{activeConversationMessages.length === 0 ? (
									<EmptyState
										description="O chat usa o mesmo adapter canônico que depois valida o contrato de Responses."
										title="Thread pronta para o primeiro prompt"
									/>
								) : null}
							</View>
						</ScrollView>
					) : (
						<EmptyState
							description="Crie uma thread nova ou selecione um histórico para continuar."
							title="Nenhuma conversa ativa"
						/>
					)}
				</View>

				<View className="gap-3 rounded-[28px] bg-surface-secondary px-4 py-4">
					<TextField>
						<Label>Prompt local</Label>
						<Input
							multiline
							numberOfLines={3}
							onChangeText={setPrompt}
							placeholder="Descreva o que o modelo deve responder"
							value={prompt}
						/>
						<Description>
							O streaming incrementa a mensagem do assistente e grava a sessão
							no banco local.
						</Description>
					</TextField>

					<View className="flex-row gap-3">
						<Button
							isDisabled={!canSend}
							onPress={handleSend}
							variant="primary"
						>
							<Button.Label>Enviar</Button.Label>
						</Button>
						{activeConversation ? (
							<Button
								onPress={() => stopGeneration(activeConversation.id)}
								variant="tertiary"
							>
								<Button.Label>Parar geração</Button.Label>
							</Button>
						) : null}
					</View>
				</View>
			</View>
		</Container>
	);
}
