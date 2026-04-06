import { router } from "expo-router";
import { Button, Card, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import {
	formatBytes,
	formatPercent,
	formatRelativeTime,
} from "@/lib/utils/format";
import { getCatalogModelState } from "@/lib/utils/selectors";

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

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
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
					description="Catálogo curado no app, pronto para downloads leves e estado persistido com Drizzle + Expo SQLite."
					title="Biblioteca local"
				>
					{installedModels.length > 0 ? (
						<View className="gap-3">
							{installedModels.map(({ entry, localRecord, isActive }) =>
								localRecord ? (
									<Card
										className="rounded-[24px]"
										key={entry.id}
										onTouchEnd={() =>
											router.push({
												pathname: "/models/model/[modelId]",
												params: { modelId: entry.id },
											})
										}
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

											<View className="flex-row flex-wrap gap-2">
												<Chip size="sm" variant="soft">
													<Chip.Label>{entry.sizeLabel}</Chip.Label>
												</Chip>
												<Chip size="sm" variant="soft">
													<Chip.Label>
														{formatBytes(localRecord.bytesOnDisk)}
													</Chip.Label>
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
														? formatPercent(localRecord.progress)
														: `Último uso ${formatRelativeTime(localRecord.lastUsedAt)}`}
												</Text>
												{!isActive &&
												(localRecord.status === "ready" ||
													localRecord.status === "in_use") ? (
													<Button
														onPress={() => setActiveModel(entry.id)}
														size="sm"
														variant="secondary"
													>
														<Button.Label>Ativar</Button.Label>
													</Button>
												) : null}
											</View>
										</Card.Body>
									</Card>
								) : null
							)}
						</View>
					) : (
						<EmptyState
							description="Baixe um modelo recomendado para liberar chat, logs e teste do provider."
							title="Nenhum modelo local ainda"
						/>
					)}
				</ScreenSection>

				<ScreenSection
					description="O app começa pequeno, com capacidades e peso claros."
					title="Catálogo curado"
				>
					<View className="gap-3">
						{snapshot.catalog.map((entry) => {
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
								<Card
									className="rounded-[24px] border border-border px-4"
									key={id}
									onTouchEnd={() =>
										router.push({
											pathname: "/models/model/[modelId]",
											params: { modelId: id },
										})
									}
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
							);
						})}
					</View>
				</ScreenSection>

				<ScreenSection
					description="Uso total persistido no device."
					noSeparator
					title="Footprint local"
				>
					<View className="rounded-[24px] bg-surface px-4 py-4">
						<Text className="text-muted text-xs uppercase tracking-[1.6px]">
							Espaço ocupado
						</Text>
						<Text className="mt-1 font-semibold text-2xl text-foreground">
							{formatBytes(installedStorageBytes)}
						</Text>
						<Text className="mt-1 text-muted text-sm">
							{snapshot.localModels.length} modelos rastreados na base local.
						</Text>
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
