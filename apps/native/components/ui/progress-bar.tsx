import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";

interface ProgressBarProps {
	height?: number;
	progress: number;
}

export function ProgressBar({ progress, height = 4 }: ProgressBarProps) {
	const accentColor = useThemeColor("accent");

	const animatedStyle = useAnimatedStyle(() => ({
		width: `${withTiming(Math.min(progress, 1) * 100, { duration: 300 })}%`,
	}));

	return (
		<View
			style={{
				backgroundColor: `${accentColor}20`,
				borderRadius: height / 2,
				height,
				overflow: "hidden",
			}}
		>
			<Animated.View
				style={[
					{
						backgroundColor: accentColor,
						borderRadius: height / 2,
						height,
					},
					animatedStyle,
				]}
			/>
		</View>
	);
}
