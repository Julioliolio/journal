export const metadata = { title: "journal — reflection mockups" };

const SAMPLE = {
  did: "Long walk with Sam after lunch, then finally shipped the upload-pill fix. Cooked the eggplant recipe we kept putting off.",
  learned:
    "Drag-and-drop targets that share a container with their siblings need a depth counter — single boolean is not enough.",
  felt: "Light. The kind of light where you notice the trees on the way home.",
};

const SAMPLE_NOTE =
  "morning meeting was actually useful for once — agreed on the migration cutover date";

export default function ReflectionMockupsPage() {
  return (
    <div className="mockups-page">
      <Styles />
      <header className="mockups-header">
        <h1>reflection card — visual alternatives</h1>
        <p>
          Six takes on distinguishing reflection from notes without inverting
          the paper color. Each column shows a note above the reflection so the
          contrast reads in context.
        </p>
        <ThemeToggle />
      </header>

      <div className="mockups-grid">
        <Column
          tag="current"
          title="0 · current (dark paper)"
          note="Inverted background. Strong but flips the palette."
        >
          <NoteCard text={SAMPLE_NOTE} />
          <CurrentDarkReflection />
        </Column>

        <Column
          tag="frame"
          title="1 · inset frame"
          note="Hairline border with inner margin — postcard feel."
        >
          <NoteCard text={SAMPLE_NOTE} />
          <InsetFrameReflection />
        </Column>

        <Column
          tag="serif"
          title="2 · typographic shift"
          note="Serif italic body. Prose, not jot."
        >
          <NoteCard text={SAMPLE_NOTE} />
          <SerifReflection />
        </Column>

        <Column
          tag="header"
          title="3 · day-anchored header"
          note="Reflection lifts out of the stack as the day's title block."
        >
          <DayAnchoredReflection />
          <NoteCard text={SAMPLE_NOTE} />
        </Column>

        <Column
          tag="ledger"
          title="4 · dividers + numerals"
          note="Horizontal rules + 01/02/03 markers — structured ledger."
        >
          <NoteCard text={SAMPLE_NOTE} />
          <LedgerReflection />
        </Column>

        <Column
          tag="dogear"
          title="5 · folded corner"
          note="Clipped top-right — pure silhouette cue."
        >
          <NoteCard text={SAMPLE_NOTE} />
          <DogEarReflection />
        </Column>
      </div>
    </div>
  );
}

function Column({
  tag,
  title,
  note,
  children,
}: {
  tag: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mockup-column" data-mockup={tag}>
      <div className="mockup-caption">
        <div className="mockup-title">{title}</div>
        <div className="mockup-note">{note}</div>
      </div>
      <div className="day-card">
        <div className="day-card-header">
          <span className="day-label">tue · 12 may</span>
        </div>
        <div className="mini-stack">{children}</div>
      </div>
    </section>
  );
}

function NoteCard({ text }: { text: string }) {
  return (
    <div className="card-shell card-light">
      <time className="card-time">10:24</time>
      <div className="markdown">
        <p>{text}</p>
      </div>
    </div>
  );
}

function ReflectionBody({ variant }: { variant?: string }) {
  return (
    <>
      <div className="reflection-section" data-variant={variant}>
        <div className="reflection-label">did</div>
        <div className="reflection-body">{SAMPLE.did}</div>
      </div>
      <div className="reflection-section" data-variant={variant}>
        <div className="reflection-label">learned</div>
        <div className="reflection-body">{SAMPLE.learned}</div>
      </div>
      <div className="reflection-section" data-variant={variant}>
        <div className="reflection-label">felt</div>
        <div className="reflection-body">{SAMPLE.felt}</div>
      </div>
    </>
  );
}

function CurrentDarkReflection() {
  return (
    <div className="card-shell card-dark">
      <time className="card-time">21:08</time>
      <ReflectionBody />
    </div>
  );
}

function InsetFrameReflection() {
  return (
    <div className="card-shell card-light reflection-frame">
      <time className="card-time">21:08</time>
      <div className="reflection-frame-inner">
        <ReflectionBody />
      </div>
    </div>
  );
}

function SerifReflection() {
  return (
    <div className="card-shell card-light reflection-serif">
      <time className="card-time">21:08</time>
      <ReflectionBody variant="serif" />
    </div>
  );
}

function DayAnchoredReflection() {
  return (
    <div className="reflection-anchored">
      <div className="reflection-anchored-mark">
        <span className="reflection-anchored-eyebrow">today</span>
        <span className="reflection-anchored-date">tuesday, 12 may</span>
      </div>
      <ReflectionBody variant="anchored" />
    </div>
  );
}

function LedgerReflection() {
  return (
    <div className="card-shell card-light reflection-ledger">
      <time className="card-time">21:08</time>
      <LedgerSection n="01" label="did" value={SAMPLE.did} />
      <LedgerSection n="02" label="learned" value={SAMPLE.learned} />
      <LedgerSection n="03" label="felt" value={SAMPLE.felt} />
    </div>
  );
}

function LedgerSection({
  n,
  label,
  value,
}: {
  n: string;
  label: string;
  value: string;
}) {
  return (
    <div className="ledger-row">
      <div className="ledger-marker">
        <span className="ledger-numeral">{n}</span>
        <span className="ledger-label">{label}</span>
      </div>
      <div className="ledger-body">{value}</div>
    </div>
  );
}

