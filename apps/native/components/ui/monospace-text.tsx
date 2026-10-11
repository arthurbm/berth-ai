import type { TextProps } from "react-native";
import { Text } from "react-native";

import { fonts } from "@/lib/constants/typography";

type MonospaceTextProps = TextProps & {
	weight?: "regular" | "medium" | "bold";
};

const fontMap = {
	bold: fonts.monoBold,
	medium: fonts.monoMedium,
	regular: fonts.mono,
} as const;

export function MonospaceText({
	weight = "regular",
	style,
	...props
}: MonospaceTextProps) {
	return (
		<Text
			selectable
			style={[{ fontFamily: fontMap[weight] }, style]}
			{...props}
		/>
	);
}
