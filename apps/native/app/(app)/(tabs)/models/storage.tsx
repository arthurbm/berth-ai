import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { ListRow } from "@/components/ui/list-row";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppData } from "@/hooks/use-app-data";
import { formatBytes } from "@/lib/utils/format";

export default function StorageScreen() {
	const { snapshot, installedStorageBytes } = useAppData();

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<Animated.View entering={FadeInUp.duration(350)}>
					<ScreenSection
						description="Espaco ocupado pelos modelos baixados."
						title="Storage local"
					>
						<View
							className="rounded-[28px] bg-surface px-5 py-5"
							style={{ borderCurve: "continuous" }}
						>
							<Text className="text-muted text-xs uppercase tracking-[1.6px]">
								Total ocupado
							</Text>
							<Text
								className="mt-1 font-semibold text-3xl text-foreground"
								style={{ fontVariant: ["tabular-nums"] }}
							>
								{formatBytes(installedStorageBytes)}
							</Text>
							<Text className="mt-2 text-muted text-sm">
								{snapshot.localModels.length} modelos rastreados no device.
							</Text>
						</View>
					</ScreenSection>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(80).duration(350)}>
					<ScreenSection noSeparator title="Por modelo">
						<View className="gap-1">
							{snapshot.localModels.map((item) => {
								const model = snapshot.catalog.find(
									(entry) => entry.id === item.modelId
								);

								return (
									<ListRow
										detail={formatBytes(item.bytesOnDisk)}
										key={item.modelId}
										title={model?.displayName ?? item.modelId}
										trailing={<StatusBadge value={item.status} />}
									/>
								);
							})}
						</View>
					</ScreenSection>
				</Animated.View>
			</View>
		</Container>
	);
}
