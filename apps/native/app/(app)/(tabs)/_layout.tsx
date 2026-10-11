import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="(node)">
				<NativeTabs.Trigger.Icon md="memory" sf="cpu" />
				<NativeTabs.Trigger.Label>Node</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="models">
				<NativeTabs.Trigger.Icon md="deployed_code" sf="cube" />
				<NativeTabs.Trigger.Label>Modelos</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="chat">
				<NativeTabs.Trigger.Icon md="chat" sf="message" />
				<NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
