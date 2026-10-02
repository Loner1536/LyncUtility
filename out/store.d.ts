import type { Getter, Setter } from "@rbxts/charm";
import Lync from "@rbxts/lync";
type StoreState<T extends object> = Record<string, T> | Map<number, T>;
/** Mirrors a Lync replicated set into a local Charm store. */
export declare function hydrate<T extends object, S extends StoreState<T>>(container: Lync.Set<T>, setter: Setter<S>): void;
/** Mirrors a server-owned Charm store into a Lync replicated set. */
export declare function sync<T extends object, S extends StoreState<T>>(getter: Getter<S>, container: Lync.Set<T>): () => void;
export {};
