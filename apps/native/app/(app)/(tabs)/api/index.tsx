import { router } from "expo-router";
import { Button, Chip, Separator } from "heroui-native";
import { Alert, Text, View } from "react-native";

import { Container } from "@/components/container";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import { getActiveModel } from "@/lib/utils/selectors";
import { useAppUiStore } from "@/stores/app-ui-store";

export default function ApiScreen() {
	const {
		snapshot,
		setProviderEnabled,
		regenerateProviderToken,
		runProviderTest,
		copyToClipboard,
	} = useAppData();
	const { setLastProviderTest } = useAppUiStore();
	const activeModel = getActiveModel(snapshot);

	const toggleProvider = async () => {
		if (!snapshot.providerSettings.enabled) {
			Alert.alert(
				"Ativar provider",
				"O endpoint ficará disponível com token obrigatório. Nesta etapa, o provider HTTP real é suportado no Android.",
				[
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Ativar",
						onPress: () => {
							setProviderEnabled(true).catch(() => undefined);
						},
					},
				]
			);
			return;
		}

		await setProviderEnabled(false);
	};

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<ScreenSection
					description="A camada de provider expõe Responses como contrato canônico e roda localmente no device."
					title="Provider Open Responses"
				>
					<View className="gap-4 rounded-[28px] bg-surface px-5 py-5">
						<View className="flex-row items-center justify-between">
							<View className="gap-1">
								<Text className="font-semibold text-foreground text-xl">
									{snapshot.providerSettings.enabled
										? "Provider ativo"
										: "Provider desligado"}
								</Text>
								<Text className="text-muted text-sm">
									{snapshot.providerRuntime.transportLabel}
								</Text>
							</View>
							<StatusBadge value={snapshot.endpointStatus} />
						</View>

						<View className="flex-row flex-wrap gap-2">
							<Chip size="sm" variant="soft">
								<Chip.Label>
									{snapshot.providerSettings.exposureMode}
								</Chip.Label>
							</Chip>
							<Chip size="sm" variant="soft">
								<Chip.Label>
									{activeModel?.displayName ?? "Sem modelo ativo"}
								</Chip.Label>
							</Chip>
							{snapshot.providerRuntime.capabilities.map((capability) => (
								<Chip color="default" key={capability} size="sm" variant="soft">
									<Chip.Label>{capability}</Chip.Label>
								</Chip>
							))}
						</View>

						<Separator />

						<View className="gap-3">
							<Text className="text-muted text-xs uppercase tracking-[1.6px]">
								Base URL
							</Text>
							<Text
								className="font-medium text-base text-foreground"
								selectable
							>
								{snapshot.providerRuntime.baseUrl}
							</Text>
							<Text className="text-muted text-sm" selectable>
								Bearer {snapshot.providerToken}
							</Text>
						</View>

						<View className="flex-row flex-wrap gap-3">
							<Button onPress={toggleProvider} variant="primary">
								<Button.Label>
									{snapshot.providerSettings.enabled
										? "Desligar provider"
										: "Ligar provider"}
								</Button.Label>
							</Button>
							<Button
								onPress={() =>
									copyToClipboard(snapshot.providerRuntime.baseUrl)
								}
								variant="secondary"
							>
								<Button.Label>Copiar URL</Button.Label>
							</Button>
							<Button
								onPress={() => copyToClipboard(snapshot.providerToken)}
								variant="secondary"
							>
								<Button.Label>Copiar token</Button.Label>
							</Button>
						</View>
					</View>
				</ScreenSection>

				<ScreenSection
					action={
						<Button
							onPress={() => router.push("/api/requests")}
							size="sm"
							variant="secondary"
						>
							<Button.Label>Requests</Button.Label>
						</Button>
					}
					description="O teste usa a mesma forma canônica de resposta e registra a execução em Atividade."
					title="Validação"
				>
					<View className="flex-row flex-wrap gap-3">
						<Button
							onPress={async () => {
								const result = await runProviderTest();
								setLastProviderTest(result);
								router.push("/api/test");
							}}
							variant="primary"
						>
							<Button.Label>Testar endpoint</Button.Label>
						</Button>
						<Button onPress={regenerateProviderToken} variant="tertiary">
							<Button.Label>Regenerar token</Button.Label>
						</Button>
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
