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
	online: "#22c55e",
	starting: "#f59e0b",
	error: "#ef4444",
	offline: "#6b7280",
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
				width: 12,
				height: 12,
				borderRadius: 6,
				backgroundColor: `${color}33`,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Animated.View
				style={[
					{
						width: 8,
						height: 8,
						borderRadius: 4,
						backgroundColor: color,
					},
					animatedStyle,
				]}
			/>
		</View>
	);
}
