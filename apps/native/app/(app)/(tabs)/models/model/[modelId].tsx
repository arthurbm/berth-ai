import { useLocalSearchParams } from "expo-router";
import { Button, Chip, Separator } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import {
	formatBytes,
	formatPercent,
	formatRelativeTime,
} from "@/lib/utils/format";
import { getCatalogModelState } from "@/lib/utils/selectors";

export default function ModelDetailScreen() {
	const { modelId } = useLocalSearchParams<{ modelId: string }>();
	const {
		snapshot,
		startDownload,
		pauseDownload,
		removeModel,
		setActiveModel,
	} = useAppData();
	const entry = snapshot.catalog.find((item) => item.id === modelId);

	if (!entry) {
		return (
			<Container className="px-4 py-6">
				<EmptyState
					description="Esse identificador não existe no catálogo local."
					title="Modelo não encontrado"
				/>
			</Container>
		);
	}

	const modelState = getCatalogModelState(snapshot, entry);

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-6">
				<View className="gap-3">
					<View className="flex-row items-start justify-between gap-4">
						<View className="flex-1 gap-1">
							<Text className="font-semibold text-3xl text-foreground">
								{entry.displayName}
							</Text>
							<Text className="text-muted text-sm leading-6">
								{entry.summary}
							</Text>
						</View>
						<StatusBadge value={modelState.status} />
					</View>

					<View className="flex-row flex-wrap gap-2">
						<Chip size="sm" variant="soft">
							<Chip.Label>{entry.runtimeFamily}</Chip.Label>
						</Chip>
						<Chip size="sm" variant="soft">
							<Chip.Label>{entry.sizeLabel}</Chip.Label>
						</Chip>
						<Chip size="sm" variant="soft">
							<Chip.Label>{entry.source}</Chip.Label>
						</Chip>
					</View>
				</View>

				<View className="gap-4 rounded-[28px] bg-surface px-5 py-5">
					<Text className="font-semibold text-foreground text-lg">
						Operação
					</Text>
					<View className="gap-2">
						<Text className="text-muted text-sm">
							Device hint: {entry.minDeviceHint}
						</Text>
						<Text className="text-muted text-sm">
							{modelState.localRecord
								? `Progresso ${formatPercent(modelState.localRecord.progress)} • Último uso ${formatRelativeTime(modelState.localRecord.lastUsedAt)}`
								: "Ainda não baixado neste device."}
						</Text>
						{modelState.localRecord ? (
							<Text className="text-muted text-sm">
								Bytes locais: {formatBytes(modelState.localRecord.bytesOnDisk)}
							</Text>
						) : null}
					</View>

					<Separator />

					<View className="flex-row flex-wrap gap-3">
						{modelState.status === "downloading" ? (
							<Button
								onPress={() => pauseDownload(entry.id)}
								variant="secondary"
							>
								<Button.Label>Pausar download</Button.Label>
							</Button>
						) : (
							<Button onPress={() => startDownload(entry.id)} variant="primary">
								<Button.Label>
									{modelState.status === "paused"
										? "Retomar download"
										: "Baixar no device"}
								</Button.Label>
							</Button>
						)}

						{(modelState.status === "ready" ||
							modelState.status === "in_use") &&
						!modelState.isActive ? (
							<Button
								onPress={() => setActiveModel(entry.id)}
								variant="secondary"
							>
								<Button.Label>Definir como ativo</Button.Label>
							</Button>
						) : null}

						{modelState.localRecord ? (
							<Button
								onPress={() => removeModel(entry.id)}
								variant="danger-soft"
							>
								<Button.Label>Remover modelo</Button.Label>
							</Button>
						) : null}
					</View>
				</View>
			</View>
		</Container>
	);
}
