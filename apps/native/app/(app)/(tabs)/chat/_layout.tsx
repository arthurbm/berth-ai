import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function ChatStackLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: themeColorBackground },
				headerTintColor: themeColorForeground,
				headerTitleStyle: { color: themeColorForeground, fontWeight: "600" },
			}}
		>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="conversation/[conversationId]"
				options={{ title: "Conversa" }}
			/>
		</Stack>
	);
}
