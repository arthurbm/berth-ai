import { Surface } from "heroui-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface HeroPanelProps {
	actions?: ReactNode;
	description: string;
	eyebrow: string;
	meta?: ReactNode;
	title: string;
}

export function HeroPanel({
	eyebrow,
	title,
	description,
	meta,
	actions,
}: HeroPanelProps) {
	return (
		<Surface className="rounded-[28px] px-5 py-6" variant="secondary">
			<View className="gap-5">
				<View className="gap-2">
					<Text className="text-muted text-xs uppercase tracking-[1.8px]">
						{eyebrow}
					</Text>
					<Text className="font-semibold text-[28px] text-foreground leading-8">
						{title}
					</Text>
					<Text className="text-muted text-sm leading-6">{description}</Text>
				</View>
				{meta ? <View className="flex-row flex-wrap gap-2">{meta}</View> : null}
				{actions ? (
					<View className="flex-row flex-wrap gap-3">{actions}</View>
				) : null}
			</View>
		</Surface>
	);
}
