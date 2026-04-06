import { useLocalSearchParams } from "expo-router";
import { Chip } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
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
					description="Esse item já foi limpo ou não existe."
					title="Request não encontrada"
				/>
			</Container>
		);
	}

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-6">
				<View className="flex-row items-center justify-between gap-4">
					<View className="flex-1 gap-1">
						<Text className="font-semibold text-2xl text-foreground">
							{requestLog.summary}
						</Text>
						<Text className="text-muted text-sm">{requestLog.source}</Text>
					</View>
					<StatusBadge value={requestLog.status} />
				</View>

				<View className="gap-4 rounded-[28px] bg-surface px-5 py-5">
					<View className="flex-row flex-wrap gap-2">
						<Chip size="sm" variant="soft">
							<Chip.Label>{requestLog.method}</Chip.Label>
						</Chip>
						<Chip size="sm" variant="soft">
							<Chip.Label>{requestLog.endpoint}</Chip.Label>
						</Chip>
						<Chip size="sm" variant="soft">
							<Chip.Label>{`${requestLog.latencyMs} ms`}</Chip.Label>
						</Chip>
					</View>

					<Text className="text-base text-foreground leading-6" selectable>
						{requestLog.responsePreview ??
							requestLog.errorMessage ??
							"Sem payload armazenado."}
					</Text>
				</View>
			</View>
		</Container>
	);
}
