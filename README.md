# @rbxts/lync-utils

Small, typed adapters for using [Lync](https://github.com/Axp3cter/Lync) with
[Charm](https://github.com/littensy/charm) and
[Replecs](https://github.com/PepeElToro41/replecs) in roblox-ts projects.

The package provides four focused utilities:

- `serdes` turns a Lync codec into a Replecs serializer.
- `sync` mirrors a server-owned Charm store into a Lync replicated set.
- `hydrate` mirrors a Lync replicated set into a client Charm store.
- `collect` buffers client packet values until your update loop consumes them.

## Installation

Install directly from GitHub:

```sh
bun add github:Loner1536/lync-utils#main
```

Or add it under the roblox-ts package name explicitly:

```json
{
    "dependencies": {
        "@rbxts/lync-utils": "github:Loner1536/lync-utils#main"
    }
}
```

The compiled Luau in `out/` is committed, so consumers do not need to build the package.

## Replecs serialization

`serdes(codec, options?)` wraps a Lync codec as a Replecs `SerdesTable`.

```ts
import Lync from "@rbxts/lync";
import replecs from "@rbxts/replecs";
import { serdes } from "@rbxts/lync-utils";
import { world } from "@rbxts/jecs";

const Health = world.component<number>();

world.set(
    Health,
    replecs.serdes,
    serdes(Lync.int(0, 100), { bytespan: 1, variants: false }),
);
```

### Options

| Option | Type | Description |
| --- | --- | --- |
| `bytespan` | `number` | Fixed encoded byte length reported to Replecs. Omit it for variable-length codecs. |
| `variants` | `boolean` | Defaults to `true`. Set to `false` when the codec never encodes Roblox instances. |

With variants enabled, references produced by `Lync.encode` travel through Replecs' variant channel.
With variants disabled, `serdes` throws if the codec unexpectedly produces instance references.

## Charm and replicated sets

`sync` and `hydrate` connect a Charm store to a Lync replicated set. Store values may be either a
`Map<number, T>` or a `Record<string, T>` whose keys are numeric strings.

```ts
import { atom } from "@rbxts/charm";
import Lync from "@rbxts/lync";
import { hydrate, sync } from "@rbxts/lync-utils";

interface EnemyState {
    health: number;
}

const enemies = atom(new Map<number, EnemyState>());
const { replicatedEnemies } = Lync.define("World", {
    replicatedEnemies: Lync.replicate(Lync.struct({
        health: Lync.int(0, 100),
    })),
});
```

On the server, mirror store changes into the replicated set:

```ts
const stopSyncing = sync(enemies, replicatedEnemies);

// Call during cleanup when the store should stop replicating.
stopSyncing();
```

On the client, hydrate the local store from replicated set events:

```ts
hydrate(replicatedEnemies, enemies);
```

Both helpers create new maps, records, and values when applying changes so Charm observes immutable
state updates. `sync` only writes entries whose value identity changed and removes entries no longer
present in the store.

## Packet collection

`collect(packet)` buffers values received through a client packet. Calling `iter()` returns the
current batch and clears the buffer, which is useful for processing network events inside a game-loop
system.

```ts
import Lync from "@rbxts/lync";
import { collect } from "@rbxts/lync-utils";

const { hit } = Lync.define("Combat", {
    hit: Lync.packet(Lync.struct({ damage: Lync.int(0, 255) })),
});
const hits = collect(hit);

function update() {
    for (const hit of hits.iter()) {
        print(`Received ${hit.damage} damage`);
    }
}

// Stop listening and discard buffered values during cleanup.
hits.disconnect();
```

## API

```ts
serdes<T>(codec: Lync.Codec<T>, options?: SerdesOptions): Replecs.SerdesTable<T>;

sync<T, S>(getter: Getter<S>, container: Lync.Set<T>): () => void;

hydrate<T, S>(container: Lync.Set<T>, setter: Setter<S>): void;

collect<T>(packet: Lync.Packet<T>): PacketCollector<T>;
```

All functions are available as named exports and on the default export.

## Development

```sh
bun install
bun run build
```

`bun run build` compiles `src/` into the committed `out/` directory with Rotor.
