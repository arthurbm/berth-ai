import { Ionicons } from "@expo/vector-icons";
import { Input, Spinner } from "heroui-native";
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
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: `${accentColor}20`,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Ionicons color={accentColor} name="stop" size={18} />
					</Pressable>
				) : (
					<Pressable
						onPress={onSend}
						style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: canSend ? accentColor : "transparent",
							alignItems: "center",
							justifyContent: "center",
							opacity: canSend ? 1 : 0.3,
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
