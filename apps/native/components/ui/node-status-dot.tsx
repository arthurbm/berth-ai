import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

import type { EndpointStatus } from "@/types/app-state";

const statusColors: Record<EndpointStatus, string> = {
	error: "#ef4444",
	offline: "#6b7280",
	online: "#22c55e",
	starting: "#f59e0b",
};

export function NodeStatusDot({ status }: { status: EndpointStatus }) {
	const opacity = useSharedValue(1);
	const color = statusColors[status];

	useEffect(() => {
		if (status === "online") {
			opacity.value = withRepeat(withTiming(0.3, { duration: 1200 }), -1, true);
		} else {
			opacity.value = 1;
		}
	}, [status, opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<View
			style={{
				alignItems: "center",
				backgroundColor: `${color}33`,
				borderRadius: 6,
				height: 12,
				justifyContent: "center",
				width: 12,
			}}
		>
			<Animated.View
				style={[
					{
						backgroundColor: color,
						borderRadius: 4,
						height: 8,
						width: 8,
					},
					animatedStyle,
				]}
			/>
		</View>
	);
}
