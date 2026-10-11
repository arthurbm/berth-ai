import { router } from "expo-router";
import { Button, useToast } from "heroui-native";
import { View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";
import { formatRelativeTime } from "@/lib/utils/format";

export default function RequestsScreen() {
	const { snapshot, resetActivity } = useAppData();
	const { toast } = useToast();

	const handleClear = async () => {
		await resetActivity();
		toast.show({ label: "Atividade limpa", variant: "default" });
	};

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<Animated.View entering={FadeInUp.duration(350)}>
					<ScreenSection
						action={
							snapshot.requestLogs.length > 0 ? (
								<Button onPress={handleClear} size="sm" variant="tertiary">
									<Button.Label>Limpar</Button.Label>
								</Button>
							) : undefined
						}
						description="Historico de todas as requests processadas."
						noSeparator
						title="Requests"
					>
						{snapshot.requestLogs.length > 0 ? (
							<View className="gap-1">
								{snapshot.requestLogs.map((log, index) => (
									<Animated.View
										entering={FadeInUp.delay(index * 30).duration(300)}
										key={log.id}
									>
										<ListRow
											detail={formatRelativeTime(log.createdAt)}
											onPress={() =>
												router.push({
													params: { requestId: log.id },
													pathname: "/request/[requestId]",
												})
											}
											subtitle={`${log.source} · ${log.method} ${log.endpoint}`}
											title={log.summary}
										/>
									</Animated.View>
								))}
							</View>
						) : (
							<EmptyState
								description="Envie uma mensagem ou teste o endpoint para gerar atividade."
								title="Nenhuma request registrada"
							/>
						)}
					</ScreenSection>
				</Animated.View>
			</View>
		</Container>
	);
}
