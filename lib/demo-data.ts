import type { Card, Partners, PersonKey, Reaction } from "@/lib/db/schema";

export const DEMO_PARTNERS: Partners = {
  id: 1,
  name1: "Julio",
  name2: "Sam",
  name3: null,
  name4: null,
  createdAt: new Date("2026-04-19T00:00:00Z"),
};

export const DEMO_PARTNERS_TEAM: Partners = {
  id: 1,
  name1: "Julio",
  name2: "Sam",
  name3: "JC",
  name4: "Ale Morales",
  createdAt: new Date("2026-04-19T00:00:00Z"),
};

const G = {
  // four gifs the user supplied
  u1: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGU5Y2Z2cXd0Y3Jpbjk5eHg4dDZlNHUxY2l2cm53bHV1Zm9rYm82cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FYwzWJBdtqKlem9OZy/giphy.gif",
  u2: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2puYW5ibDM1eXcxNWhweGMxcmJkZDF6ZGU3eTNzZTd3MGk2Mnh6YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Jcw7dQbWzVt9ZZhXYu/giphy.gif",
  u3: "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2dndDdjdzV0dDQ2dTZ2NDB6OHh2cnRrdnp5a2diNGR1YmJoeGZpaCZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/pj6kX3c8bRijBrl6yR/giphy.gif",
  u4: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHFmY2IwcmVraW15aTY4ODZzNmN3OWNvZG8zMnR0amtzZnR3aDY1bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1beQKedmkG85JJLg0e/giphy.gif",
  // the office reactions
  unimpressed:
    "https://media3.giphy.com/media/v1.Y2lkPTMyZjM1YTFhanhxMms3OGM5ZHR4ZXIxa2oxZHUzbWdqZTQzNHZvdzdpczBmbnBobCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2JknOsKNOGUwM/200.gif",
  awkward:
    "https://media3.giphy.com/media/v1.Y2lkPTMyZjM1YTFhanhxMms3OGM5ZHR4ZXIxa2oxZHUzbWdqZTQzNHZvdzdpczBmbnBobCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jOpLbiGmHR9S0/200.gif",
  crying:
    "https://media0.giphy.com/media/v1.Y2lkPTMyZjM1YTFhanhxMms3OGM5ZHR4ZXIxa2oxZHUzbWdqZTQzNHZvdzdpczBmbnBobCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pynZagVcYxVUk/200.gif",
  carell:
    "https://media2.giphy.com/media/v1.Y2lkPTMyZjM1YTFhODc4NmV1eTJmMzE3bnN4c281bTdwd2pkNTNpNWNkdzh4ZG8zeXA3YyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MKSqMxza1V4vC/200.gif",
  happy:
    "https://media0.giphy.com/media/v1.Y2lkPTMyZjM1YTFhODc4NmV1eTJmMzE3bnN4c281bTdwd2pkNTNpNWNkdzh4ZG8zeXA3YyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cXblnKXr2BQOaYnTni/200.gif",
  yes: "https://media4.giphy.com/media/v1.Y2lkPTMyZjM1YTFhcmJudXB2b2NnMnB3b2NydDNzZ3A2YWJubGlmM2E3bDZvZDMyNjk4dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Jq4mtIzDVFU4nqXETO/200.gif",
  notHappening:
    "https://media2.giphy.com/media/v1.Y2lkPTMyZjM1YTFhcmJudXB2b2NnMnB3b2NydDNzZ3A2YWJubGlmM2E3bDZvZDMyNjk4dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/12ClTeBg4yvkiI/200.gif",
  dwight:
    "https://media2.giphy.com/media/v1.Y2lkPTMyZjM1YTFhdWxwczBmYW4xbmdtMmd4OW5sdjh0amNqZXpicG51OHFlam9ic25sMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FY7OvrruPPSW4/200.gif",
  stanley:
    "https://media3.giphy.com/media/v1.Y2lkPTMyZjM1YTFhdTcxdDFpaGN1MjIwZmIyZjV0c3NndjQ3cHQwbzFqODc5dzVwYTNwbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/dE8BENPVMXoqc/200.gif",
  pam: "https://media1.giphy.com/media/v1.Y2lkPTMyZjM1YTFhYTdndmRkbXQ5Nzh5ZG81d3B2MHRsbTcydjlyb2lrZHIzZG5wcnlxbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pV0lVLeA0JXjBiO5Cp/200.gif",
  jenna:
    "https://media0.giphy.com/media/v1.Y2lkPTMyZjM1YTFhYTdndmRkbXQ5Nzh5ZG81d3B2MHRsbTcydjlyb2lrZHIzZG5wcnlxbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xT77Y0CoGA6Nu24PzW/200.gif",
} as const;

