import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function AppLayout() {
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
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen
				name="gambi"
				options={{
					presentation: "formSheet",
					sheetAllowedDetents: [0.85, 1.0],
					sheetGrabberVisible: true,
					title: "Gambi",
				}}
			/>
			<Stack.Screen
				name="settings"
				options={{
					presentation: "formSheet",
					sheetAllowedDetents: [0.75, 1.0],
					sheetGrabberVisible: true,
					title: "Ajustes",
				}}
			/>
		</Stack>
	);
}
