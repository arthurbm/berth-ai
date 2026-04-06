import { Stack } from "expo-router";

export default function ModelsStackLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: "Modelos" }} />
			<Stack.Screen name="storage" options={{ title: "Armazenamento" }} />
			<Stack.Screen
				name="model/[modelId]"
				options={{ title: "Detalhe do modelo" }}
			/>
		</Stack>
	);
}