const D = {
  u: { w: 240, h: 240 },
  s: { w: 200, h: 200 },
  w: { w: 360, h: 200 },
} as const;

type EmojiR = { kind: "emoji"; content: string };
type GifR = { kind: "gif"; content: string; w: number; h: number };
type R = EmojiR | GifR;

type Seed = {
  person: PersonKey;
  daysAgo: number;
  type: "note" | "image" | "note_image" | "reflection";
  text?: string;
  imageUrl?: string;
  imageCaption?: string;
  did?: string;
  learned?: string;
  felt?: string;
  feltImageUrl?: string;
  reactions?: R[];
};

const SEEDS: Seed[] = [
  // ─── 12 days ago — Mon, kickoff ───────────────────────────────────────
  {
    person: "name2",
    daysAgo: 12,
    type: "reflection",
    did: "- Empezamos el programa! Sesión 0 de intro.\n- Conocí al grupo. @JC y @Ale Morales se ven con muchas ganas.\n- Saqué la libreta nueva, oficialmente estrenada.",
    learned:
      "Hay 5 sesiones + un proyecto final. Cada uno explora una herramienta a fondo y la presenta al resto.",
    felt: "🚀",
    reactions: [
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "🚀" },
      { kind: "gif", content: G.happy, ...D.w },
    ],
  },
  {
    person: "name1",
    daysAgo: 12,
    type: "reflection",
    did: "- Primer día. Vi la intro y la sesión 0.\n- Apuntes a mano que tendré que pasar a digital después (¬¬).",
    learned:
      "Que viene contenido para 5 sesiones. Se viene un mes intenso pero bien planteado.",
    felt: "🤔 mezcla de hype y susto sano",
    reactions: [
      { kind: "emoji", content: "👀" },
      { kind: "emoji", content: "💪" },
    ],
  },

  // ─── 11 days ago — Tue ─────────────────────────────────────────────────
  {
    person: "name1",
    daysAgo: 11,
    type: "reflection",
    did: "- Probé Cursor con los flows que enseñaron ayer.\n- Lo apliqué a un bug random del journal y lo arregló en 2 prompts.",
    learned:
      "La diferencia entre \"autocomplete con esteroides\" y \"agente que entiende el repo\" es enorme.",
    felt: "😵‍💫 information overload pero del bueno",
    reactions: [
      { kind: "emoji", content: "🤯" },
      { kind: "gif", content: G.u1, ...D.u },
      { kind: "emoji", content: "🫠" },
    ],
  },
  {
    person: "name2",
    daysAgo: 11,
    type: "reflection",
    did: "- Pasé los apuntes a digital.\n- Empecé a montar la plantilla de Figjam para los siguientes días: lo bueno / lo mejorable / preguntas / ideas.",
    learned: "Un buen formato de notas ahorra reuniones después.",
    felt: "✍️",
    reactions: [
      { kind: "emoji", content: "🧠" },
      { kind: "emoji", content: "💯" },
    ],
  },

  // ─── 10 days ago — Wed, prompts session ───────────────────────────────
  {
    person: "name1",
    daysAgo: 10,
    type: "reflection",
    did: "- Sesión de prompts.\n- Reescribí 3 prompts viejos a ver si mejoraba el output. Spoiler: sí.",
    learned:
      "La estructura **rol → contexto → ejemplo → tarea** funciona incluso con modelos pequeños.",
    felt: "💡",
    reactions: [
      { kind: "emoji", content: "💡" },
      { kind: "emoji", content: "🔥" },
      { kind: "gif", content: G.yes, ...D.w },
    ],
  },
  {
    person: "name1",
    daysAgo: 10,
    type: "note_image",
    imageUrl: G.u2,
    text: "cuando el prompt de pronto funciona y no sabes ni por qué",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "emoji", content: "😂" },
      { kind: "emoji", content: "🙌" },
      { kind: "gif", content: G.carell, w: 358, h: 200 },
    ],
  },
  {
    person: "name2",
    daysAgo: 10,
    type: "reflection",
    did: "- Sesión de prompts con ejercicios prácticos.\n- Apuntes en Figjam según iba (la plantilla aguanta!).",
    learned:
      "Hay un punto en el que el prompt deja de mejorar y solo cambia el modelo lo arregla.",
    felt: "🧠",
    reactions: [
      { kind: "emoji", content: "🧠" },
      { kind: "emoji", content: "👀" },
    ],
  },

  // ─── 9 days ago — Thu, news day ──────────────────────────────────────
  {
    person: "name2",
    daysAgo: 9,
    type: "reflection",
    did: "- Compartí las noticias del miércoles con el grupo.\n- Buen debate sobre Gemma y los modelos locales.\n- Pasé el resumen al doc compartido.",
    learned:
      "La gente se anima a opinar cuando llevas tú el primer punto. No esperes consenso espontáneo.",
    felt: "🎤",
    reactions: [
      { kind: "emoji", content: "🎤" },
      { kind: "emoji", content: "👏" },
      { kind: "emoji", content: "👏" },
      { kind: "gif", content: G.happy, w: 240, h: 200 },
    ],
  },
  {
    person: "name2",
    daysAgo: 9,
    type: "note",
    text: "si os perdisteis el debate, dejé un resumen en el doc compartido 👇",
    reactions: [{ kind: "emoji", content: "🙏" }],
  },
  {
    person: "name1",
    daysAgo: 9,
    type: "reflection",
    did: "- Día de noticias. Repasé los links que mandó Sam.\n- Abrí media docena de pestañas que voy a leer \"luego\" 😅",
    learned: "Tengo que dejar de decir \"luego\".",
    felt: "🥲",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "gif", content: G.stanley, w: 200, h: 200 },
    ],
  },

  // ─── 8 days ago — Fri, end of week 1 ─────────────────────────────────
  {
    person: "name1",
    daysAgo: 8,
    type: "reflection",
    did: "- Cerrar la semana. Repasé apuntes.\n- Puse en limpio la lista de herramientas a probar el lunes.",
    learned:
      "Hacer la lista del lunes el viernes >>> hacerla el lunes a las 9am.",
    felt: "🍻",
    reactions: [
      { kind: "emoji", content: "🍻" },
      { kind: "emoji", content: "💯" },
    ],
  },
  {
    person: "name2",
    daysAgo: 8,
    type: "reflection",
    did: "- Última sesión de la semana, terminé apuntes 1/5.\n- Probé un poco ComfyUI por curiosidad.",
    learned:
      "ComfyUI tiene curva, pero el potencial para video con personajes consistentes es brutal.",
    felt: "👀",
    reactions: [
      { kind: "emoji", content: "👀" },
      { kind: "emoji", content: "🔥" },
      { kind: "gif", content: G.u3, ...D.u },
    ],
  },

  // ─── 7 days ago — Sat, weekend, light ────────────────────────────────
  {
    person: "name1",
    daysAgo: 7,
    type: "note",
    text: "weekend brain. dejé el portátil cerrado todo el sábado. recomiendo.",
    reactions: [
      { kind: "emoji", content: "🛌" },
      { kind: "emoji", content: "🙌" },
      { kind: "gif", content: G.pam, w: 200, h: 200 },
    ],
  },

  // ─── 6 days ago — Sun ────────────────────────────────────────────────
  {
    person: "name2",
    daysAgo: 6,
    type: "note_image",
    imageUrl: G.u4,
    text: "domingo de sofá. preparándome mentalmente para mañana",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "emoji", content: "🛋️" },
    ],
  },

  // ─── 5 days ago — Mon 04-27 — REAL DATA ──────────────────────────────
  {
    person: "name1",
    daysAgo: 5,
    type: "note",
    text: "Buenos díasss! Ayer se me pasó un poco hacer el recap porque me tuve que ir corriendo así que lo dejo ahora jaja",
    reactions: [
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "😂" },
    ],
  },
  {
    person: "name1",
    daysAgo: 5,
    type: "reflection",
    did: "- Revisar y hacer apuntes de las slides\n- Configurar el slack en el teléfono y portátil\n- Ojear las herramientas del backlog (sobretodo el copilot, que no lo había probado)",
    reactions: [
      { kind: "emoji", content: "👀" },
      { kind: "emoji", content: "💪" },
    ],
  },
  {
    person: "name2",
    daysAgo: 5,
    type: "reflection",
    did: "- Revisé la primera sesión 1/5\n- Me cree un formato en Figjam para colocar: lo bueno, lo mejorable, preguntas e ideas sobre cada sesión.\n- Ya tengo el Slack configurado en el teléfono.\n- Busqué algunas noticias interesantes que les compartiré el jueves.",
    learned:
      "Muchísimo. Fue un día cargado de información, pero lograron condensarlo bien y hacerlo ameno @JC @Ale Morales 👏",
    felt: "🚀👨‍🚀",
    reactions: [
      { kind: "emoji", content: "🚀" },
      { kind: "emoji", content: "👨‍🚀" },
      { kind: "emoji", content: "👨‍🚀" },
      { kind: "emoji", content: "🙏" },
      { kind: "gif", content: G.happy, w: 240, h: 200 },
    ],
  },

  // ─── 4 days ago — Tue 04-28 — REAL DATA ──────────────────────────────
  {
    person: "name2",
    daysAgo: 4,
    type: "reflection",
    did: "- Revisión de sesiones 3/5\n- Me vi con detenimiento el proceso de exploración que proponen para empezar a explorar Gemma 4 y ya empecé a investigar un poco.\n- Agregué ComfyUI al Backlog. Como opción gratis y local para crear video con personajes consistentes.",
    learned:
      "- Diferencia entre IA open source y closed source.\n- Que hay una posible tendencia a tener IAs locales en empresas y hogares, y por allí va Gemma4. Imaginen, ya no depender de servidores externos ni pagar suscripciones por ello, sino invertir solo en tus propios recursos en casa (Buen disco duro, RAM y GPU) y usar la IA sin preocuparte por privacidad ni conexión a internet.",
    felt: "🤔💭",
    reactions: [
      { kind: "emoji", content: "🤔" },
      { kind: "emoji", content: "💭" },
      { kind: "emoji", content: "🔥" },
      { kind: "gif", content: G.dwight, w: 356, h: 200 },
    ],
  },
  {
    person: "name1",
    daysAgo: 4,
    type: "reflection",
    did: "- He acabado de ver las slides y hacerme los apuntes\n- Hecho la ficha de google stitch en el AI lab (me falta hacer la demo)",
    learned:
      "- A usar google stitch\n- Suelo descartar este tipo de herramientas porque se venden con el discurso de que \"se acabaron los diseñadores\" y luego los resultados son bastante mediocres. Sin embargo, este ejercicio de usarla a fondo y explorarla me ha abierto un poco los ojos a los distintos usos que puede tener más allá de usarla como herramienta de diseño final. Puede cubrir bien un nicho concreto o parte del proceso (si somos conscientes de sus carencias y ajustamos las expectativas en consecuencia)",
    feltImageUrl: G.u4,
    reactions: [
      { kind: "emoji", content: "👀" },
      { kind: "emoji", content: "💯" },
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "🤝" },
    ],
  },

  // ─── 3 days ago — Wed 04-29 ──────────────────────────────────────────
  {
    person: "name1",
    daysAgo: 3,
    type: "reflection",
    did: "- Hice la demo de Stitch en el AI lab. Salió mejor de lo que esperaba.\n- Mostré ejemplos reales de cosas que sí podía hacer (en lugar de pelearme con las que no).",
    learned: "Cuando enseñas una herramienta, la entiendes el doble.",
    felt: "😎",
    reactions: [
      { kind: "emoji", content: "🎯" },
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "🔥" },
      { kind: "gif", content: G.carell, w: 358, h: 200 },
    ],
  },
  {
    person: "name1",
    daysAgo: 3,
    type: "note",
    text: "para los curiosos: dejé los **3 casos de uso** que más me convencieron de Stitch en el doc compartido. Ojito que es opinión personal.",
    reactions: [
      { kind: "emoji", content: "📌" },
      { kind: "emoji", content: "🙏" },
    ],
  },
  {
    person: "name2",
    daysAgo: 3,
    type: "reflection",
    did: "- Sesión 4/5.\n- Empecé a montar el playground con Gemma local en mi máquina.",
    learned: "Mi RAM se queja, pero funciona. Más o menos.",
    felt: "🛠️",
    reactions: [
      { kind: "emoji", content: "🛠️" },
      { kind: "emoji", content: "💻" },
      { kind: "gif", content: G.unimpressed, w: 400, h: 200 },
    ],
  },

  // ─── 2 days ago — Thu 04-30 ──────────────────────────────────────────
  {
    person: "name1",
    daysAgo: 2,
    type: "reflection",
    did: "- Probé montar un agente con MCP que lee mis notas de standup y las resume semanalmente.\n- Funciona regular, pero ya da signos de vida.",
    learned:
      "La parte difícil no es el agente — es decidir qué NO debe poder hacer.",
    felt: "🤯",
    reactions: [
      { kind: "emoji", content: "🤯" },
      { kind: "emoji", content: "👀" },
      { kind: "gif", content: G.u2, ...D.u },
    ],
  },
  {
    person: "name2",
    daysAgo: 2,
    type: "reflection",
    did: "- Compartí noticias del miércoles + sesión 5/5 (la última!).\n- Empezamos a pensar en el proyecto final.",
    learned:
      "Cerrar bien una serie de sesiones es tan importante como abrirlas.",
    felt: "🎬",
    reactions: [
      { kind: "emoji", content: "🎬" },
      { kind: "emoji", content: "🥲" },
      { kind: "gif", content: G.crying, w: 200, h: 200 },
    ],
  },
  {
    person: "name2",
    daysAgo: 2,
    type: "note_image",
    imageUrl: G.u3,
    text: "end of season vibes",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "gif", content: G.jenna, w: 200, h: 200 },
    ],
  },

  // ─── 1 day ago — Fri 05-01 ───────────────────────────────────────────
  {
    person: "name1",
    daysAgo: 1,
    type: "reflection",
    did: "- Día de retro. Hicimos balance de las 5 sesiones y decidimos los siguientes pasos.\n- Salí con 3 cosas claras y 2 dudas honestas.",
    learned:
      "De todas las herramientas, las que se quedan son las que resuelven un problema que YA tenías.",
    felt: "🧘",
    reactions: [
      { kind: "emoji", content: "💯" },
      { kind: "emoji", content: "🧘" },
      { kind: "emoji", content: "🙌" },
    ],
  },
  {
    person: "name2",
    daysAgo: 1,
    type: "reflection",
    did: "- Cerré apuntes 5/5.\n- Pasé todo a un único doc para compartir con el resto del equipo.\n- Etiqueté @JC y @Ale Morales para que dieran feedback.",
    learned: "Documentar al final >>> documentar nunca.",
    felt: "✅",
    reactions: [
      { kind: "emoji", content: "✅" },
      { kind: "emoji", content: "📚" },
      { kind: "emoji", content: "🙏" },
      { kind: "gif", content: G.yes, w: 356, h: 200 },
    ],
  },
  {
    person: "name2",
    daysAgo: 1,
    type: "note_image",
    imageUrl: G.u1,
    text: "el doc final está LISTO",
    reactions: [
      { kind: "emoji", content: "🎉" },
      { kind: "emoji", content: "🎉" },
      { kind: "emoji", content: "🙌" },
      { kind: "gif", content: G.happy, w: 240, h: 200 },
    ],
  },

  // ─── today — composer-only on Julio's side; nothing pre-seeded ──────
];

