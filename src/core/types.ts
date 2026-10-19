export type Dir = 'up' | 'down' | 'left' | 'right';

export type TileKind =
  | 'floor'
  | 'wall'
  | 'upStairs'
  | 'downStairs'
  | 'yellowDoor'
  | 'blueDoor'
  | 'redDoor'
  | 'yellowKey'
  | 'blueKey'
  | 'redKey'
  | 'redPotion'
  | 'bluePotion'
  | 'redGem'
  | 'blueGem'
  | 'monster'
  | 'shop';

export interface Tile {
  kind: TileKind;
  /** monster id / shop id when kind is monster or shop */
  ref?: string;
}

export interface Fighter {
  hp: number;
  atk: number;
  def: number;
}

export interface Hero extends Fighter {
  floorId: string;
  x: number;
  y: number;
  gold: number;
  yellowKeys: number;
  blueKeys: number;
  redKeys: number;
}

export interface FloorState {
  id: string;
  width: number;
  height: number;
  tiles: Tile[][];
  upTarget?: { floorId: string; x: number; y: number };
  downTarget?: { floorId: string; x: number; y: number };
}

export type GameMode = 'playing' | 'shop';

export type ReasonCode =
  | 'ok'
  | 'blocked_wall'
  | 'blocked_door'
  | 'blocked_monster'
  | 'out_of_bounds'
  | 'noop'
  | 'bought'
  | 'cannot_afford'
  | 'left_shop';

export interface GameState {
  hero: Hero;
  floors: Record<string, FloorState>;
  mode: GameMode;
  activeShopId?: string;
  lastReason: ReasonCode;
}

export type Command =
  | { type: 'Move'; dir: Dir }
  | { type: 'Confirm' }
  | { type: 'Cancel' }
  | { type: 'Buy'; optionIndex: number };

export interface StepResult {
  state: GameState;
  reason: ReasonCode;
}

export interface MonsterDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
}

export interface ItemDef {
  id: string;
  kind: TileKind;
  hp?: number;
  atk?: number;
  def?: number;
}

export interface ShopOption {
  label: string;
  cost: number;
  hp?: number;
  atk?: number;
  def?: number;
}

export interface ShopDef {
  id: string;
  name: string;
  options: ShopOption[];
}

export interface FloorData {
  id: string;
  width: number;
  height: number;
  /** cell tokens: "wall" | "floor" | "yellowKey" | "monster:slime" | "shop:shop-f2" | ... */
  grid: string[][];
  upTarget?: { floorId: string; x: number; y: number };
  downTarget?: { floorId: string; x: number; y: number };
}

export interface DataPack {
  id: string;
  name: string;
  start: {
    floorId: string;
    x: number;
    y: number;
    hp: number;
    atk: number;
    def: number;
    gold: number;
  };
  monsters: MonsterDef[];
  items: ItemDef[];
  shops: ShopDef[];
  floors: FloorData[];
}
