import { serdes } from "./codec";
import { collect } from "./packet";
import { hydrate, sync } from "./store";
export { serdes, collect, hydrate, sync };
export type { SerdesOptions } from "./codec";
export type { PacketCollector } from "./packet";
declare const LyncUtility: {
    serdes: typeof serdes;
    collect: typeof collect;
    hydrate: typeof hydrate;
    sync: typeof sync;
};
export default LyncUtility;
