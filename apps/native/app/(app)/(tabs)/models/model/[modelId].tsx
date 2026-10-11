import { useLocalSearchParams } from "expo-router";
import { Button, Chip, Separator, Spinner, useToast } from "heroui-native";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
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
	const { toast } = useToast();
	const entry = snapshot.catalog.find((item) => item.id === modelId);

	if (!entry) {
		return (
			<Container className="px-4 py-6">
				<EmptyState
					description="Esse identificador nao existe no catalogo."
					title="Modelo nao encontrado"
				/>
			</Container>
		);
	}

	const modelState = getCatalogModelState(snapshot, entry);

	const handleDownload = async () => {
		await startDownload(entry.id);
		toast.show({ label: "Download iniciado", variant: "success" });
	};

	const handlePause = async () => {
		await pauseDownload(entry.id);
		toast.show({ label: "Download pausado", variant: "default" });
	};

	const handleRemove = async () => {
		await removeModel(entry.id);
		toast.show({ label: "Modelo removido", variant: "danger" });
	};

	const handleActivate = async () => {
		await setActiveModel(entry.id);
		toast.show({
			label: `Modelo ativo: ${entry.displayName}`,
			variant: "success",
		});
	};

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-6">
				<Animated.View entering={FadeInUp.duration(350)}>
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
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(80).duration(350)}>
					<View
						className="gap-4 rounded-[28px] bg-surface px-5 py-5"
						style={{ borderCurve: "continuous" }}
					>
						<Text className="font-semibold text-foreground text-lg">
							Operacao
						</Text>

						{modelState.localRecord?.status === "downloading" ? (
							<View className="gap-2">
								<ProgressBar
									height={6}
									progress={modelState.localRecord.progress}
								/>
								<View className="flex-row items-center gap-2">
									<Spinner size="sm" />
									<Text className="text-muted text-sm">
										{formatPercent(modelState.localRecord.progress)}
									</Text>
								</View>
							</View>
						) : null}

						<View className="gap-2">
							<Text className="text-muted text-sm">
								Device hint: {entry.minDeviceHint}
							</Text>
							<Text className="text-muted text-sm">
								{modelState.localRecord
									? `Ultimo uso ${formatRelativeTime(modelState.localRecord.lastUsedAt)}`
									: "Ainda nao baixado neste device."}
							</Text>
							{modelState.localRecord ? (
								<Text
									className="text-muted text-sm"
									style={{ fontVariant: ["tabular-nums"] }}
								>
									Armazenamento:{" "}
									{formatBytes(modelState.localRecord.bytesOnDisk)}
								</Text>
							) : null}
						</View>

						<Separator />

						<View className="flex-row flex-wrap gap-3">
							{modelState.status === "downloading" ? (
								<Button onPress={handlePause} variant="secondary">
									<Button.Label>Pausar download</Button.Label>
								</Button>
							) : (
								<Button onPress={handleDownload} variant="primary">
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
								<Button onPress={handleActivate} variant="secondary">
									<Button.Label>Definir como ativo</Button.Label>
								</Button>
							) : null}

							{modelState.localRecord ? (
								<Button onPress={handleRemove} variant="danger-soft">
									<Button.Label>Remover modelo</Button.Label>
								</Button>
							) : null}
						</View>
					</View>
				</Animated.View>
			</View>
		</Container>
	);
}
