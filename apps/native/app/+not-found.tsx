import { Link, Stack } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "Não encontrado" }} />
			<Container className="px-4 py-6">
				<View className="flex-1 items-center justify-center gap-4">
					<Text className="font-semibold text-2xl text-foreground">
						Rota não encontrada
					</Text>
					<Text className="text-center text-muted text-sm">
						Use o workspace principal para voltar ao app.
					</Text>
					<Link asChild href="/home">
						<Button variant="primary">
							<Button.Label>Ir para Home</Button.Label>
						</Button>
					</Link>
				</View>
			</Container>
		</>
	);
}
