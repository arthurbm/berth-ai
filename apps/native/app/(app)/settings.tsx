import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { Chip, ListGroup, Separator, Switch, useToast } from "heroui-native";
import { Platform, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useAppData } from "@/hooks/use-app-data";

export default function SettingsScreen() {
	const { snapshot, regenerateProviderToken, resetActivity } = useAppData();
	const { isDark, toggleTheme } = useAppTheme();
	const { toast } = useToast();

	const haptic = () => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
		}
	};

	const handleRegenToken = async () => {
		await regenerateProviderToken();
		haptic();
		toast.show({ label: "Token regenerado", variant: "warning" });
	};

	const handleClearActivity = async () => {
		await resetActivity();
		haptic();
		toast.show({ label: "Atividade limpa", variant: "default" });
	};

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-4">
				<Animated.View entering={FadeInUp.duration(350)}>
					<ListGroup>
						<ListGroup.Item
							onPress={() => {
								haptic();
								toggleTheme();
							}}
						>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Tema</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{isDark ? "Escuro" : "Claro"}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<Switch
								isSelected={isDark}
								onSelectedChange={() => {
									haptic();
									toggleTheme();
								}}
							/>
						</ListGroup.Item>
						<Separator className="mx-4" />
						<ListGroup.Item>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Transporte</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{snapshot.providerRuntime.transportLabel}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
						</ListGroup.Item>
						<Separator className="mx-4" />
						<ListGroup.Item>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Porta</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{String(snapshot.providerSettings.port)}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
						</ListGroup.Item>
						<Separator className="mx-4" />
						<ListGroup.Item>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Exposicao</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{snapshot.providerSettings.exposureMode}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
						</ListGroup.Item>
					</ListGroup>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(60).duration(350)}>
					<ListGroup>
						<ListGroup.Item onPress={handleRegenToken}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Regenerar token</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									Gera um novo Bearer token para o provider
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
						<Separator className="mx-4" />
						<ListGroup.Item onPress={handleClearActivity}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle className="text-danger">
									Limpar atividade
								</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									Remove todo o historico de requests
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					</ListGroup>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(120).duration(350)}>
					<View className="gap-2 px-2">
						<Text className="text-muted text-xs uppercase tracking-[1.4px]">
							Plataforma
						</Text>
						<View className="flex-row flex-wrap gap-2">
							<Chip size="sm" variant="soft">
								<Chip.Label>
									{snapshot.providerRuntime.platformSupport}
								</Chip.Label>
							</Chip>
							<Chip size="sm" variant="soft">
								<Chip.Label>
									{snapshot.providerSettings.transportMode}
								</Chip.Label>
							</Chip>
						</View>
					</View>
				</Animated.View>
			</View>
		</Container>
	);
}
