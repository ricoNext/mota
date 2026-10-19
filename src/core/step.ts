import { canDefeat, forecastDamage } from './combat';
import { cloneGameState, getTile, inBounds, neighbor, setTile } from './map';
import type {
  Command,
  DataPack,
  GameState,
  MonsterDef,
  ReasonCode,
  StepResult,
  Tile,
  TileKind,
} from './types';

function reject(state: GameState, reason: ReasonCode): StepResult {
  const next = cloneGameState(state);
  next.lastReason = reason;
  return { state: next, reason };
}

function accept(state: GameState, reason: ReasonCode = 'ok'): StepResult {
  state.lastReason = reason;
  return { state, reason };
}

function doorKeyField(
  kind: TileKind,
): 'yellowKeys' | 'blueKeys' | 'redKeys' | null {
  if (kind === 'yellowDoor') return 'yellowKeys';
  if (kind === 'blueDoor') return 'blueKeys';
  if (kind === 'redDoor') return 'redKeys';
  return null;
}

function keyField(
  kind: TileKind,
): 'yellowKeys' | 'blueKeys' | 'redKeys' | null {
  if (kind === 'yellowKey') return 'yellowKeys';
  if (kind === 'blueKey') return 'blueKeys';
  if (kind === 'redKey') return 'redKeys';
  return null;
}

function findMonster(pack: DataPack, id: string): MonsterDef {
  const m = pack.monsters.find((x) => x.id === id);
  if (!m) throw new Error(`unknown monster: ${id}`);
  return m;
}

function applyPickup(state: GameState, tile: Tile, pack: DataPack): void {
  const kf = keyField(tile.kind);
  if (kf) {
    state.hero[kf] += 1;
    return;
  }
  if (tile.kind === 'redPotion') {
    const item = pack.items.find((i) => i.kind === 'redPotion');
    state.hero.hp += item?.hp ?? 50;
    return;
  }
  if (tile.kind === 'bluePotion') {
    const item = pack.items.find((i) => i.kind === 'bluePotion');
    state.hero.hp += item?.hp ?? 200;
    return;
  }
  if (tile.kind === 'redGem') {
    const item = pack.items.find((i) => i.kind === 'redGem');
    state.hero.atk += item?.atk ?? 1;
    return;
  }
  if (tile.kind === 'blueGem') {
    const item = pack.items.find((i) => i.kind === 'blueGem');
    state.hero.def += item?.def ?? 1;
  }
}

function handleMove(
  state: GameState,
  dir: Extract<Command, { type: 'Move' }>,
  pack: DataPack,
): StepResult {
  if (state.mode !== 'playing') return reject(state, 'noop');

  const floor = state.floors[state.hero.floorId];
  const { x, y } = neighbor(state.hero.x, state.hero.y, dir.dir);
  if (!inBounds(floor, x, y)) return reject(state, 'out_of_bounds');

  const next = cloneGameState(state);
  const f = next.floors[next.hero.floorId];
  const dest = getTile(f, x, y);

  if (dest.kind === 'wall') return reject(state, 'blocked_wall');

  const dk = doorKeyField(dest.kind);
  if (dk) {
    if (next.hero[dk] < 1) return reject(state, 'blocked_door');
    next.hero[dk] -= 1;
    setTile(f, x, y, { kind: 'floor' });
    next.hero.x = x;
    next.hero.y = y;
    return accept(next);
  }

  if (dest.kind === 'monster') {
    const monster = findMonster(pack, dest.ref ?? '');
    if (!canDefeat(next.hero, monster)) return reject(state, 'blocked_monster');
    const damage = forecastDamage(next.hero, monster)!;
    next.hero.hp -= damage;
    next.hero.gold += monster.gold;
    setTile(f, x, y, { kind: 'floor' });
    next.hero.x = x;
    next.hero.y = y;
    return accept(next);
  }

  if (dest.kind === 'shop') {
    next.hero.x = x;
    next.hero.y = y;
    next.mode = 'shop';
    next.activeShopId = dest.ref;
    return accept(next);
  }

  if (dest.kind === 'upStairs' && f.upTarget) {
    next.hero.floorId = f.upTarget.floorId;
    next.hero.x = f.upTarget.x;
    next.hero.y = f.upTarget.y;
    return accept(next);
  }

  if (dest.kind === 'downStairs' && f.downTarget) {
    next.hero.floorId = f.downTarget.floorId;
    next.hero.x = f.downTarget.x;
    next.hero.y = f.downTarget.y;
    return accept(next);
  }

  const pickupKinds: TileKind[] = [
    'yellowKey',
    'blueKey',
    'redKey',
    'redPotion',
    'bluePotion',
    'redGem',
    'blueGem',
  ];
  if (pickupKinds.includes(dest.kind)) {
    applyPickup(next, dest, pack);
    setTile(f, x, y, { kind: 'floor' });
    next.hero.x = x;
    next.hero.y = y;
    return accept(next);
  }

  next.hero.x = x;
  next.hero.y = y;
  return accept(next);
}

function handleBuy(state: GameState, optionIndex: number, pack: DataPack): StepResult {
  if (state.mode !== 'shop' || !state.activeShopId) return reject(state, 'noop');
  const shop = pack.shops.find((s) => s.id === state.activeShopId);
  if (!shop) return reject(state, 'noop');
  const option = shop.options[optionIndex];
  if (!option) return reject(state, 'noop');
  if (state.hero.gold < option.cost) return reject(state, 'cannot_afford');

  const next = cloneGameState(state);
  next.hero.gold -= option.cost;
  next.hero.hp += option.hp ?? 0;
  next.hero.atk += option.atk ?? 0;
  next.hero.def += option.def ?? 0;
  return accept(next, 'bought');
}

export function step(state: GameState, command: Command, pack: DataPack): StepResult {
  switch (command.type) {
    case 'Move':
      return handleMove(state, command, pack);
    case 'Buy':
      return handleBuy(state, command.optionIndex, pack);
    case 'Cancel': {
      if (state.mode !== 'shop') return reject(state, 'noop');
      const next = cloneGameState(state);
      next.mode = 'playing';
      next.activeShopId = undefined;
      return accept(next, 'left_shop');
    }
    case 'Confirm':
      return reject(state, 'noop');
    default:
      return reject(state, 'noop');
  }
}