function DogEarReflection() {
  return (
    <div className="card-shell card-light reflection-dogear">
      <span className="dogear-clip" aria-hidden="true" />
      <time className="card-time">21:08</time>
      <ReflectionBody />
    </div>
  );
}

function ThemeToggle() {
  return (
    <button
      type="button"
      className="mockup-theme-toggle"
      onClick={
        // inline so we keep the file a single Server Component file
        // (the parent has no "use client"); using attribute event is safe via dangerouslySetInnerHTML on a script.
        undefined
      }
      suppressHydrationWarning
      data-theme-toggle
    >
      toggle light / dark
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var btns = document.querySelectorAll('[data-theme-toggle]');
              btns.forEach(function(b){
                if (b.__wired) return; b.__wired = true;
                b.addEventListener('click', function(){
                  var r = document.documentElement;
                  var next = r.dataset.theme === 'dark' ? 'light' : 'dark';
                  if (next === 'dark') r.dataset.theme = 'dark';
                  else delete r.dataset.theme;
                  try { localStorage.setItem('theme', next); } catch(e){}
                });
              });
            })();
          `,
        }}
      />
    </button>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        html, body { overflow: auto !important; height: auto !important; }

        .mockups-page {
          min-height: 100vh;
          background: var(--color-canvas);
          color: var(--color-ink);
          padding: 48px 28px 96px;
        }

        .mockups-header {
          max-width: 1480px;
          margin: 0 auto 36px;
        }
        .mockups-header h1 {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
        }
        .mockups-header p {
          color: var(--color-ink-soft);
          margin: 0;
          max-width: 60ch;
        }

        .mockups-grid {
          max-width: 1480px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 28px;
          align-items: start;
        }

        .mockup-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }
        .mockup-caption {
          padding: 0 4px;
        }
        .mockup-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--color-ink);
        }
        .mockup-note {
          font-size: 12.5px;
          color: var(--color-ink-soft);
          margin-top: 3px;
          line-height: 1.45;
        }

        .mockup-theme-toggle {
          margin-top: 14px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-ink-soft);
          border: 1px solid var(--color-line);
          border-radius: 999px;
          padding: 6px 12px;
          cursor: pointer;
        }
        .mockup-theme-toggle:hover {
          color: var(--color-ink);
          border-color: var(--color-ink-mute);
        }

        .day-label {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: lowercase;
          color: var(--color-ink-soft);
        }

        /* ---------- 1 · inset frame ---------- */
        .reflection-frame {
          padding: 8px;
        }
        .reflection-frame .card-time {
          top: 18px;
          right: 20px;
        }
        .reflection-frame-inner {
          border: 1px solid var(--color-ink-mute);
          border-radius: 9px;
          padding: 18px 18px 16px;
        }

        /* ---------- 2 · typographic shift (serif) ---------- */
        .reflection-serif .reflection-body {
          font-family: "Iowan Old Style", "Charter", "Georgia", "Cambria", serif;
          font-style: italic;
          font-size: 15.5px;
          line-height: 1.55;
          letter-spacing: 0.005em;
        }

        /* ---------- 3 · day-anchored header ---------- */
        .reflection-anchored {
          position: relative;
          padding: 0 4px 4px;
        }
        .reflection-anchored-mark {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 4px 14px 14px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--color-line);
        }
        .reflection-anchored-eyebrow {
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--color-ink-soft);
        }
        .reflection-anchored-date {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.005em;
        }
        .reflection-anchored .reflection-section {
          padding: 0 14px;
        }
        .reflection-anchored .reflection-section + .reflection-section {
          margin-top: 14px;
        }

        /* ---------- 4 · dividers + numerals (ledger) ---------- */
        .reflection-ledger {
          padding: 14px 18px 18px;
        }
        .ledger-row {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 14px;
          padding: 14px 0;
          border-top: 1px solid var(--color-line);
        }
        .ledger-row:first-of-type {
          border-top: 0;
          padding-top: 6px;
        }
        .ledger-marker {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-variant-numeric: tabular-nums;
        }
        .ledger-numeral {
          font-size: 12px;
          color: var(--color-ink-mute);
          letter-spacing: 0.06em;
        }
        .ledger-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--color-ink-soft);
        }
        .ledger-body {
          font-size: 14.5px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        /* ---------- 5 · folded corner (dog-ear) ---------- */
        .reflection-dogear {
          --dogear: 22px;
          clip-path: polygon(
            0 0,
            calc(100% - var(--dogear)) 0,
            100% var(--dogear),
            100% 100%,
            0 100%
          );
        }
        .reflection-dogear .dogear-clip {
          position: absolute;
          top: 0;
          right: 0;
          width: var(--dogear);
          height: var(--dogear);
          background: linear-gradient(
            225deg,
            transparent 50%,
            var(--color-ink-mute) 50.5%,
            var(--color-line) 64%,
            transparent 82%
          );
          pointer-events: none;
        }
        .reflection-dogear .card-time {
          top: 6px;
          right: 30px;
        }
      `,
      }}
    />
  );
}
