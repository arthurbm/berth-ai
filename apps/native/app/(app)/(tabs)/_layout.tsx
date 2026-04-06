import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="(node)">
				<NativeTabs.Trigger.Icon sf="cpu" md="memory" />
				<NativeTabs.Trigger.Label>Node</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="models">
				<NativeTabs.Trigger.Icon sf="cube" md="deployed_code" />
				<NativeTabs.Trigger.Label>Modelos</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="chat">
				<NativeTabs.Trigger.Icon sf="message" md="chat" />
				<NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
