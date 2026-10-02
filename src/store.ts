import type { Getter, Setter } from "@rbxts/charm";
import { subscribe } from "@rbxts/charm";
import Lync from "@rbxts/lync";

type StoreState<T extends object> = Record<string, T> | Map<number, T>;

function isMap<T extends object>(state: unknown): state is Map<number, T> {
	return typeIs(state, "table") && "has" in state;
}
function copy<T extends object>(value: T): T {
	return { ...value };
}
function copyMap<T extends object>(state: Map<number, T>): Map<number, T> {
	const result = new Map<number, T>();
	for (const [id, value] of state) result.set(id, value);
	return result;
}
function setValue<T extends object>(state: StoreState<T>, id: number, value: T): StoreState<T> {
	if (!isMap<T>(state)) return { ...state, [tostring(id)]: copy(value) };
	const updated = copyMap(state);
	updated.set(id, copy(value));
	return updated;
}
function removeValue<T extends object>(state: StoreState<T>, id: number): StoreState<T> {
	if (!isMap<T>(state)) {
		const updated = { ...state };
		delete updated[tostring(id)];
		return updated;
	}
	const updated = copyMap(state);
	updated.delete(id);
	return updated;
}

/** Mirrors a Lync replicated set into a local Charm store. */
export function hydrate<T extends object, S extends StoreState<T>>(
	container: Lync.Set<T>,
	setter: Setter<S>,
): void {
	const update = (id: number, value: T) => setter((state) => setValue(state, id, value) as S);
	container.onAdded(update);
	container.onChanged(update);
	container.onRemoved((id) => setter((state) => removeValue(state, id) as S));
}

function write<T extends object>(container: Lync.Set<T>, id: number, value: T): void {
	const record = copy(value);
	if (container.get(id) === undefined) container.add(id, record);
	else container.update(id, record);
}
function syncRecord<T extends object>(
	container: Lync.Set<T>, current: Record<string, T>, previous: Record<string, T>,
): void {
	for (const [key, value] of pairs(current)) {
		if (previous[key] !== value) write(container, tonumber(key)!, value);
	}
	for (const [key] of pairs(previous)) {
		if (current[key] === undefined) container.remove(tonumber(key)!);
	}
}
function syncMap<T extends object>(
	container: Lync.Set<T>, current: Map<number, T>, previous: Map<number, T>,
): void {
	for (const [id, value] of current) {
		if (previous.get(id) !== value) write(container, id, value);
	}
	for (const [id] of previous) {
		if (!current.has(id)) container.remove(id);
	}
}

/** Mirrors a server-owned Charm store into a Lync replicated set. */
export function sync<T extends object, S extends StoreState<T>>(
	getter: Getter<S>, container: Lync.Set<T>,
): () => void {
	return subscribe(getter, (current: StoreState<T>, previous?: StoreState<T>) => {
		if (isMap<T>(current)) syncMap(container, current, isMap<T>(previous) ? previous : new Map());
		else syncRecord(container, current, !isMap<T>(previous) && previous !== undefined ? previous : {});
	});
}
