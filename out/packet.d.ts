import Lync from "@rbxts/lync";
export interface PacketCollector<T extends defined> {
    readonly iter: () => T[];
    readonly disconnect: () => void;
}
/** Buffers values received by a client packet until they are consumed. */
export declare function collect<T extends defined>(packet: Lync.Packet<T>): PacketCollector<T>;
