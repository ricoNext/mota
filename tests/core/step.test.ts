import { describe, it, expect } from 'vitest';
import { step } from '../../src/core/step';
import type { DataPack, GameState, FloorState, Tile } from '../../src/core/types';

export function tile(kind: Tile['kind'], ref?: string): Tile {
  return ref ? { kind, ref } : { kind };
}

export function makeFloor(partial?: Partial<FloorState>): FloorState {
  const width = 5;
  const height = 5;
  const tiles: Tile[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => tile('floor')),
  );
  for (let x = 0; x < width; x++) {
    tiles[0][x] = tile('wall');
    tiles[height - 1][x] = tile('wall');
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = tile('wall');
    tiles[y][width - 1] = tile('wall');
  }
  return {
    id: 'f1',
    width,
    height,
    tiles,
    ...partial,
  };
}

export function basePack(): DataPack {
  return {
    id: 'test',
    name: 'test',
    start: { floorId: 'f1', x: 2, y: 2, hp: 100, atk: 10, def: 10, gold: 0 },
    monsters: [],
    items: [
      { id: 'yellowKey', kind: 'yellowKey' },
      { id: 'blueKey', kind: 'blueKey' },
      { id: 'redKey', kind: 'redKey' },
    ],
    shops: [],
    floors: [],
  };
}

export function baseState(floor?: FloorState): GameState {
  const f = floor ?? makeFloor();
  return {
    hero: {
      floorId: f.id,
      x: 2,
      y: 2,
      hp: 100,
      atk: 10,
      def: 10,
      gold: 0,
      yellowKeys: 0,
      blueKeys: 0,
      redKeys: 0,
    },
    floors: { [f.id]: f },
    mode: 'playing',
    lastReason: 'ok',
  };
}

describe('step move', () => {
  it('moves onto floor', () => {
    const state = baseState();
    const result = step(state, { type: 'Move', dir: 'up' }, basePack());
    expect(result.reason).toBe('ok');
    expect(result.state.hero).toMatchObject({ x: 2, y: 1 });
    expect(state.hero.y).toBe(2);
  });

  it('blocks on wall', () => {
    const state = baseState();
    const mid = step(state, { type: 'Move', dir: 'up' }, basePack()).state;
    const result = step(mid, { type: 'Move', dir: 'up' }, basePack());
    expect(result.reason).toBe('blocked_wall');
    expect(result.state.hero).toMatchObject({ x: 2, y: 1 });
  });

  it('blocks when moving into border wall', () => {
    const f = makeFloor();
    const state = baseState(f);
    state.hero.x = 1;
    state.hero.y = 1;
    const result = step(state, { type: 'Move', dir: 'left' }, basePack());
    expect(result.reason).toBe('blocked_wall');
  });

  it('picks yellow key and opens yellow door', () => {
    const f = makeFloor();
    f.tiles[2][3] = tile('yellowKey');
    f.tiles[1][2] = tile('yellowDoor');
    const state = baseState(f);
    let r = step(state, { type: 'Move', dir: 'right' }, basePack());
    expect(r.reason).toBe('ok');
    expect(r.state.hero.yellowKeys).toBe(1);
    expect(r.state.floors.f1.tiles[2][3].kind).toBe('floor');
    r = step(r.state, { type: 'Move', dir: 'left' }, basePack());
    r = step(r.state, { type: 'Move', dir: 'up' }, basePack());
    expect(r.reason).toBe('ok');
    expect(r.state.hero.yellowKeys).toBe(0);
    expect(r.state.hero).toMatchObject({ x: 2, y: 1 });
    expect(r.state.floors.f1.tiles[1][2].kind).toBe('floor');
  });

  it('blocks door without key', () => {
    const f = makeFloor();
    f.tiles[1][2] = tile('yellowDoor');
    const state = baseState(f);
    const r = step(state, { type: 'Move', dir: 'up' }, basePack());
    expect(r.reason).toBe('blocked_door');
    expect(r.state.hero).toMatchObject({ x: 2, y: 2 });
    expect(r.state.hero.yellowKeys).toBe(0);
  });
});
