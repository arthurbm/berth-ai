import { Stack } from "expo-router";

export default function ChatStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: "Chat" }} />
			<Stack.Screen
				name="conversation/[conversationId]"
				options={{ title: "Conversa" }}
			/>
		</Stack>
	);
}
