import type { Dir, FloorState, GameState, Tile } from './types';

const DELTA: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export function neighbor(x: number, y: number, dir: Dir): { x: number; y: number } {
  const { dx, dy } = DELTA[dir];
  return { x: x + dx, y: y + dy };
}

export function inBounds(floor: FloorState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < floor.width && y < floor.height;
}

export function getTile(floor: FloorState, x: number, y: number): Tile {
  return floor.tiles[y][x];
}

export function cloneTiles(tiles: Tile[][]): Tile[][] {
  return tiles.map((row) => row.map((t) => ({ ...t })));
}

export function cloneFloor(floor: FloorState): FloorState {
  return {
    ...floor,
    tiles: cloneTiles(floor.tiles),
    upTarget: floor.upTarget ? { ...floor.upTarget } : undefined,
    downTarget: floor.downTarget ? { ...floor.downTarget } : undefined,
  };
}

export function cloneGameState(state: GameState): GameState {
  const floors: GameState['floors'] = {};
  for (const id of Object.keys(state.floors)) {
    floors[id] = cloneFloor(state.floors[id]);
  }
  return {
    ...state,
    hero: { ...state.hero },
    floors,
    activeShopId: state.activeShopId,
  };
}

export function setTile(floor: FloorState, x: number, y: number, tile: Tile): void {
  floor.tiles[y][x] = tile;
}
