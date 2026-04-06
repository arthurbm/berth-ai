import "@/global.css";
import "@/lib/ai/polyfills";
import {
	JetBrainsMono_400Regular,
	JetBrainsMono_500Medium,
	JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { queryClient } from "@/lib/query/query-client";
import { AppDataProvider } from "@/providers/app-data-provider";

preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		JetBrainsMono_400Regular,
		JetBrainsMono_500Medium,
		JetBrainsMono_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider>
				<AppThemeProvider>
					<HeroUINativeProvider>
						<QueryClientProvider client={queryClient}>
							<AppDataProvider>
								<Stack>
									<Stack.Screen name="(app)" options={{ headerShown: false }} />
								</Stack>
							</AppDataProvider>
						</QueryClientProvider>
					</HeroUINativeProvider>
				</AppThemeProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
