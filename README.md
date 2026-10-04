# @rbxts/lync-utility

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
bun add github:Loner1536/LyncUtility#main
```

Or add it under the roblox-ts package name explicitly:

```json
{
    "dependencies": {
        "@rbxts/lync-utility": "github:Loner1536/LyncUtility#main"
    }
}
```

The compiled Luau in `out/` is committed, so consumers do not need to build the package.

## Example project layout

The examples below use this structure. The filenames are suggestions; the important part is that
Lync definitions and shared state live somewhere both the server and client can import.

```text
src/
├── client/
│   ├── network/enemies.ts
│   └── systems/hits.ts
├── server/
│   └── network/enemies.ts
└── shared/
    ├── ecs/components.ts
    ├── network/
    │   ├── combat.ts
    │   └── world.ts
    └── stores/enemies.ts
```

## Replecs serialization

`serdes(codec, options?)` wraps a Lync codec as a Replecs `SerdesTable`.

Place component declarations and their serializers in a shared ECS module so both sides use the
same component and codec.

**`src/shared/ecs/components.ts`**

```ts
import Lync from "@rbxts/lync";
import replecs from "@rbxts/replecs";
import { serdes } from "@rbxts/lync-utility";
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

`sync` and `hydrate` connect a Charm store to a Lync replicated set. Stores use `Map<number, T>` so
Lync's numeric replicated-set IDs stay numeric without unreliable runtime type detection. Maps nested
inside each replicated value remain ordinary schema data and may use any key codec supported by Lync.

Define the replicated set in a shared network module.

**`src/shared/network/world.ts`**

```ts
import Lync from "@rbxts/lync";

export const World = Lync.define("World", {
    replicatedEnemies: Lync.replicate(Lync.struct({
        health: Lync.int(0, 100),
    })),
});
```

Keep the Charm atom and its value type in a shared store module.

**`src/shared/stores/enemies.ts`**

```ts
import { atom } from "@rbxts/charm";

export interface EnemyState {
    health: number;
}

export const enemies = atom(new Map<number, EnemyState>());
```

On the server, mirror store changes into the replicated set. Retain the returned cleanup function
for your framework's shutdown or teardown hook.

**`src/server/network/enemies.ts`**

```ts
import { sync } from "@rbxts/lync-utility";
import { World } from "../../shared/network/world";
import { enemies } from "../../shared/stores/enemies";

export function startEnemyReplication() {
    return sync(enemies, World.replicatedEnemies);
}
```

On the client, hydrate that same store from replicated set events.

**`src/client/network/enemies.ts`**

```ts
import { hydrate } from "@rbxts/lync-utility";
import { World } from "../../shared/network/world";
import { enemies } from "../../shared/stores/enemies";

export function startEnemyHydration() {
    hydrate(World.replicatedEnemies, enemies);
}
```

Both helpers create new maps, records, and values when applying changes so Charm observes immutable
state updates. `sync` only writes entries whose value identity changed and removes entries no longer
present in the store.

## Packet collection

`collect(packet)` buffers values received through a client packet. Calling `iter()` returns the
current batch and clears the buffer, which is useful for processing network events inside a game-loop
system.

Declare the packet alongside your other shared Lync definitions.

**`src/shared/network/combat.ts`**

```ts
import Lync from "@rbxts/lync";

export const Combat = Lync.define("Combat", {
    hit: Lync.packet(Lync.struct({ damage: Lync.int(0, 255) })),
});
```

Create and drain the collector in a client system. Keep the collector alive between update calls so
it can accumulate packet values.

**`src/client/systems/hits.ts`**

```ts
import { collect } from "@rbxts/lync-utility";
import { Combat } from "../../shared/network/combat";

const hits = collect(Combat.hit);

export function updateHits() {
    for (const hit of hits.iter()) {
        print(`Received ${hit.damage} damage`);
    }
}

export function stopHits() {
    hits.disconnect();
}
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
