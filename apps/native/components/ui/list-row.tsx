import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ListRowProps {
	detail?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	onPress?: () => void;
	subtitle?: string;
	title: string;
	trailing?: ReactNode;
}

export function ListRow({
	title,
	subtitle,
	detail,
	icon = "chevron-forward",
	onPress,
	trailing,
}: ListRowProps) {
	const content = (
		<View className="flex-row items-center gap-3 rounded-3xl px-1 py-3">
			<View className="flex-1 gap-1">
				<Text className="font-medium text-base text-foreground">{title}</Text>
				{subtitle ? (
					<Text className="text-muted text-sm leading-5">{subtitle}</Text>
				) : null}
			</View>
			{detail ? <Text className="text-muted text-xs">{detail}</Text> : null}
			{trailing ?? <Ionicons color="#7c7c7c" name={icon} size={16} />}
		</View>
	);

	if (!onPress) {
		return content;
	}

	return <Pressable onPress={onPress}>{content}</Pressable>;
}
