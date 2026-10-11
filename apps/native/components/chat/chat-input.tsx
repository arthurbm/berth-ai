import { Ionicons } from "@expo/vector-icons";
import { Input } from "heroui-native";
import { Pressable, View } from "react-native";

interface ChatInputProps {
	accentColor: string;
	canSend: boolean;
	isStreaming: boolean;
	onSend: () => void;
	onStop: () => void;
	prompt: string;
	setPrompt: (value: string) => void;
}

export function ChatInput({
	prompt,
	setPrompt,
	onSend,
	onStop,
	canSend,
	isStreaming,
	accentColor,
}: ChatInputProps) {
	return (
		<View
			className="rounded-3xl bg-surface-secondary px-4 py-3"
			style={{ borderCurve: "continuous" }}
		>
			<View className="flex-row items-end gap-3">
				<View className="flex-1">
					<Input
						multiline
						numberOfLines={2}
						onChangeText={setPrompt}
						placeholder="Mensagem..."
						value={prompt}
					/>
				</View>
				{isStreaming ? (
					<Pressable
						onPress={onStop}
						style={{
							alignItems: "center",
							backgroundColor: `${accentColor}20`,
							borderRadius: 20,
							height: 40,
							justifyContent: "center",
							width: 40,
						}}
					>
						<Ionicons color={accentColor} name="stop" size={18} />
					</Pressable>
				) : (
					<Pressable
						onPress={onSend}
						style={{
							alignItems: "center",
							backgroundColor: canSend ? accentColor : "transparent",
							borderRadius: 20,
							height: 40,
							justifyContent: "center",
							opacity: canSend ? 1 : 0.3,
							width: 40,
						}}
					>
						<Ionicons
							color={canSend ? "#fff" : accentColor}
							name="arrow-up"
							size={20}
						/>
					</Pressable>
				)}
			</View>
		</View>
	);
}
