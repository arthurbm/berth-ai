import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import { Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Drawer
			screenOptions={{
				headerTintColor: themeColorForeground,
				headerStyle: { backgroundColor: themeColorBackground },
				headerTitleStyle: { color: themeColorForeground, fontWeight: "600" },
				drawerStyle: { backgroundColor: themeColorBackground },
				headerRight: () => <ThemeToggle />,
			}}
		>
			<Drawer.Screen
				name="(tabs)"
				options={{
					title: "Workspace",
					headerShown: false,
					drawerLabel: ({ focused, color }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Workspace
						</Text>
					),
					drawerIcon: ({ focused, color, size }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="grid-outline"
							size={size}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="gambi"
				options={{
					title: "Gambi",
					drawerLabel: ({ focused, color }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Gambi
						</Text>
					),
					drawerIcon: ({ focused, color, size }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="planet-outline"
							size={size}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="settings"
				options={{
					title: "Ajustes",
					drawerLabel: ({ focused, color }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Ajustes
						</Text>
					),
					drawerIcon: ({ focused, color, size }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="settings-outline"
							size={size}
						/>
					),
				}}
			/>
		</Drawer>
	);
}
