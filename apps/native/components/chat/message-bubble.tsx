import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { StatusBadge } from "@/components/ui/status-badge";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import type { ConversationMessage } from "@/types/app-state";

interface MessageBubbleProps {
	accentColor: string;
	message: ConversationMessage;
}

export function MessageBubble({ message, accentColor }: MessageBubbleProps) {
	const isUser = message.role === "user";
	const isStreamingEmpty = message.status === "streaming" && !message.content;

	return (
		<Animated.View entering={FadeInUp.duration(250)}>
			<View
				className={isUser ? "bg-accent" : "bg-surface-secondary"}
				style={[
					{
						alignSelf: isUser ? "flex-end" : "flex-start",
						borderCurve: "continuous",
						borderRadius: 20,
						maxWidth: isUser ? "85%" : "92%",
						paddingHorizontal: 16,
						paddingVertical: 12,
						...(isUser
							? {}
							: {
									borderLeftColor: accentColor,
									borderLeftWidth: 3,
								}),
					},
				]}
			>
				<View className="mb-1.5 flex-row items-center justify-between gap-3">
					<Text
						className={
							isUser
								? "text-accent-foreground text-xs uppercase tracking-[1.2px]"
								: "text-muted text-xs uppercase tracking-[1.2px]"
						}
					>
						{isUser ? "Voce" : "Modelo"}
					</Text>
					<StatusBadge value={message.status} />
				</View>
				{isStreamingEmpty ? (
					<TypingIndicator />
				) : (
					<Text
						className={
							isUser
								? "text-accent-foreground text-base leading-6"
								: "text-base text-foreground leading-6"
						}
						selectable
					>
						{message.content}
					</Text>
				)}
			</View>
		</Animated.View>
	);
}
