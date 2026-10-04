import type { Getter, Setter } from "@rbxts/charm";
import { subscribe } from "@rbxts/charm";
import Lync from "@rbxts/lync";

function copy<T extends object>(value: T): T {
	return { ...value };
}
function copyMap<T extends object>(state: Map<number, T>): Map<number, T> {
	const result = new Map<number, T>();
	for (const [id, value] of state) result.set(id, value);
	return result;
}
function setValue<T extends object>(state: Map<number, T>, id: number, value: T): Map<number, T> {
	const updated = copyMap(state);
	updated.set(id, copy(value));
	return updated;
}
function removeValue<T extends object>(state: Map<number, T>, id: number): Map<number, T> {
	const updated = copyMap(state);
	updated.delete(id);
	return updated;
}

/** Mirrors a Lync replicated set into a local Charm store. */
export function hydrate<T extends object>(
	container: Lync.Set<T>,
	setter: Setter<Map<number, T>>,
): void {
	const update = (id: number, value: T) => setter((state) => setValue(state, id, value));
	container.onAdded(update);
	container.onChanged(update);
	container.onRemoved((id) => setter((state) => removeValue(state, id)));
}

function write<T extends object>(container: Lync.Set<T>, id: number, value: T): void {
	const record = copy(value);
	if (container.get(id) === undefined) container.add(id, record);
	else container.update(id, record);
}
function syncState<T extends object>(
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
export function sync<T extends object>(
	getter: Getter<Map<number, T>>, container: Lync.Set<T>,
): () => void {
	return subscribe(getter, (current, previous) => syncState(container, current, previous ?? new Map()));
}
