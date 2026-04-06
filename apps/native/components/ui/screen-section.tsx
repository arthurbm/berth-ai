import { Separator } from "heroui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

type ScreenSectionProps = PropsWithChildren<{
	title: string;
	description?: string;
	action?: ReactNode;
	noSeparator?: boolean;
}>;

export function ScreenSection({
	title,
	description,
	action,
	children,
	noSeparator = false,
}: ScreenSectionProps) {
	return (
		<View className="gap-4">
			<View className="flex-row items-end justify-between gap-4">
				<View className="flex-1 gap-1">
					<Text className="font-semibold text-foreground text-lg">{title}</Text>
					{description ? (
						<Text className="text-muted text-sm">{description}</Text>
					) : null}
				</View>
				{action ? <View>{action}</View> : null}
			</View>
			{children}
			{noSeparator ? null : <Separator />}
		</View>
	);
}
