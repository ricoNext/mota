import { describe, it, expect } from 'vitest';
import { forecastDamage, canDefeat } from '../../src/core/combat';

describe('forecastDamage', () => {
  it('returns null when hero cannot pierce monster defense', () => {
    expect(
      forecastDamage({ hp: 100, atk: 10, def: 10 }, { hp: 50, atk: 20, def: 10 }),
    ).toBeNull();
  });

  it('returns 0 when hero kills in one hit and takes no counter', () => {
    expect(
      forecastDamage({ hp: 100, atk: 50, def: 10 }, { hp: 40, atk: 15, def: 10 }),
    ).toBe(0);
  });

  it('returns multi-hit counter damage', () => {
    // hero deals 10/hit → 3 hits to kill 25 hp; counters = 2 * max(0, 20-5) = 30
    expect(
      forecastDamage({ hp: 100, atk: 20, def: 5 }, { hp: 25, atk: 20, def: 10 }),
    ).toBe(30);
  });

  it('treats monster atk <= hero def as zero per-hit damage', () => {
    expect(
      forecastDamage({ hp: 100, atk: 30, def: 50 }, { hp: 20, atk: 40, def: 10 }),
    ).toBe(0);
  });
});

describe('canDefeat', () => {
  it('is true only when damage is finite and hero survives', () => {
    expect(
      canDefeat({ hp: 100, atk: 20, def: 5 }, { hp: 25, atk: 20, def: 10 }),
    ).toBe(true);
    expect(
      canDefeat({ hp: 20, atk: 20, def: 5 }, { hp: 25, atk: 20, def: 10 }),
    ).toBe(false);
    expect(
      canDefeat({ hp: 100, atk: 10, def: 10 }, { hp: 50, atk: 20, def: 10 }),
    ).toBe(false);
  });
});
