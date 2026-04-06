import structuredClonePolyfill from "@ungap/structured-clone";
import { TextDecoder, TextEncoder } from "text-encoding";

declare global {
	interface Global {
		structuredClone?: typeof structuredClonePolyfill;
		TextDecoder?: typeof TextDecoder;
		TextEncoder?: typeof TextEncoder;
	}
}

if (!globalThis.structuredClone) {
	globalThis.structuredClone = structuredClonePolyfill;
}

if (!globalThis.TextEncoder) {
	globalThis.TextEncoder =
		TextEncoder as unknown as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
	globalThis.TextDecoder =
		TextDecoder as unknown as typeof globalThis.TextDecoder;
}