function isoDaysAgo(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() - n);
  return dt.toISOString().slice(0, 10);
}

function buildFromSeeds(seeds: Seed[], today: string): {
  cards: Card[];
  reactions: Reaction[];
} {
  const cards: Card[] = [];
  const reactions: Reaction[] = [];

  // group seeds by (person, date) so positions are sane within each day
  const grouped = new Map<string, Seed[]>();
  for (const s of seeds) {
    const date = isoDaysAgo(today, s.daysAgo);
    const key = `${s.person}__${date}`;
    const arr = grouped.get(key) ?? [];
    arr.push(s);
    grouped.set(key, arr);
  }

  let cardCounter = 0;
  let reactionCounter = 0;
  const baseTime = Date.now();

  for (const [key, list] of grouped) {
    const [, date] = key.split("__");
    for (let i = 0; i < list.length; i++) {
      const s = list[i]!;
      // higher position renders first; the first item in `list` is the
      // newest card of that day, so it gets the highest position.
      const position = list.length - i;
      const cardId = `demo-c-${++cardCounter}`;
      const offsetMs = (s.daysAgo * 86400 + i * 3600) * 1000;
      const createdAt = new Date(baseTime - offsetMs);
      cards.push({
        id: cardId,
        personKey: s.person,
        date: date!,
        type: s.type,
        text: s.text ?? null,
        imageUrl: s.imageUrl ?? null,
        imageCaption: s.imageCaption ?? null,
        reflectionDid: s.did ?? null,
        reflectionLearned: s.learned ?? null,
        reflectionFelt: s.felt ?? null,
        reflectionFeltImageUrl: s.feltImageUrl ?? null,
        position,
        createdAt,
        updatedAt: createdAt,
      });

      const rxs = s.reactions ?? [];
      for (let j = 0; j < rxs.length; j++) {
        const r = rxs[j]!;
        reactionCounter += 1;
        const rCreatedAt = new Date(createdAt.getTime() + (j + 1) * 60_000);
        if (r.kind === "emoji") {
          reactions.push({
            id: `demo-r-${reactionCounter}`,
            cardId,
            kind: "emoji",
            content: r.content,
            width: null,
            height: null,
            createdAt: rCreatedAt,
          });
        } else {
          reactions.push({
            id: `demo-r-${reactionCounter}`,
            cardId,
            kind: "gif",
            content: r.content,
            width: r.w,
            height: r.h,
            createdAt: rCreatedAt,
          });
        }
      }
    }
  }

  return { cards, reactions };
}

