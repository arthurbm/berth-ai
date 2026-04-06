import { router } from "expo-router";
import {
	Button,
	Card,
	Chip,
	Skeleton,
	SkeletonGroup,
	Spinner,
} from "heroui-native";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import {
	formatBytes,
	formatPercent,
	formatRelativeTime,
} from "@/lib/utils/format";
import { getCatalogModelState } from "@/lib/utils/selectors";
import type { LocalModelRecord, ModelCatalogEntry } from "@/types/app-state";

function InstalledModelCard({
	entry,
	localRecord,
	isActive,
	index,
	onActivate,
}: {
	entry: ModelCatalogEntry;
	localRecord: LocalModelRecord;
	isActive: boolean;
	index: number;
	onActivate: (id: string) => void;
}) {
	return (
		<Animated.View
			entering={FadeInUp.delay(index * 60).duration(350)}
			key={entry.id}
		>
			<Card
				className="rounded-3xl"
				onTouchEnd={() =>
					router.push({
						pathname: "/models/model/[modelId]",
						params: { modelId: entry.id },
					})
				}
				style={{ borderCurve: "continuous" }}
				variant="secondary"
			>
				<Card.Body className="gap-4">
					<View className="flex-row items-start justify-between gap-4">
						<View className="flex-1 gap-1">
							<Card.Title>{entry.displayName}</Card.Title>
							<Card.Description>{entry.summary}</Card.Description>
						</View>
						<StatusBadge value={localRecord.status} />
					</View>

					{localRecord.status === "downloading" ? (
						<View className="gap-2">
							<ProgressBar progress={localRecord.progress} />
							<View className="flex-row items-center gap-2">
								<Spinner size="sm" />
								<Text className="text-muted text-sm">
									{formatPercent(localRecord.progress)}
								</Text>
							</View>
						</View>
					) : null}

					<View className="flex-row flex-wrap gap-2">
						<Chip size="sm" variant="soft">
							<Chip.Label>{entry.sizeLabel}</Chip.Label>
						</Chip>
						<Chip size="sm" variant="soft">
							<Chip.Label>{formatBytes(localRecord.bytesOnDisk)}</Chip.Label>
						</Chip>
						{isActive ? (
							<Chip color="accent" size="sm" variant="soft">
								<Chip.Label>Ativo</Chip.Label>
							</Chip>
						) : null}
					</View>

					<View className="flex-row items-center justify-between">
						<Text className="text-muted text-sm">
							{localRecord.status === "downloading"
								? "Baixando..."
								: `Ultimo uso ${formatRelativeTime(localRecord.lastUsedAt)}`}
						</Text>
						{!isActive &&
						(localRecord.status === "ready" ||
							localRecord.status === "in_use") ? (
							<Button
								onPress={() => onActivate(entry.id)}
								size="sm"
								variant="secondary"
							>
								<Button.Label>Ativar</Button.Label>
							</Button>
						) : null}
					</View>
				</Card.Body>
			</Card>
		</Animated.View>
	);
}

