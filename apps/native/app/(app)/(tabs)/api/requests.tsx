import { router } from "expo-router";
import { View } from "react-native";

import { Container } from "@/components/container";
import { ListRow } from "@/components/ui/list-row";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";
import { formatRelativeTime } from "@/lib/utils/format";

export default function ApiRequestsScreen() {
	const { snapshot } = useAppData();
	const apiLogs = snapshot.requestLogs.filter((log) =>
		log.endpoint.startsWith("/v1")
	);

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<ScreenSection
					description="Lista focada no provider, separada da atividade geral."
					noSeparator
					title="Requests recentes"
				>
					<View className="gap-1">
						{apiLogs.map((log) => (
							<ListRow
								detail={formatRelativeTime(log.createdAt)}
								key={log.id}
								onPress={() =>
									router.push({
										pathname: "/activity/request/[requestId]",
										params: { requestId: log.id },
									})
								}
								subtitle={`${log.method} ${log.endpoint}`}
								title={log.summary}
							/>
						))}
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
