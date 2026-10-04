import type { Getter, Setter } from "@rbxts/charm";
import Lync from "@rbxts/lync";
/** Mirrors a Lync replicated set into a local Charm store. */
export declare function hydrate<T extends object>(container: Lync.Set<T>, setter: Setter<Map<number, T>>): void;
/** Mirrors a server-owned Charm store into a Lync replicated set. */
export declare function sync<T extends object>(getter: Getter<Map<number, T>>, container: Lync.Set<T>): () => void;
