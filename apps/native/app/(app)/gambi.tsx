import {
	Button,
	Description,
	Input,
	Label,
	TextField,
	useToast,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { HeroPanel } from "@/components/ui/hero-panel";
import { ScreenSection } from "@/components/ui/screen-section";
import { useAppData } from "@/hooks/use-app-data";

export default function GambiScreen() {
	const { snapshot, saveGambiDraft } = useAppData();
	const { toast } = useToast();
	const [roomName, setRoomName] = useState(snapshot.gambiDraft.roomName);
	const [roomCode, setRoomCode] = useState(snapshot.gambiDraft.roomCode);
	const [credential, setCredential] = useState(snapshot.gambiDraft.credential);

	useEffect(() => {
		setRoomName(snapshot.gambiDraft.roomName);
		setRoomCode(snapshot.gambiDraft.roomCode);
		setCredential(snapshot.gambiDraft.credential);
	}, [snapshot.gambiDraft]);

	const handleSave = async () => {
		await saveGambiDraft({
			...snapshot.gambiDraft,
			credential,
			roomCode,
			roomName,
		});
		toast.show({ label: "Rascunho salvo", variant: "success" });
	};

	return (
		<Container className="px-4 pb-8">
			<View className="gap-6 py-4">
				<Animated.View entering={FadeInUp.duration(350)}>
					<HeroPanel
						description="Configure sala, credencial e visibilidade para quando a integracao estiver disponivel."
						eyebrow="Fase 2"
						title="Integracao com Gambi"
					/>
				</Animated.View>

				<Animated.View entering={FadeInUp.delay(80).duration(350)}>
					<ScreenSection noSeparator title="Rascunho local">
						<View
							className="gap-4 rounded-[28px] bg-surface px-5 py-5"
							style={{ borderCurve: "continuous" }}
						>
							<TextField>
								<Label>Nome da sala</Label>
								<Input
									onChangeText={setRoomName}
									placeholder="Research lab"
									value={roomName}
								/>
							</TextField>
							<TextField>
								<Label>Codigo da sala</Label>
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
									Nada e enviado. Esse rascunho fica apenas no device.
								</Description>
							</TextField>

							<Button onPress={handleSave} variant="primary">
								<Button.Label>Salvar rascunho</Button.Label>
							</Button>

							<Text className="text-muted text-sm">
								{snapshot.gambiDraft.roomCode
									? "Rascunho salvo"
									: "Nao configurado"}
							</Text>
						</View>
					</ScreenSection>
				</Animated.View>
			</View>
		</Container>
	);
}
