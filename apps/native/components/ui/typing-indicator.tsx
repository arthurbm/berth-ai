import { useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";

function Dot({ delay, color }: { delay: number; color: string }) {
	const opacity = useSharedValue(0.3);

	useEffect(() => {
		opacity.value = withDelay(
			delay,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 400 }),
					withTiming(0.3, { duration: 400 })
				),
				-1,
				false
			)
		);
	}, [delay, opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={[
				{
					backgroundColor: color,
					borderRadius: 3.5,
					height: 7,
					width: 7,
				},
				animatedStyle,
			]}
		/>
	);
}

export function TypingIndicator() {
	const muted = useThemeColor("muted");

	return (
		<Animated.View entering={FadeIn.duration(300)}>
			<View style={{ flexDirection: "row", gap: 4, paddingVertical: 4 }}>
				<Dot color={muted} delay={0} />
				<Dot color={muted} delay={200} />
				<Dot color={muted} delay={400} />
			</View>
		</Animated.View>
	);
}
