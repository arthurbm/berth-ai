import { Button, Description, Input, Label, TextField } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { HeroPanel } from "@/components/ui/hero-panel";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";

export default function GambiScreen() {
	const { snapshot, saveGambiDraft } = useAppData();
	const [roomName, setRoomName] = useState(snapshot.gambiDraft.roomName);
	const [roomCode, setRoomCode] = useState(snapshot.gambiDraft.roomCode);
	const [credential, setCredential] = useState(snapshot.gambiDraft.credential);

	useEffect(() => {
		setRoomName(snapshot.gambiDraft.roomName);
		setRoomCode(snapshot.gambiDraft.roomCode);
		setCredential(snapshot.gambiDraft.credential);
	}, [snapshot.gambiDraft]);

	return (
		<Container className="px-4 pb-8">
			<View className="gap-8 py-6">
				<HeroPanel
					description="A UI já preserva estado local de sala, credencial e visibilidade, sem vender integração remota que ainda não existe."
					eyebrow="Fase 2 preparada"
					title="Rascunho local de integração com Gambi"
				/>

				<ScreenSection
					description="Esses campos já persistem no SQLite e preparam a próxima camada sem criar dependência de backend agora."
					noSeparator
					title="Draft local"
				>
					<View className="gap-4 rounded-[28px] bg-surface px-5 py-5">
						<TextField>
							<Label>Nome da sala</Label>
							<Input
								onChangeText={setRoomName}
								placeholder="Research lab"
								value={roomName}
							/>
						</TextField>
						<TextField>
							<Label>Código da sala</Label>
							<Input
								onChangeText={setRoomCode}
								placeholder="lab-042"
								value={roomCode}
							/>
						</TextField>
						<TextField>
							<Label>Credencial</Label>
							<Input
								onChangeText={setCredential}
								placeholder="token ou chave de sala"
								value={credential}
							/>
							<Description>
								Nada é enviado ainda. Esse draft fica só no device.
							</Description>
						</TextField>

						<Button
							onPress={() =>
								saveGambiDraft({
									...snapshot.gambiDraft,
									roomName,
									roomCode,
									credential,
								})
							}
							variant="primary"
						>
							<Button.Label>Salvar rascunho</Button.Label>
						</Button>

						<Text className="text-muted text-sm">
							Estado atual:{" "}
							{snapshot.gambiDraft.roomCode
								? "rascunho salvo"
								: "não configurado"}
							.
						</Text>
					</View>
				</ScreenSection>
			</View>
		</Container>
	);
}
