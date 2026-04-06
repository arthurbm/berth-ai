import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function AppLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Stack
			screenOptions={{
				headerTintColor: themeColorForeground,
				headerStyle: { backgroundColor: themeColorBackground },
				headerTitleStyle: { color: themeColorForeground, fontWeight: "600" },
			}}
		>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen
				name="gambi"
				options={{
					title: "Gambi",
					presentation: "formSheet",
					sheetGrabberVisible: true,
					sheetAllowedDetents: [0.85, 1.0],
				}}
			/>
			<Stack.Screen
				name="settings"
				options={{
					title: "Ajustes",
					presentation: "formSheet",
					sheetGrabberVisible: true,
					sheetAllowedDetents: [0.75, 1.0],
				}}
			/>
		</Stack>
	);
}
