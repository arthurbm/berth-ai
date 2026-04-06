import { Stack } from "expo-router";

export default function ApiStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: "API" }} />
			<Stack.Screen name="test" options={{ title: "Teste do endpoint" }} />
			<Stack.Screen name="requests" options={{ title: "Requests" }} />
		</Stack>
	);
}
