import raw from "./game.json";

export type Effect = { kind: "Rate" | "Plus" | "State"; index: number; label: string | null; values: number[] };
export type Entry = {
  id: string;
  idx: number;
  name: string;
  engName: string;
  desc: string;
  icon: number;
  enabled: boolean;
  mastery: string;
  lv: number;
  fp: number;
  sp: number;
  hp: number;
  cooldown: number;
  targets: string[];
  weapons: number[];
  bullets: number;
  dmg: { pct: number[] | null; attType: number[] | null } | null;
  contType: number;
  durationSec: number[];
  effects: Effect[];
  temp: { type: number; value: number } | null;
  bonusDist: number;
  status?: "new" | "changed";
  changes?: [string, unknown, unknown][];
};
export type ClassInfo = {
  code: string;
  idx: number;
  race: "Bellato" | "Cora" | "Accretia";
  line: "Warrior" | "Ranger" | "Spiritualist" | "Specialist";
  grade: number;
  upgradeLv: number;
  name: string;
  slug: string;
  clientName: string;
  desc: string;
  to: string[];
  bonus: { hp: number; fp: number; sp: number };
  skills: string[];
};
export type Adjustment = { id: string; file: string; where: string; before: string; after: string; impact: string };

const data = raw as unknown as {
  generatedAt: string;
  classes: ClassInfo[];
  cskills: Record<string, Entry>;
  skills: Entry[];
  forces: Entry[];
  adjustments: Adjustment[];
};

export const generatedAt = data.generatedAt.split("-").reverse().join("/");
export const classes = data.classes;
export const cskills = data.cskills;
export const skills = data.skills.filter((s) => s.enabled);
export const forces = data.forces.filter((f) => f.enabled);
export const adjustments = data.adjustments;

export const races = [
  { id: "accretia", name: "Accretia" },
  { id: "bellato", name: "Bellato" },
  { id: "cora", name: "Cora" },
] as const;
export const raceByParam = (p: string) => races.find((r) => r.id === p);

export const lines = ["Warrior", "Ranger", "Spiritualist", "Specialist"] as const;
export const lineNote: Record<string, string> = {
  Warrior: "corpo a corpo",
  Ranger: "à distância",
  Spiritualist: "Force (magia)",
  Specialist: "suporte e engenharia",
};

export const classByCode = (code: string) => classes.find((c) => c.code === code);
export const classBySlug = (race: string, slug: string) => classes.find((c) => c.race.toLowerCase() === race && c.slug === slug);
export const classUrl = (c: ClassInfo) => `/informacoes/classes/${c.race.toLowerCase()}/${c.slug}`;
export const cameFrom = (c: ClassInfo) => classes.filter((x) => x.to.includes(c.code));
export const usedClasses = (race: string) => classes.filter((c) => c.race.toLowerCase() === race && c.grade > 0);
export const baseClasses = (race: string) => classes.filter((c) => c.race.toLowerCase() === race && c.grade === 0);
// nível em que a classe é alcançada = nível de evolução das classes de onde ela vem
export const reachLevel = (c: ClassInfo) => {
  const from = cameFrom(c);
  return from.length ? Math.min(...from.map((f) => f.upgradeLv)) : 0;
};

export const tierName: Record<string, string> = { Scholar: "Novato", Expert: "Expert", Master: "Elite", Granduer: "Master" };
export const tierOrder = ["Scholar", "Expert", "Master", "Granduer"];

export const forceTrees: { id: string; name: string; tiers: string[] }[] = [
  { id: "dark", name: "Dark", tiers: ["Dark", "Death", "Extinction", "Hell"] },
  { id: "holy", name: "Holy", tiers: ["Holy", "Hallowed", "Devine", "Revival"] },
  { id: "fire", name: "Fire", tiers: ["Fire&Light", "Flame&Swarm", "Blaze&Bright", "Hellfire&Solar"] },
  { id: "water", name: "Water", tiers: ["Aqua&Ice", "Waterfall&Frost", "Wave&Blizzard", "Flood&Nova"] },
  { id: "earth", name: "Earth", tiers: ["Earth&Poison", "Stone&Venom", "Shake&Toxin", "Shinking&Virus"] },
  { id: "wind", name: "Wind", tiers: ["Air&Electric", "Blast&Lighting", "Tornado&Thunder", "Gravity&Thunder Bird"] },
];
