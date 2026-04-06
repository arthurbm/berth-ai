import { Button, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";

export default function SettingsScreen() {
	const { snapshot, regenerateProviderToken, resetActivity } = useAppData();

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<ScreenSection
					description="Manutenção local e leitura de ambiente."
					noSeparator
					title="Ajustes rápidos"
				>
					<View className="gap-4 rounded-[28px] bg-surface px-5 py-5">
						<View className="flex-row items-center justify-between">
							<View className="gap-1">
								<Text className="font-semibold text-foreground text-lg">
									Tema
								</Text>
								<Text className="text-muted text-sm">
									Alterna o tema atual do app.
								</Text>
							</View>
							<ThemeToggle />
						</View>

						<View className="flex-row flex-wrap gap-2">
							<Chip size="sm" variant="soft">
								<Chip.Label>
									{snapshot.providerRuntime.transportLabel}
								</Chip.Label>
							</Chip>
							<Chip size="sm" variant="soft">
								<Chip.Label>{`Porta ${snapshot.providerSettings.port}`}</Chip.Label>
							</Chip>
						</View>

						<View className="flex-row flex-wrap gap-3">
							<Button onPress={regenerateProviderToken} variant="secondary">
								<Button.Label>Regenerar token</Button.Label>
							</Button>
							<Button onPress={resetActivity} variant="tertiary">
								<Button.Label>Limpar atividade</Button.Label>
							</Button>
						</View>
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
