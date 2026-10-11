import { Surface } from "heroui-native";
import { Text, View } from "react-native";

interface StatCardProps {
	label: string;
	value: string;
}

export function StatCard({ label, value }: StatCardProps) {
	return (
		<Surface
			className="min-w-[100px] flex-1 rounded-2xl px-4 py-3"
			style={{ borderCurve: "continuous" }}
			variant="default"
		>
			<View className="gap-1">
				<Text className="text-muted text-xs uppercase tracking-[1.4px]">
					{label}
				</Text>
				<Text
					className="font-semibold text-foreground text-lg"
					style={{ fontVariant: ["tabular-nums"] }}
				>
					{value}
				</Text>
			</View>
		</Surface>
	);
}
