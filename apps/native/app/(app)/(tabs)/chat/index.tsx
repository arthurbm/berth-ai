import { Tabs } from "heroui-native";
import { Text, View } from "react-native";

import { ChatView } from "@/components/chat/chat-view";
import { HistoryView } from "@/components/chat/history-view";
import { Container } from "@/components/container";
import { useAppData } from "@/hooks/use-app-data";
import { getActiveModel } from "@/lib/utils/selectors";
import { useAppUiStore } from "@/stores/app-ui-store";

export default function ChatScreen() {
	const { snapshot, activeConversation } = useAppData();
	const activeModel = getActiveModel(snapshot);
	const { chatActiveSegment, setChatActiveSegment } = useAppUiStore();

	const switchToConversa = () => setChatActiveSegment("conversa");

	const handleSegmentChange = (value: string) => {
		if (value === "conversa" || value === "historico") {
			setChatActiveSegment(value);
		}
	};

	return (
		<Container
			className="bg-background"
			isScrollable={false}
			style={{ paddingBottom: 0 }}
		>
			<View className="flex-1 gap-3 px-4 pt-3 pb-3">
				{/* Header */}
				<View className="gap-0.5">
					<Text className="font-semibold text-foreground text-xl">
						{activeConversation?.title ?? "Chat local"}
					</Text>
					<Text className="text-muted text-sm">
						{activeModel
							? activeModel.displayName
							: "Nenhum modelo selecionado"}
					</Text>
				</View>

				{/* Segmented control + content */}
				<Tabs
					className="flex-1"
					onValueChange={handleSegmentChange}
					value={chatActiveSegment}
				>
					<Tabs.List>
						<Tabs.Trigger className="flex-1" value="conversa">
							<Tabs.Label>Conversa</Tabs.Label>
						</Tabs.Trigger>
						<Tabs.Separator betweenValues={["conversa", "historico"]} />
						<Tabs.Trigger className="flex-1" value="historico">
							<Tabs.Label>Historico</Tabs.Label>
						</Tabs.Trigger>
						<Tabs.Indicator />
					</Tabs.List>

					<Tabs.Content className="flex-1" value="conversa">
						<ChatView />
					</Tabs.Content>

					<Tabs.Content className="flex-1" value="historico">
						<HistoryView onSwitchToConversa={switchToConversa} />
					</Tabs.Content>
				</Tabs>
			</View>
		</Container>
	);
}
