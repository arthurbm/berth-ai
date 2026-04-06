import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function TabsLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: themeColorBackground,
					borderTopColor: "transparent",
				},
				tabBarActiveTintColor: themeColorForeground,
				tabBarInactiveTintColor: "#8a8a8a",
			}}
		>
			<Tabs.Screen
				name="(home)"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }) => (
						<Ionicons color={color} name="home-outline" size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="models"
				options={{
					title: "Modelos",
					tabBarIcon: ({ color, size }) => (
						<Ionicons color={color} name="albums-outline" size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="chat"
				options={{
					title: "Chat",
					tabBarIcon: ({ color, size }) => (
						<Ionicons
							color={color}
							name="chatbubble-ellipses-outline"
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="api"
				options={{
					title: "API",
					tabBarIcon: ({ color, size }) => (
						<Ionicons color={color} name="code-slash-outline" size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="activity"
				options={{
					title: "Atividade",
					tabBarIcon: ({ color, size }) => (
						<Ionicons color={color} name="pulse-outline" size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
