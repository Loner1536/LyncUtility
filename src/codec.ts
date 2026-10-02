import type Replecs from "@rbxts/replecs";
import Lync from "@rbxts/lync";

export interface SerdesOptions {
	bytespan?: number;
	variants?: boolean;
}

/** Adapts a Lync codec for use as a Replecs component serializer. */
export function serdes<T>(codec: Lync.Codec<T>, options: SerdesOptions = {}): Replecs.SerdesTable<T> {
	const { bytespan } = options;
	if (options.variants === false) {
		return {
			bytespan,
			serialize: (value) => {
				const [bytes, refs] = Lync.encode(codec, value);
				if (refs !== undefined) error("Lync codec encoded instances, but variants were disabled", 0);
				return bytes;
			},
			deserialize: (bytes) => Lync.decode(codec, bytes),
		};
	}
	return {
		bytespan,
		includes_variants: true,
		serialize: (value) => Lync.encode(codec, value),
		deserialize: (bytes, refs) => Lync.decode(codec, bytes, refs as Instance[] | undefined),
	};
}
