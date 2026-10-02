import { serdes } from "./codec";
import { collect } from "./packet";
import { hydrate, sync } from "./store";

export { serdes, collect, hydrate, sync };
export type { SerdesOptions } from "./codec";
export type { PacketCollector } from "./packet";

const LyncUtility = { serdes, collect, hydrate, sync };

export default LyncUtility;
