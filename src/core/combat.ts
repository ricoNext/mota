import type { Fighter } from './types';

export function forecastDamage(hero: Fighter, monster: Fighter): number | null {
  if (hero.atk <= monster.def) return null;
  const hits = Math.ceil(monster.hp / (hero.atk - monster.def));
  const per = Math.max(0, monster.atk - hero.def);
  return per * (hits - 1);
}

export function canDefeat(hero: Fighter, monster: Fighter): boolean {
  const damage = forecastDamage(hero, monster);
  return damage !== null && hero.hp > damage;
}
