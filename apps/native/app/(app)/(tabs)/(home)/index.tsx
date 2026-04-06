import { router } from "expo-router";
import { Button, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { HeroPanel } from "@/components/ui/hero-panel";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import { formatRelativeTime } from "@/lib/utils/format";
import { getActiveModel } from "@/lib/utils/selectors";

export default function HomeScreen() {
	const { snapshot, installedStorageBytes, hydrateError } = useAppData();
	const activeModel = getActiveModel(snapshot);
	const latestLog = snapshot.requestLogs[0] ?? null;

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<HeroPanel
					actions={
						<>
							<Button onPress={() => router.push("/models")} variant="primary">
								<Button.Label>
									{activeModel ? "Gerenciar modelos" : "Baixar primeiro modelo"}
								</Button.Label>
							</Button>
							<Button onPress={() => router.push("/api")} variant="secondary">
								<Button.Label>Abrir API</Button.Label>
							</Button>
						</>
					}
					description={
						activeModel
							? "O mesmo adapter alimenta o chat local e o provider Open Responses, com token e visibilidade operacional no app."
							: "Baixe um modelo, valide o chat local e só então ligue a camada de provider. A app foi organizada para deixar esse estado sempre explícito."
					}
					eyebrow="Provider local mobile"
					meta={
						<>
							<StatusBadge value={snapshot.endpointStatus} />
							<Chip color="default" size="sm" variant="soft">
								<Chip.Label>
									{snapshot.providerRuntime.transportLabel}
								</Chip.Label>
							</Chip>
							<Chip color="default" size="sm" variant="soft">
								<Chip.Label>{`${snapshot.localModels.length} modelos locais`}</Chip.Label>
							</Chip>
						</>
					}
					title={
						activeModel
							? activeModel.displayName
							: "Seu endpoint local ainda não foi armado"
					}
				/>

				<ScreenSection
					description="O Home resume o modo da app antes de você entrar no chat ou expor o endpoint."
					title="Estado operacional"
				>
					<View className="gap-4">
						<View className="flex-row flex-wrap gap-3">
							<View className="min-w-[148px] flex-1 gap-1 rounded-[24px] bg-surface px-4 py-4">
								<Text className="text-muted text-xs uppercase tracking-[1.6px]">
									Modelo ativo
								</Text>
								<Text className="font-semibold text-base text-foreground">
									{activeModel?.displayName ?? "Nenhum"}
								</Text>
							</View>
							<View className="min-w-[148px] flex-1 gap-1 rounded-[24px] bg-surface px-4 py-4">
								<Text className="text-muted text-xs uppercase tracking-[1.6px]">
									Provider
								</Text>
								<Text className="font-semibold text-base text-foreground">
									{snapshot.providerSettings.enabled ? "Ligado" : "Desligado"}
								</Text>
							</View>
						</View>

						<View className="gap-2 rounded-[24px] bg-surface px-4 py-4">
							<Text className="text-muted text-xs uppercase tracking-[1.6px]">
								Descoberta
							</Text>
							<Text
								className="font-medium text-base text-foreground"
								selectable
							>
								{snapshot.providerRuntime.baseUrl}
							</Text>
							<Text className="text-muted text-sm">
								Token obrigatório por padrão. Storage local atual:{" "}
								{installedStorageBytes} bytes.
							</Text>
						</View>
					</View>
				</ScreenSection>

				<ScreenSection
					description="Uma visão curta do que mudou desde o último uso."
					noSeparator
					title="Leituras rápidas"
				>
					<View className="gap-3">
						<View className="rounded-[24px] bg-surface px-4 py-4">
							<Text className="text-muted text-xs uppercase tracking-[1.6px]">
								Última request
							</Text>
							<Text className="mt-1 font-medium text-base text-foreground">
								{latestLog?.summary ?? "Nenhum request registrado ainda."}
							</Text>
							<Text className="mt-2 text-muted text-sm">
								{latestLog
									? formatRelativeTime(latestLog.createdAt)
									: "Ative o chat ou teste a API."}
							</Text>
						</View>
						{hydrateError ? (
							<View className="rounded-[24px] bg-danger/10 px-4 py-4">
								<Text className="font-medium text-foreground">
									Falha ao carregar o estado local
								</Text>
								<Text className="mt-1 text-muted text-sm" selectable>
									{hydrateError}
								</Text>
							</View>
						) : null}
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
