import { Stack } from "expo-router";

export default function ActivityStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: "Atividade" }} />
			<Stack.Screen
				name="request/[requestId]"
				options={{ title: "Detalhe da request" }}
			/>
		</Stack>
	);
}