export default function ModelsScreen() {
	const {
		snapshot,
		installedStorageBytes,
		startDownload,
		pauseDownload,
		setActiveModel,
	} = useAppData();
	const installedModels = snapshot.catalog
		.map((entry) => getCatalogModelState(snapshot, entry))
		.filter((item) => item.localRecord);

	if (!snapshot.isHydrated) {
		return (
			<Container className="px-4 pb-8">
				<View className="gap-6 py-6">
					<SkeletonGroup isLoaded={false}>
						<Skeleton className="h-32 w-full rounded-3xl" />
						<Skeleton className="h-32 w-full rounded-3xl" />
						<Skeleton className="h-32 w-full rounded-3xl" />
					</SkeletonGroup>
				</View>
			</Container>
		);
	}

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<Animated.View entering={FadeInUp.duration(350)}>
					<ScreenSection
						action={
							<Button
								onPress={() => router.push("/models/storage")}
								size="sm"
								variant="secondary"
							>
								<Button.Label>Storage</Button.Label>
							</Button>
						}
						description="Modelos disponiveis para rodar no seu device."
						title="Biblioteca local"
					>
						{installedModels.length > 0 ? (
							<View className="gap-3">
								{installedModels.map(
									({ entry, localRecord, isActive }, index) =>
										localRecord ? (
											<InstalledModelCard
												entry={entry}
												index={index}
												isActive={isActive}
												key={entry.id}
												localRecord={localRecord}
												onActivate={setActiveModel}
											/>
										) : null
								)}
							</View>
						) : (
							<EmptyState
								description="Baixe um modelo para habilitar chat e provider."
								title="Nenhum modelo local"
							/>
						)}
					</ScreenSection>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(100).duration(350)}>
					<ScreenSection
						description="Modelos curados para inferencia on-device."
						title="Catalogo"
					>
						<View className="gap-3">
							{snapshot.catalog.map((entry, index) => {
								const {
									id,
									displayName,
									sizeLabel,
									summary,
									recommended,
									capabilities,
								} = entry;
								const modelState = getCatalogModelState(snapshot, entry);

								return (
									<Animated.View
										entering={FadeInUp.delay(
											(index + installedModels.length) * 60
										).duration(350)}
										key={id}
									>
										<Card
											className="rounded-3xl border border-border px-4"
											onTouchEnd={() =>
												router.push({
													pathname: "/models/model/[modelId]",
													params: { modelId: id },
												})
											}
											style={{ borderCurve: "continuous" }}
											variant="transparent"
										>
											<Card.Body className="gap-4 py-4">
												<View className="flex-row items-start justify-between gap-4">
													<View className="flex-1 gap-1">
														<Card.Title>{displayName}</Card.Title>
														<Card.Description>{summary}</Card.Description>
													</View>
													<StatusBadge value={modelState.status} />
												</View>

												{modelState.localRecord?.status === "downloading" ? (
													<ProgressBar
														progress={modelState.localRecord.progress}
													/>
												) : null}

												<View className="flex-row flex-wrap gap-2">
													<Chip size="sm" variant="soft">
														<Chip.Label>{sizeLabel}</Chip.Label>
													</Chip>
													{recommended ? (
														<Chip color="accent" size="sm" variant="soft">
															<Chip.Label>Recomendado</Chip.Label>
														</Chip>
													) : null}
													{capabilities.map((capability) => (
														<Chip
															color="default"
															key={capability}
															size="sm"
															variant="soft"
														>
															<Chip.Label>{capability}</Chip.Label>
														</Chip>
													))}
												</View>
												<View className="flex-row gap-3">
													{modelState.status === "downloading" ? (
														<Button
															onPress={() => pauseDownload(id)}
															size="sm"
															variant="secondary"
														>
															<Button.Label>Pausar</Button.Label>
														</Button>
													) : (
														<Button
															onPress={() => startDownload(id)}
															size="sm"
															variant="primary"
														>
															<Button.Label>
																{modelState.status === "paused"
																	? "Retomar download"
																	: "Baixar"}
															</Button.Label>
														</Button>
													)}
												</View>
											</Card.Body>
										</Card>
									</Animated.View>
								);
							})}
						</View>
					</ScreenSection>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(200).duration(350)}>
					<ScreenSection
						description="Espaco ocupado pelos modelos baixados."
						noSeparator
						title="Footprint local"
					>
						<View
							className="rounded-3xl bg-surface px-4 py-4"
							style={{ borderCurve: "continuous" }}
						>
							<Text className="text-muted text-xs uppercase tracking-[1.6px]">
								Espaco ocupado
							</Text>
							<Text
								className="mt-1 font-semibold text-2xl text-foreground"
								style={{ fontVariant: ["tabular-nums"] }}
							>
								{formatBytes(installedStorageBytes)}
							</Text>
							<Text className="mt-1 text-muted text-sm">
								{snapshot.localModels.length} modelos rastreados.
							</Text>
						</View>
					</ScreenSection>
				</Animated.View>
			</View>
		</Container>
	);
}
