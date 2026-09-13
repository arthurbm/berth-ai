import { Button, ListGroup } from "heroui-native";
import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import { formatRelativeTime } from "@/lib/utils/format";

interface HistoryViewProps {
	onSwitchToConversa: () => void;
}

export function HistoryView({ onSwitchToConversa }: HistoryViewProps) {
	const { snapshot, selectConversation, createConversation } = useAppData();
	const conversations = snapshot.conversations;

	const handleNewConversation = async () => {
		const id = await createConversation();
		if (id) {
			onSwitchToConversa();
		}
	};

	const handleSelectConversation = async (conversationId: string) => {
		await selectConversation(conversationId);
		onSwitchToConversa();
	};

	return (
		<View className="flex-1 gap-3">
			<Button onPress={handleNewConversation} variant="primary">
				<Button.Label>Nova conversa</Button.Label>
			</Button>

			{conversations.length > 0 ? (
				<ScrollView
					contentContainerStyle={{ gap: 0 }}
					style={{ flex: 1 }}
				>
					<ListGroup>
						{conversations.map((conversation) => (
							<ListGroup.Item
								key={conversation.id}
								onPress={() => handleSelectConversation(conversation.id)}
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
				</ScrollView>
			) : (
				<EmptyState
					description="Crie uma nova conversa para comecar."
					title="Nenhuma conversa"
				/>
			)}
		</View>
	);
}
