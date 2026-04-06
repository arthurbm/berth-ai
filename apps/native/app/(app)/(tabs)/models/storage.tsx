import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { ListRow } from "@/components/ui/list-row";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";
import { formatBytes } from "@/lib/utils/format";

export default function StorageScreen() {
	const { snapshot, installedStorageBytes } = useAppData();

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<ScreenSection
					description="Leitura simples do espaço rastreado pelos modelos dentro do app."
					title="Storage local"
				>
					<View className="rounded-[28px] bg-surface px-5 py-5">
						<Text className="text-muted text-xs uppercase tracking-[1.6px]">
							Total ocupado
						</Text>
						<Text className="mt-1 font-semibold text-3xl text-foreground">
							{formatBytes(installedStorageBytes)}
						</Text>
						<Text className="mt-2 text-muted text-sm">
							O app persiste metadados e progresso localmente; downloads reais
							do runtime entram na próxima integração.
						</Text>
					</View>
				</ScreenSection>

				<ScreenSection
					description="Granularidade suficiente para limpeza manual."
					noSeparator
					title="Por modelo"
				>
					<View className="gap-1">
						{snapshot.localModels.map((item) => {
							const model = snapshot.catalog.find(
								(entry) => entry.id === item.modelId
							);

							return (
								<ListRow
									detail={formatBytes(item.bytesOnDisk)}
									key={item.modelId}
									subtitle={item.status}
									title={model?.displayName ?? item.modelId}
								/>
							);
						})}
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
