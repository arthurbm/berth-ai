import { router } from "expo-router";
import { Button } from "heroui-native";
import { View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";
import { formatRelativeTime } from "@/lib/utils/format";

export default function ActivityScreen() {
	const { snapshot, resetActivity } = useAppData();

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<ScreenSection
					action={
						<Button onPress={resetActivity} size="sm" variant="tertiary">
							<Button.Label>Limpar</Button.Label>
						</Button>
					}
					description="Requests do chat interno e do teste do provider ficam lado a lado para leitura rápida."
					noSeparator
					title="Atividade local"
				>
					{snapshot.requestLogs.length > 0 ? (
						<View className="gap-1">
							{snapshot.requestLogs.map((log) => (
								<ListRow
									detail={formatRelativeTime(log.createdAt)}
									key={log.id}
									onPress={() =>
										router.push({
											pathname: "/activity/request/[requestId]",
											params: { requestId: log.id },
										})
									}
									subtitle={`${log.source} • ${log.method} ${log.endpoint}`}
									title={log.summary}
								/>
							))}
						</View>
					) : (
						<EmptyState
							description="Envie uma mensagem no chat ou rode o teste da API para começar a alimentar esta timeline."
							title="Nenhuma request registrada"
						/>
					)}
				</ScreenSection>
			</View>
		</Container>
	);
}
