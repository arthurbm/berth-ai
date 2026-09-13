import {
	TextDecoderStream as TextDecoderStreamPolyfill,
	TextEncoderStream as TextEncoderStreamPolyfill,
} from "@stardazed/streams-text-encoding";
import structuredClonePolyfill from "@ungap/structured-clone";
import { TextDecoder, TextEncoder } from "text-encoding";

const globals = globalThis as Record<string, unknown>;

if (!globals.structuredClone) {
	globals.structuredClone = structuredClonePolyfill;
}

if (!globals.TextEncoder) {
	globals.TextEncoder = TextEncoder;
}

if (!globals.TextDecoder) {
	globals.TextDecoder = TextDecoder;
}

if (!globals.TextEncoderStream) {
	globals.TextEncoderStream = TextEncoderStreamPolyfill;
}

if (!globals.TextDecoderStream) {
	globals.TextDecoderStream = TextDecoderStreamPolyfill;
}
