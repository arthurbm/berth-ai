import { Surface } from "heroui-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface EmptyStateProps {
	action?: ReactNode;
	description: string;
	title: string;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<Surface
			className="rounded-3xl px-5 py-6"
			style={{ borderCurve: "continuous" }}
			variant="secondary"
		>
			<View className="gap-2">
				<Text className="font-semibold text-foreground text-lg">{title}</Text>
				<Text className="text-muted text-sm leading-5">{description}</Text>
				{action ? <View className="pt-2">{action}</View> : null}
			</View>
		</Surface>
	);
}