export function buildDemoData(today: string): {
  cards: Card[];
  reactions: Reaction[];
} {
  return buildFromSeeds(SEEDS, today);
}

// ─── Team demo (4 people): Julio + Sam + JC (name3) + Ale (name4) ─────
// JC and Ale are already mentioned by name in the 2-person seeds as the
// program facilitators. Their seeds give them the facilitator voice
// (prepping sessions, sharing news, giving feedback) so the existing
// references in Julio/Sam's posts land naturally.
const SEEDS_TEAM_EXTRA: Seed[] = [
  // ─── 12 days ago — Mon, kickoff ───────────────────────────────────────
  {
    person: "name3",
    daysAgo: 12,
    type: "reflection",
    did: "- Día 1!! Sesión 0 de intro al programa.\n- Material listo, slides revisadas, café cargado.\n- Conocimos al grupo: @Julio y @Sam ya con preguntas buenas en la primera hora.",
    learned:
      "El primer día se gana siendo claro con las expectativas. 5 sesiones, 1 proyecto final, sin atajos.",
    felt: "🎬",
    reactions: [
      { kind: "emoji", content: "🎬" },
      { kind: "emoji", content: "🙌" },
      { kind: "gif", content: G.happy, w: 240, h: 200 },
    ],
  },
  {
    person: "name4",
    daysAgo: 12,
    type: "reflection",
    did: "- Co-facilité la sesión 0 con @JC.\n- Repartimos las herramientas a explorar entre el grupo.\n- Buen ambiente desde el minuto 1.",
    learned:
      "Si el grupo se ríe en la primera media hora, el resto del programa fluye distinto.",
    felt: "🤝",
    reactions: [
      { kind: "emoji", content: "🤝" },
      { kind: "emoji", content: "🚀" },
    ],
  },

  // ─── 11 days ago — Tue ────────────────────────────────────────────────
  {
    person: "name3",
    daysAgo: 11,
    type: "reflection",
    did: "- Preparé la sesión de prompts para mañana.\n- Subí ejemplos buenos / malos al doc compartido.",
    learned:
      "Un mal prompt no es obvio hasta que ves el output al lado del bueno. Por eso siempre side-by-side.",
    felt: "📝",
    reactions: [
      { kind: "emoji", content: "📝" },
      { kind: "emoji", content: "💡" },
    ],
  },
  {
    person: "name4",
    daysAgo: 11,
    type: "note",
    text: "subí una plantilla de Figjam para tomar notas durante las sesiones — la verdad es que @Sam ya la tenía montada mejor 😅",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "emoji", content: "🙌" },
    ],
  },

  // ─── 10 days ago — Wed, prompts session ───────────────────────────────
  {
    person: "name3",
    daysAgo: 10,
    type: "reflection",
    did: "- Sesión de prompts.\n- Hicimos en vivo 3 reescrituras con el grupo. @Julio sacó un prompt bastante limpio en el segundo intento.",
    learned:
      "Enseñar en vivo > slides. Cuando el grupo ve el output cambiando, ya no se les olvida la estructura.",
    felt: "🔥",
    reactions: [
      { kind: "emoji", content: "🔥" },
      { kind: "emoji", content: "🙌" },
      { kind: "gif", content: G.yes, w: 356, h: 200 },
    ],
  },
  {
    person: "name4",
    daysAgo: 10,
    type: "note_image",
    imageUrl: G.u3,
    text: "el momento exacto en el que el grupo entiende lo que es \"contexto suficiente\"",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "emoji", content: "💡" },
      { kind: "gif", content: G.carell, w: 358, h: 200 },
    ],
  },

  // ─── 9 days ago — Thu, news day ──────────────────────────────────────
  {
    person: "name3",
    daysAgo: 9,
    type: "reflection",
    did: "- Curé los links para el news round-up.\n- @Sam llevó el debate sobre Gemma — se notó que venía leído.",
    learned:
      "Las mejores discusiones nacen cuando el facilitador deja de hablar a tiempo.",
    felt: "🎤",
    reactions: [
      { kind: "emoji", content: "🎤" },
      { kind: "emoji", content: "👏" },
    ],
  },
  {
    person: "name4",
    daysAgo: 9,
    type: "note",
    text: "subí los links del debate al doc compartido por si alguien quiere releer 📎",
    reactions: [
      { kind: "emoji", content: "🙏" },
      { kind: "emoji", content: "📎" },
    ],
  },

  // ─── 8 days ago — Fri, end of week 1 ─────────────────────────────────
  {
    person: "name3",
    daysAgo: 8,
    type: "reflection",
    did: "- Cierre de semana 1.\n- Repaso rápido con el grupo de lo que ha calado y lo que se ha quedado en el tintero.",
    learned:
      "Una semana = suficiente para que aparezcan las preguntas de verdad.",
    felt: "🍻",
    reactions: [
      { kind: "emoji", content: "🍻" },
      { kind: "emoji", content: "💯" },
      { kind: "gif", content: G.happy, w: 240, h: 200 },
    ],
  },
  {
    person: "name4",
    daysAgo: 8,
    type: "reflection",
    did: "- Empecé a explorar ComfyUI por mi cuenta.\n- Le pasé un par de workflows a @Sam que también andaba mirando.",
    learned:
      "ComfyUI no es para todo el mundo, pero el que conecte con el flujo de nodos no vuelve atrás.",
    felt: "🧩",
    reactions: [
      { kind: "emoji", content: "🧩" },
      { kind: "emoji", content: "👀" },
    ],
  },

  // ─── 7 days ago — Sat, weekend ───────────────────────────────────────
  {
    person: "name4",
    daysAgo: 7,
    type: "note",
    text: "sábado de no abrir el portátil. plan recomendado por @Julio 🛌",
    reactions: [
      { kind: "emoji", content: "🛌" },
      { kind: "gif", content: G.pam, w: 200, h: 200 },
    ],
  },

  // ─── 5 days ago — Mon ────────────────────────────────────────────────
  {
    person: "name3",
    daysAgo: 5,
    type: "reflection",
    did: "- Sesión 1 con el grupo entero.\n- Quedó claro el esquema: cada uno explora una herramienta y la presenta al resto.\n- Le di feedback a @Julio sobre su propuesta de Stitch.",
    learned:
      "Empezar pidiendo entregables concretos cambia la energía del programa entero.",
    felt: "🎯",
    reactions: [
      { kind: "emoji", content: "🎯" },
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "💯" },
    ],
  },
  {
    person: "name4",
    daysAgo: 5,
    type: "note",
    text: "me encantó la plantilla que se montó @Sam para los apuntes — la voy a reusar 👀",
    reactions: [
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "📝" },
    ],
  },

  // ─── 4 days ago — Tue ────────────────────────────────────────────────
  {
    person: "name4",
    daysAgo: 4,
    type: "reflection",
    did: "- Acompañé a @Julio en la prep de la demo de Stitch.\n- Hicimos 2 rondas de iteración sobre los casos de uso.",
    learned:
      "Cuando preparas una demo con alguien, sales aprendiendo tú también — no es solo dar feedback.",
    felt: "🤝",
    reactions: [
      { kind: "emoji", content: "🤝" },
      { kind: "emoji", content: "👏" },
      { kind: "gif", content: G.yes, w: 356, h: 200 },
    ],
  },
  {
    person: "name3",
    daysAgo: 4,
    type: "reflection",
    did: "- Preparé los materiales para la sesión 3.\n- Probé yo solo el playground local de Gemma para anticipar dudas.",
    learned:
      "Si lo pruebas tú primero, los errores que ves son los mismos que va a ver el grupo en vivo.",
    felt: "🛠️",
    reactions: [
      { kind: "emoji", content: "🛠️" },
      { kind: "emoji", content: "💻" },
    ],
  },

  // ─── 3 days ago — Wed ────────────────────────────────────────────────
  {
    person: "name3",
    daysAgo: 3,
    type: "reflection",
    did: "- Sesión 4 — playground en vivo.\n- @Sam montó Gemma local en su máquina y aguantó (a duras penas, pero aguantó).\n- @Julio hizo la demo de Stitch y le salió redonda.",
    learned:
      "Una sesión sale bien cuando el grupo ya no necesita al facilitador para destrabarse.",
    felt: "🚀",
    reactions: [
      { kind: "emoji", content: "🚀" },
      { kind: "emoji", content: "🙌" },
      { kind: "emoji", content: "🔥" },
      { kind: "gif", content: G.happy, w: 240, h: 200 },
    ],
  },
  {
    person: "name4",
    daysAgo: 3,
    type: "note_image",
    imageUrl: G.u2,
    text: "viendo a @Julio explicar Stitch como si llevara meses con la herramienta",
    reactions: [
      { kind: "emoji", content: "😂" },
      { kind: "emoji", content: "👏" },
      { kind: "gif", content: G.carell, w: 358, h: 200 },
    ],
  },

  // ─── 2 days ago — Thu ────────────────────────────────────────────────
  {
    person: "name3",
    daysAgo: 2,
    type: "reflection",
    did: "- Sesión 5/5, la última.\n- Cerramos el bloque de noticias y empezamos a hablar del proyecto final.",
    learned:
      "Cerrar bien una serie pesa lo mismo que abrirla. No hay que ahorrarse el ritual.",
    felt: "🎬",
    reactions: [
      { kind: "emoji", content: "🎬" },
      { kind: "emoji", content: "🥲" },
      { kind: "gif", content: G.crying, w: 200, h: 200 },
    ],
  },
  {
    person: "name4",
    daysAgo: 2,
    type: "reflection",
    did: "- Me llevé las notas de las 5 sesiones a un único doc.\n- Empecé a anotar qué reusaría en la siguiente edición.",
    learned:
      "El programa siguiente se diseña con los apuntes del programa anterior, no desde cero.",
    felt: "📚",
    reactions: [
      { kind: "emoji", content: "📚" },
      { kind: "emoji", content: "✅" },
    ],
  },

  // ─── 1 day ago — Fri, retro ──────────────────────────────────────────
  {
    person: "name3",
    daysAgo: 1,
    type: "reflection",
    did: "- Retro con el grupo. Buena lista de lo que mantengo y lo que cambio.\n- @Julio y @Sam dejaron feedback honesto, justo el que hace falta.",
    learned:
      "La retro útil pasa cuando el grupo ya tiene confianza para decir lo incómodo.",
    felt: "🧘",
    reactions: [
      { kind: "emoji", content: "🧘" },
      { kind: "emoji", content: "💯" },
      { kind: "emoji", content: "🙏" },
    ],
  },
  {
    person: "name4",
    daysAgo: 1,
    type: "reflection",
    did: "- Pasé el doc final con el resumen de las 5 sesiones.\n- Etiqueté al grupo y al equipo extendido para que dejaran feedback.",
    learned:
      "Documentar al final >>> documentar nunca. (gracias @Sam por la frase, te la robo).",
    felt: "✅",
    reactions: [
      { kind: "emoji", content: "✅" },
      { kind: "emoji", content: "🙏" },
      { kind: "gif", content: G.yes, w: 356, h: 200 },
    ],
  },

  // ─── today — composer-only on Julio's side; nothing pre-seeded ──────
];

export function buildDemoDataTeam(today: string): {
  cards: Card[];
  reactions: Reaction[];
} {
  return buildFromSeeds([...SEEDS, ...SEEDS_TEAM_EXTRA], today);
}
