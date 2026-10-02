import type Replecs from "@rbxts/replecs";
import Lync from "@rbxts/lync";
export interface SerdesOptions {
    bytespan?: number;
    variants?: boolean;
}
/** Adapts a Lync codec for use as a Replecs component serializer. */
export declare function serdes<T>(codec: Lync.Codec<T>, options?: SerdesOptions): Replecs.SerdesTable<T>;
