import "../index.css";

/**
 * Logo page - uses fullBleed layout mode (declared in App.tsx routes)
 * Experiments with Prosodio logo designs
 */
export default function Logo() {
  return (
    <div className="min-h-screen bg-base-100 font-sans text-base-content selection:bg-rose-500/30">
      {/* Decorative Background Blobs */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 pt-24 flex flex-col justify-center items-center gap-16">
          {/* ===========================================================================
             SECTION: Hero
             =========================================================================== */}
          <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-10 text-primary">
              Hero
            </h2>
            <div className="flex justify-center">
              <LogoHero />
            </div>
          </div>

          <div className="divider opacity-10"></div>

          {/* ===========================================================================
             SECTION: Small (SM)
             =========================================================================== */}
          <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-10 text-primary">
              Small (SM)
            </h2>

            {/* Row: Variants */}
            <div className="w-full mb-12">
              <h3 className="text-lg font-semibold text-center mb-6 text-base-content/70 uppercase tracking-widest">
                Variants
              </h3>
              <div className="flex flex-wrap justify-center gap-8">
                {(["¶)", "¶♫", "¶♪", "(¶", ")¶"] as LogoGlyphs[]).map(
                  (glyphs, index) => (
                    <LogoContainer
                      key={glyphs}
                      label={`SVG-${index} (${glyphs})`}
                      size={16}
                    >
                      <LogoSM glyphs={glyphs} />
                    </LogoContainer>
                  ),
                )}
              </div>
            </div>

            {/* Row: Sized */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-center mb-6 text-base-content/70 uppercase tracking-widest">
                Sized
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {([8, 12, 16, 24, 32] satisfies LogoSize[]).map((size) => (
                  <LogoContainer key={size} label={`Size ${size}`} size={size}>
                    <LogoSM glyphs="¶)" />
                  </LogoContainer>
                ))}
              </div>
            </div>
          </div>

          <div className="divider opacity-10"></div>

          {/* ===========================================================================
             SECTION: Medium (MD)
             =========================================================================== */}
          <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-10 text-primary">
              Medium (MD)
            </h2>

            {/* Row: Variants */}
            <div className="w-full mb-12">
              <h3 className="text-lg font-semibold text-center mb-6 text-base-content/70 uppercase tracking-widest">
                Variants
              </h3>
              <div className="flex flex-wrap justify-center gap-8">
                {/* MD-0: Reference (3-Line) */}
                <LogoContainer label="MD-0 (3-Line)">
                  <LogoMD
                    staffLines={5}
                    minY={30}
                    maxY={70}
                    notesYs={[6, 3, 5, 2]}
                  />
                </LogoContainer>

                {/* MD-1: Random A (5-Line) */}
                <LogoContainer label="MD-1 (Rand A)">
                  <LogoMD staffLines={5} minY={30} maxY={70} />
                </LogoContainer>

                {/* MD-1.1: Random (4-Line) */}
                <LogoContainer label="MD-1.1 (4-Line Rand)">
                  <LogoMD staffLines={4} minY={35} maxY={65} />
                </LogoContainer>

                {/* MD-2: Random B (3-Line) */}
                <LogoContainer label="MD-2 (3-Line Rand B)">
                  <LogoMD staffLines={3} minY={35} maxY={65} />
                </LogoContainer>

                {/* MD-3: Random C (3-Line) */}
                <LogoContainer label="MD-3 (3-Line Rand C)">
                  <LogoMD staffLines={3} minY={35} maxY={65} />
                </LogoContainer>
              </div>
            </div>

            {/* Row: Sized */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-center mb-6 text-base-content/70 uppercase tracking-widest">
                Sized
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {([16, 24, 48, 64] satisfies LogoSize[]).map((size) => (
                  <LogoContainer key={size} label={`Size ${size}`} size={size}>
                    <LogoMD
                      staffLines={5}
                      minY={30}
                      maxY={70}
                      notesYs={[6, 3, 5, 2]}
                    />
                  </LogoContainer>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// Components called by Logo()
// ============================================================================

/**
 * Container providing the common outer shape, gradient, and hover effects.
 * Supports multiple standard sizes via safe class mapping (no interpolation).
 */
const SIZE_MAP = {
  4: "w-4 h-4 rounded-sm", // 16px (Favicon/Micro)
  6: "w-6 h-6 rounded-md", // 24px (Toolbar/Menu)
  8: "w-8 h-8 rounded-lg", // 32px (Icon)
  10: "w-10 h-10 rounded-xl", // 40px
  12: "w-12 h-12 rounded-xl", // 48px
  16: "w-16 h-16 rounded-2xl", // 64px
  24: "w-24 h-24 rounded-2xl", // 96px (Default)
  32: "w-32 h-32 rounded-3xl", // 128px
  48: "w-48 h-48 rounded-[2.5rem]", // 192px
  64: "w-64 h-64 rounded-[3rem]", // 256px
} as const;

type LogoSize = keyof typeof SIZE_MAP;

function LogoContainer({
  label,
  children,
  size = 24,
}: {
  label: string;
  children: React.ReactNode;
  size?: LogoSize;
}) {
  const sizeClass = SIZE_MAP[size];

  return (
    <div className="flex flex-col items-center gap-4 group cursor-pointer">
      <div
        className={`${sizeClass} bg-linear-to-tr from-secondary to-primary flex items-center justify-center text-primary-content ring-4 ring-base-content/10 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform relative overflow-hidden`}
      >
        {children}
      </div>
      <span className="text-base-content/70 text-sm">{label}</span>
    </div>
  );
}

/**
 * Hero Logo - text-based staff design.
 * Drop cap pilcrow with flowing justified text.
 * Staff lines via repeating gradient, clipped by outer container.
 * 5 staff lines visible: 1 at top + 4 after each text line.
 *
 * DESIGN NOTE:
 * This component deliberately overrides standard DaisyUI semantic themes (base-*, primary-*)
 * to achieve a specific "Physical Paper" aesthetic (Cream/Amber for light, Stone for dark).
 * Standard Tailwind colors are used to ensure this "object" looks consistent regardless of
 * the broader app theme, simulating a real book page.
 */
function LogoHero() {
  const quote =
    "It was night again. The Waystone Inn lay in silence, and it was a silence of three parts. The most obvious part was a hollow, echoing quiet, made by things that were lacking. If there had been a wind it would have sighed through the trees, set the inn's sign creaking on its hooks, and brushed the silence down the road like trailing autumn leaves.";

  // Line height in em units for the ruled-paper effect
  const lineHeight = 1.75;
  // Staff line thickness in pixels
  const lineWidth = 2;
  // Number of text lines
  const numLines = 4;

  return (
    // Outer container: clips the gradient to exact height
    //
    // MATERIAL OVERRIDES:
    // - bg-amber-50 (Light): Warm cream paper
    // - dark:bg-stone-950 (Dark): Deep warm charcoal (Darker/Richer than stone-900)
    // - text-amber-950 (Light): Deep brown/black ink
    // - dark:text-stone-200 (Dark): Bright warm gray (Higher contrast than stone-300)
    // - shadow-stone-900/10: Subtle organic shadow separate from theme
    //
    // LAYOUT:
    // - text-2xl: for main flowing text
    // - text-[8rem]: pilcrow clef ¶ + plus nudge -mt-6 to adjust centering
    <div
      className="p-8 rounded-3xl max-w-2xl w-full overflow-hidden text-2xl bg-amber-50 dark:bg-stone-950 text-amber-950 dark:text-stone-200 shadow-xl shadow-stone-900/10"
      style={{
        // Height = numLines * lineHeight + one line of staff line at top
        maxHeight: `calc(${lineHeight}em * ${numLines} + ${lineWidth}px + 4rem)`, // 4rem for padding
      }}
    >
      {/* Inner container: has the infinite repeating gradient */}
      <div
        className="flex gap-4 items-stretch"
        style={{
          // Staff lines starting with matching ink color at low opacity
          // Light: rgba(69, 26, 3, 0.1) -> Matches text-amber-950 (#451a03)
          // Dark: rgba(231, 229, 228, 0.1) -> Matches text-stone-200 (#e7e5e4)
          // Note: using explicit rgba() for the gradient stops to ensure perfect transparency matching
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            rgb(from var(--color-amber-950) r g b / 0.3) 0,
            rgb(from var(--color-amber-950) r g b / 0.3) ${lineWidth}px,
            transparent ${lineWidth}px,
            transparent ${lineHeight}em
          )`,
        }}
        // We handle Dark mode gradient override via a separate style object or class if needed,
        // but since we can't easily put dark:modifiers in inline styles, we'll use a CSS variable technique
        // or a simple media query style block.
        // Actually, Tailwind v4 allows `dark:` variants for arbitrary properties but complex gradients are hard.
        // BETTER APPROACH: Use `text-current` opacity? No, lines need to be specific.
        // Let's use a class-based utility or simply component-level CSS variables for the line color.
      >
        <style>{`
          .staff-lines {
            --line-color: rgba(69, 26, 3, 0.3); /* amber-950 @ 30% */
          }
          @media (prefers-color-scheme: dark) {
            .staff-lines {
              --line-color: rgba(231, 229, 228, 0.3); /* stone-200 @ 30% */
            }
          }
          :where([data-theme="dark"]) .staff-lines {
             --line-color: rgba(231, 229, 228, 0.3); /* stone-200 @ 30% */
          }
        `}</style>
        <div
          className="flex gap-4 items-stretch grow staff-lines"
          style={{
            backgroundImage: `repeating-linear-gradient(
            to bottom,
            var(--line-color) 0,
            var(--line-color) ${lineWidth}px,
            transparent ${lineWidth}px,
            transparent ${lineHeight}em
          )`,
            // Height = 4 text rows + final staff line thickness
            minHeight: `calc(${lineHeight}em * ${numLines} + ${lineWidth}px)`,
          }}
        >
          {/* Pilcrow Clef - Inherits text color ("Ink") */}
          {/* fixed size, vertically centered within stretched container */}
          <span className="text-[8rem] font-bold shrink-0 font-sans self-center -mt-6">
            ¶
          </span>

          {/* Text Content - Inherits text color ("Ink") */}
          <p
            className="font-serif italic text-justify line-clamp-4 grow opacity-90"
            style={{ lineHeight: lineHeight }}
          >
            {quote}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SVG-based Minimal Logo - renders exactly two glyphs.
 * Special handling: "(" renders as left-facing arcs, ")" as right-facing arcs.
 *
 * Layout: Both glyphs meet at CENTER_X with an adjustable GAP.
 * - Left glyph: right edge anchored at (CENTER_X - GAP/2)
 * - Right glyph: left edge anchored at (CENTER_X + GAP/2)
 */
type LogoGlyphs = "¶)" | "¶♫" | "¶♪" | "(¶" | ")¶";
// Note: "¶)" is the default

function LogoSM({
  glyphs = "¶)",
  gap = 3,
}: {
  glyphs?: LogoGlyphs;
  gap?: number;
}) {
  const CENTER_X = 50;
  const leftGlyph = glyphs[0]!;
  const rightGlyph = glyphs[1]!;
  const leftEdge = CENTER_X - gap / 2;
  const rightEdge = CENTER_X + gap / 2;

  // Arc geometry: paths at x=0, 8, 16 with strokeWidth=6
  const ARCS_VISUAL_WIDTH = 21;
  // Kerning offset - shift arcs for tighter spacing (positive = closer to text)
  const ARCS_OFFSET = 6;

  const renderGlyphs = () => (
    <>
      {/* Left glyph - anchored by its RIGHT edge at leftEdge */}
      {leftGlyph === ")" ? (
        renderArcs(leftEdge - ARCS_VISUAL_WIDTH - ARCS_OFFSET, 50, false)
      ) : leftGlyph === "(" ? (
        renderArcs(leftEdge - ARCS_OFFSET, 50, true)
      ) : (
        <text
          x={leftEdge}
          y="50"
          fontSize="50"
          fill="currentColor"
          textAnchor="end"
          dominantBaseline="central"
        >
          {leftGlyph}
        </text>
      )}

      {/* Right glyph - anchored by its LEFT edge at rightEdge */}
      {rightGlyph === ")" ? (
        renderArcs(rightEdge + ARCS_OFFSET, 50, false)
      ) : rightGlyph === "(" ? (
        renderArcs(rightEdge + ARCS_VISUAL_WIDTH + ARCS_OFFSET, 50, true)
      ) : (
        <text
          x={rightEdge}
          y="50"
          fontSize="50"
          fill="currentColor"
          textAnchor="start"
          dominantBaseline="central"
        >
          {rightGlyph}
        </text>
      )}
    </>
  );

  return (
    // Font family/weight via Tailwind classes for consistent styling
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full font-sans font-bold"
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderGlyphs()}
    </svg>
  );
}

/**
 * Render broadcast arcs as SVG paths.
 * @param x - X position where arcs start (left edge for right-facing, right edge for left-facing)
 * @param y - Y center position
 * @param mirror - If true, arcs face left (mirrored)
 */
function renderArcs(x: number, y: number, mirror: boolean = false) {
  const transform = mirror
    ? `translate(${x}, ${y}) scale(-1, 1)`
    : `translate(${x}, ${y})`;

  return (
    <g transform={transform}>
      <g
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      >
        {/* Evenly spaced arcs: 0, 8, 16 (gaps of 8) */}
        <path d="M 0 -10 A 15 15 0 0 1 0 10" />
        <path d="M 8 -15 A 25 25 0 0 1 8 15" />
        <path d="M 16 -20 A 35 35 0 0 1 16 20" />
      </g>
    </g>
  );
}

/**
 * Staff Logo (MD) - renders staff lines and notes on top of the container's gradient.
 */
function LogoMD({
  staffLines,
  notesYs = [],
  minY = 35,
  maxY = 65,
}: {
  staffLines: number;
  notesYs?: number[];
  minY?: number;
  maxY?: number;
}) {
  const allPositions = getStaffYs(staffLines, minY, maxY);
  const midIndex = Math.floor(allPositions.length / 2);
  const possibleIndices = allPositions.map((_, i) => i);

  const getNoteY = (indexOverride?: number) => {
    if (
      indexOverride !== undefined &&
      indexOverride >= 0 &&
      indexOverride < allPositions.length
    ) {
      return allPositions[indexOverride];
    }
    return allPositions[pickRandom(possibleIndices)];
  };

  const glyphs = [
    { glyph: "¶", x: 21, y: allPositions[midIndex] },
    { glyph: "φ", x: 40, y: getNoteY(notesYs[0]) },
    { glyph: "♫", x: 55, y: getNoteY(notesYs[1]) },
    { glyph: "a", x: 70, y: getNoteY(notesYs[2]) },
    { glyph: "ξ", x: 85, y: getNoteY(notesYs[3]) },
  ];

  return (
    // Font family/weight via Tailwind classes for consistent styling
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full font-sans font-bold"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Staff Lines - Draw only on Line positions (even indices) */}
      {allPositions
        .filter((_, index) => index % 2 === 0)
        .map((y) => (
          <line
            key={y}
            x1="10"
            y1={y}
            x2="90"
            y2={y}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.7"
          />
        ))}

      {/* Glyphs */}
      {glyphs.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontSize={g.glyph === "¶" ? "32" : "18"}
          fill="currentColor"
          // middle is better that central here for alignment with staff
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {g.glyph}
        </text>
      ))}
    </svg>
  );
}

// ============================================================================
// Utility helpers (called by LogoMD)
// ============================================================================

/** Generate ALL possible Y positions (Lines AND Spaces) for staff */
function getStaffYs(lineCount: number, minY: number, maxY: number): number[] {
  if (lineCount <= 0) return [];
  if (lineCount === 1) return [minY];

  const totalPositions = lineCount * 2 - 1;
  const step = (maxY - minY) / (totalPositions - 1);
  return Array.from({ length: totalPositions }, (_, i) => minY + i * step);
}

/** Pick a random element from an array */
function pickRandom<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}
