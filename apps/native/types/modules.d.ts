declare module "@ungap/structured-clone" {
	const structuredClonePolyfill: <T>(value: T) => T;
	export default structuredClonePolyfill;
}

declare module "text-encoding" {
	export class TextEncoder {
		encode(input?: string): Uint8Array;
	}

	export class TextDecoder {
		constructor(
			label?: string,
			options?: { fatal?: boolean; ignoreBOM?: boolean }
		);
		decode(input?: ArrayBuffer | ArrayBufferView): string;
	}
}
