import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import { router } from "expo-router";
import {
	Button,
	Chip,
	Dialog,
	Separator,
	Surface,
	Switch,
	useToast,
} from "heroui-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { ListRow } from "@/components/ui/list-row";
import { MonospaceText } from "@/components/ui/monospace-text";
import { NodeStatusDot } from "@/components/ui/node-status-dot";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { getActiveModel } from "@/lib/utils/selectors";
import { useAppUiStore } from "@/stores/app-ui-store";

export default function NodeScreen() {
	const {
		snapshot,
		installedStorageBytes,
		hydrateError,
		setProviderEnabled,
		regenerateProviderToken,
		runProviderTest,
		copyToClipboard,
	} = useAppData();
	const { setLastProviderTest } = useAppUiStore();
	const { toast } = useToast();
	const activeModel = getActiveModel(snapshot);
	const recentLogs = snapshot.requestLogs.slice(0, 5);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const haptic = () => {
		if (Platform.OS === "ios") {
			impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
		}
	};

	const handleProviderToggle = async (enabled: boolean) => {
		if (enabled) {
			setConfirmOpen(true);
			return;
		}
		await setProviderEnabled(false);
		haptic();
		toast.show({ variant: "default", label: "Provider desligado" });
	};

	const confirmEnable = async () => {
		setConfirmOpen(false);
		await setProviderEnabled(true);
		haptic();
		toast.show({ variant: "success", label: "Provider ativo" });
	};

	const handleCopy = (text: string, label: string) => {
		copyToClipboard(text);
		haptic();
		toast.show({ variant: "success", label: `${label} copiado` });
	};

	const handleTest = async () => {
		const result = await runProviderTest();
		setLastProviderTest(result);
		toast.show({
			variant: result.ok ? "success" : "danger",
			label: result.ok ? "Endpoint saudavel" : "Falha no teste",
		});
		router.push("/test");
	};

	const handleRegenToken = async () => {
		await regenerateProviderToken();
		haptic();
		toast.show({ variant: "warning", label: "Token regenerado" });
	};

	const maskedToken = snapshot.providerToken
		? `${snapshot.providerToken.slice(0, 8)}...${snapshot.providerToken.slice(-4)}`
		: "—";

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-4">
				{/* Provider status hero */}
				<Animated.View entering={FadeInUp.duration(400)}>
					<Surface
						className="rounded-[28px] px-5 py-5"
						style={{ borderCurve: "continuous" }}
						variant="secondary"
					>
						<View className="gap-5">
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-3">
									<NodeStatusDot status={snapshot.endpointStatus} />
									<View className="gap-0.5">
										<Text className="font-semibold text-foreground text-xl">
											{snapshot.providerSettings.enabled
												? "Provider ativo"
												: "Provider desligado"}
										</Text>
										<Text className="text-muted text-sm">
											{snapshot.providerRuntime.transportLabel}
										</Text>
									</View>
								</View>
								<Switch
									isSelected={snapshot.providerSettings.enabled}
									onSelectedChange={handleProviderToggle}
								/>
							</View>

							<View className="flex-row flex-wrap gap-2">
								<StatusBadge value={snapshot.endpointStatus} />
								<Chip color="default" size="sm" variant="soft">
									<Chip.Label>
										{activeModel?.displayName ?? "Sem modelo"}
									</Chip.Label>
								</Chip>
								{snapshot.providerRuntime.capabilities.map((cap) => (
									<Chip color="default" key={cap} size="sm" variant="soft">
										<Chip.Label>{cap}</Chip.Label>
									</Chip>
								))}
							</View>

							<Separator />

							<View className="gap-2">
								<Text className="text-muted text-xs uppercase tracking-[1.4px]">
									Base URL
								</Text>
								<Pressable
									onPress={() =>
										handleCopy(snapshot.providerRuntime.baseUrl, "URL")
									}
								>
									<MonospaceText
										className="text-base text-foreground"
										weight="medium"
									>
										{snapshot.providerRuntime.baseUrl}
									</MonospaceText>
								</Pressable>
								<Pressable
									onPress={() => handleCopy(snapshot.providerToken, "Token")}
								>
									<MonospaceText className="text-muted text-sm">
										Bearer {maskedToken}
									</MonospaceText>
								</Pressable>
							</View>

							<View className="flex-row flex-wrap gap-3">
								<Button onPress={handleTest} size="sm" variant="primary">
									<Button.Label>Testar endpoint</Button.Label>
								</Button>
								<Button
									onPress={() =>
										handleCopy(snapshot.providerRuntime.baseUrl, "URL")
									}
									size="sm"
									variant="secondary"
								>
									<Button.Label>Copiar URL</Button.Label>
								</Button>
								<Button onPress={handleRegenToken} size="sm" variant="tertiary">
									<Button.Label>Regenerar token</Button.Label>
								</Button>
							</View>
						</View>
					</Surface>
				</Animated.View>

				{/* Quick stats */}
				<Animated.View entering={FadeInUp.delay(60).duration(400)}>
					<View className="flex-row gap-3">
						<StatCard
							label="Requests"
							value={String(snapshot.requestLogs.length)}
						/>
						<StatCard
							label="Storage"
							value={formatBytes(installedStorageBytes)}
						/>
						<StatCard
							label="Modelos"
							value={String(snapshot.localModels.length)}
						/>
					</View>
				</Animated.View>

				{/* Quick actions */}
				<Animated.View entering={FadeInUp.delay(120).duration(400)}>
					<View className="flex-row gap-3">
						<Button
							className="flex-1"
							onPress={() => router.push("/models")}
							variant={activeModel ? "secondary" : "primary"}
						>
							<Button.Label>
								{activeModel ? "Modelos" : "Baixar modelo"}
							</Button.Label>
						</Button>
						<Button
							className="flex-1"
							onPress={() => router.push("/settings")}
							variant="secondary"
						>
							<Button.Label>Ajustes</Button.Label>
						</Button>
					</View>
				</Animated.View>

				{/* Recent activity */}
				<Animated.View entering={FadeInUp.delay(180).duration(400)}>
					<ScreenSection
						action={
							recentLogs.length > 0 ? (
								<Button
									onPress={() => router.push("/requests")}
									size="sm"
									variant="tertiary"
								>
									<Button.Label>Ver todos</Button.Label>
								</Button>
							) : undefined
						}
						noSeparator
						title="Atividade recente"
					>
						{recentLogs.length > 0 ? (
							<View className="gap-1">
								{recentLogs.map((log) => (
									<ListRow
										detail={formatRelativeTime(log.createdAt)}
										key={log.id}
										onPress={() =>
											router.push({
												pathname: "/request/[requestId]",
												params: { requestId: log.id },
											})
										}
										subtitle={`${log.source} · ${log.method} ${log.endpoint}`}
										title={log.summary}
									/>
								))}
							</View>
						) : (
							<Surface
								className="rounded-2xl px-4 py-4"
								style={{ borderCurve: "continuous" }}
								variant="primary"
							>
								<Text className="text-muted text-sm">
									Envie uma mensagem no chat ou teste o endpoint para gerar
									atividade.
								</Text>
							</Surface>
						)}
					</ScreenSection>
				</Animated.View>

				{/* Hydration error */}
				{hydrateError ? (
					<Animated.View entering={FadeInUp.delay(240).duration(400)}>
						<View
							className="rounded-2xl bg-danger/10 px-4 py-4"
							style={{ borderCurve: "continuous" }}
						>
							<Text className="font-medium text-foreground">
								Falha ao carregar o estado local
							</Text>
							<Text className="mt-1 text-muted text-sm" selectable>
								{hydrateError}
							</Text>
						</View>
					</Animated.View>
				) : null}
			</View>

			{/* Enable confirmation dialog */}
			<Dialog isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
				<Dialog.Portal>
					<Dialog.Overlay />
					<Dialog.Content>
						<Dialog.Close />
						<Dialog.Title>Ativar provider</Dialog.Title>
						<Dialog.Description>
							O endpoint ficara acessivel na rede com token obrigatorio. No
							Android, o servidor HTTP real sera iniciado.
						</Dialog.Description>
						<View className="mt-4 flex-row justify-end gap-3">
							<Button onPress={() => setConfirmOpen(false)} variant="tertiary">
								<Button.Label>Cancelar</Button.Label>
							</Button>
							<Button onPress={confirmEnable} variant="primary">
								<Button.Label>Ativar</Button.Label>
							</Button>
						</View>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog>
		</Container>
	);
}
