import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";
import { useAppUiStore } from "@/stores/app-ui-store";

export default function ApiTestScreen() {
	const { snapshot } = useAppData();
	const { lastProviderTest } = useAppUiStore();
	const latestApiLog =
		snapshot.requestLogs.find((log) => log.source === "app-api-test") ?? null;

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<ScreenSection
					description="O app registra o teste usando o mesmo formato de atividade que o restante do provider."
					noSeparator
					title="Último teste"
				>
					{latestApiLog ? (
						<View className="gap-4 rounded-[28px] bg-surface px-5 py-5">
							<Text className="font-semibold text-foreground text-lg">
								{latestApiLog.summary}
							</Text>
							<Text className="text-muted text-sm leading-6" selectable>
								{latestApiLog.responsePreview ??
									latestApiLog.errorMessage ??
									lastProviderTest?.responsePreview ??
									lastProviderTest?.errorMessage ??
									"Sem preview disponível."}
							</Text>
							<Text className="text-muted text-sm">
								{latestApiLog.method} {latestApiLog.endpoint} •{" "}
								{latestApiLog.latencyMs} ms
							</Text>
						</View>
					) : (
						<EmptyState
							description="Volte para a tela de API e rode o primeiro teste para validar health, token e modelo ativo."
							title="Nenhum teste executado"
						/>
					)}
				</ScreenSection>
			</View>
		</Container>
	);
}
