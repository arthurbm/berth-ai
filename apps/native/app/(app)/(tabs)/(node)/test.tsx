import { Chip } from "heroui-native";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { MonospaceText } from "@/components/ui/monospace-text";
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
				<Animated.View entering={FadeInUp.duration(350)}>
					<ScreenSection
						description="Resultado do ultimo teste de saude do endpoint."
						noSeparator
						title="Ultimo teste"
					>
						{latestApiLog ? (
							<View
								className="gap-4 rounded-[28px] bg-surface px-5 py-5"
								style={{ borderCurve: "continuous" }}
							>
								<Text className="font-semibold text-foreground text-lg">
									{latestApiLog.summary}
								</Text>
								<MonospaceText className="text-muted text-sm leading-6">
									{latestApiLog.responsePreview ??
										latestApiLog.errorMessage ??
										lastProviderTest?.responsePreview ??
										lastProviderTest?.errorMessage ??
										"Sem preview disponivel."}
								</MonospaceText>
								<View className="flex-row flex-wrap gap-2">
									<Chip size="sm" variant="soft">
										<Chip.Label>{latestApiLog.method}</Chip.Label>
									</Chip>
									<Chip size="sm" variant="soft">
										<Chip.Label>{latestApiLog.endpoint}</Chip.Label>
									</Chip>
									<Chip size="sm" variant="soft">
										<Chip.Label>{`${latestApiLog.latencyMs} ms`}</Chip.Label>
									</Chip>
								</View>
							</View>
						) : (
							<EmptyState
								description="Rode o teste na tela principal para validar o endpoint."
								title="Nenhum teste executado"
							/>
						)}
					</ScreenSection>
				</Animated.View>
			</View>
		</Container>
	);
}
