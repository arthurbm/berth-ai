import { useLocalSearchParams } from "expo-router";
import { Chip } from "heroui-native";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { MonospaceText } from "@/components/ui/monospace-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";

export default function RequestDetailScreen() {
	const { requestId } = useLocalSearchParams<{ requestId: string }>();
	const { snapshot } = useAppData();
	const requestLog = snapshot.requestLogs.find((item) => item.id === requestId);

	if (!requestLog) {
		return (
			<Container className="px-4 py-6">
				<EmptyState
					description="Esse item ja foi limpo ou nao existe."
					title="Request nao encontrada"
				/>
			</Container>
		);
	}

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-6">
				<Animated.View entering={FadeInUp.duration(350)}>
					<View className="flex-row items-center justify-between gap-4">
						<View className="flex-1 gap-1">
							<Text className="font-semibold text-2xl text-foreground">
								{requestLog.summary}
							</Text>
							<Text className="text-muted text-sm">{requestLog.source}</Text>
						</View>
						<StatusBadge value={requestLog.status} />
					</View>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(80).duration(350)}>
					<View
						className="gap-4 rounded-[28px] bg-surface px-5 py-5"
						style={{ borderCurve: "continuous" }}
					>
						<View className="flex-row flex-wrap gap-2">
							<Chip size="sm" variant="soft">
								<Chip.Label>{requestLog.method}</Chip.Label>
							</Chip>
							<Chip size="sm" variant="soft">
								<Chip.Label>{requestLog.endpoint}</Chip.Label>
							</Chip>
							<Chip size="sm" variant="soft">
								<Chip.Label
									style={{ fontVariant: ["tabular-nums"] }}
								>{`${requestLog.latencyMs} ms`}</Chip.Label>
							</Chip>
						</View>

						<MonospaceText className="text-base text-foreground leading-6">
							{requestLog.responsePreview ??
								requestLog.errorMessage ??
								"Sem payload armazenado."}
						</MonospaceText>
					</View>
				</Animated.View>
			</View>
		</Container>
	);
}
