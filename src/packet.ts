import Lync from "@rbxts/lync";

export interface PacketCollector<T extends defined> {
	readonly iter: () => T[];
	readonly disconnect: () => void;
}

/** Buffers values received by a client packet until they are consumed. */
export function collect<T extends defined>(packet: Lync.Packet<T>): PacketCollector<T> {
	let values = new Array<T>();
	const connection = packet.onClient((value) => values.push(value));
	return {
		iter: () => {
			const collected = values;
			values = [];
			return collected;
		},
		disconnect: () => {
			connection.disconnect();
			values = [];
		},
	};
}
