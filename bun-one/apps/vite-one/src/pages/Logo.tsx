import "../index.css";

// Helper to generate ALL possible Y positions (Lines AND Spaces)
// For N lines, we have (N*2 - 1) total positions.
// e.g. 3 lines: Line, Space, Line, Space, Line (5 positions)
function getStaffYs(lineCount: number, minY: number, maxY: number): number[] {
  if (lineCount <= 0) return [];
  if (lineCount === 1) return [minY];

  const totalPositions = lineCount * 2 - 1;
  const step = (maxY - minY) / (totalPositions - 1);
  return Array.from({ length: totalPositions }, (_, i) => minY + i * step);
}

// Helper to pick a random element from an array
function pickRandom<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Container providing the common outer shape, gradient, and hover effects.
 */
function LogoContainer({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 group cursor-pointer">
      <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-secondary to-primary flex items-center justify-center text-primary-content ring-4 ring-base-content/10 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform relative overflow-hidden">
        {children}
      </div>
      <span className="text-base-content/70 text-sm">{label}</span>
    </div>
  );
}

/**
 * Minimal Logo (SM) - renders simple text or a passed node (SVG).
 */
function LogoSM({ content }: { content: string | React.ReactNode }) {
  if (typeof content === "string") {
    return <span className="font-bold text-[50px]">{content}</span>;
  }
  return <>{content}</>;
}

/**
 * Staff Logo (MD) - renders staff lines and notes on top of the container's gradient.
 *
 * @param staffLines Number of staff lines to render
 * @param notesYs Array of 4 Y positions for the variable notes: [♫, a, φ, ξ]
 * @param minY Top bound for lines (default 35)
 * @param maxY Bottom bound for lines (default 65)
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
  // Calculate all possible positions (Lines + Spaces)
  // We only draw lines on the even indices (0, 2, 4...)
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

  // musicalsymbols: ♫,♬,♪,♩,♭,♮
  // other symbols: ¶, a, φ, ξ,
  // greek: α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, ο, π, ρ, σ, τ, υ, φ, χ, ψ, ω
  const glyphs = [
    { glyph: "¶", x: 21, y: allPositions[midIndex] }, // Auto-center Pilcrow
    { glyph: "φ", x: 40, y: getNoteY(notesYs[0]) },
    { glyph: "♫", x: 55, y: getNoteY(notesYs[1]) },
    { glyph: "a", x: 70, y: getNoteY(notesYs[2]) },
    { glyph: "ξ", x: 85, y: getNoteY(notesYs[3]) },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
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
            opacity="0.5"
          />
        ))}

      {/* Glyphs */}
      {glyphs.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontFamily="sans-serif"
          fontWeight="normal"
          fontSize={g.glyph === "¶" ? "32" : "20"}
          fill="currentColor"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {g.glyph}
        </text>
      ))}
    </svg>
  );
}

/**
 * Logo page - uses fullBleed layout mode (declared in App.tsx routes)
 * Experiments with Prosodio logo designs
 */
function Logo() {
  // Helper for broadcast SVG content
  const broadcastSVG = (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="20"
        y="68"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="bold"
        fontSize="50"
        fill="currentColor"
      >
        ¶
      </text>
      <path
        d="M 60 40 A 15 15 0 0 1 60 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 68 35 A 25 25 0 0 1 68 65"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 78 30 A 35 35 0 0 1 78 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );

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
        <main className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 pt-24 flex flex-col justify-center items-center">
          {/* Row SM (Minimal) */}
          <div className="w-full mt-12 sm:mt-16">
            <h3 className="text-xl font-semibold text-center mb-6 text-base-content/50 uppercase tracking-widest">
              Row SM (Minimal)
            </h3>
            <div className="flex flex-wrap justify-center gap-8">
              <LogoContainer label="SM-0 (Ref)">
                <LogoSM content="♫¶" />
              </LogoContainer>
              <LogoContainer label="SM-1 (Swap)">
                <LogoSM content="¶♫" />
              </LogoContainer>
              <LogoContainer label="SM-2 (Note)">
                <LogoSM content="¶♪" />
              </LogoContainer>
              <LogoContainer label="SM-3 (Broadcast)">
                <LogoSM content={broadcastSVG} />
              </LogoContainer>
            </div>
          </div>

          {/* Row MD (Staff) */}
          <div className="w-full mt-12 sm:mt-16 border-t border-base-content/10 pt-10">
            <h3 className="text-xl font-semibold text-center mb-6 text-base-content/50 uppercase tracking-widest">
              Row MD (Staff)
            </h3>
            <div className="flex flex-wrap justify-center gap-8">
              {/* MD-0: Reference (3-Line) */}
              <LogoContainer label="MD-0 (3-Line)">
                <LogoMD
                  staffLines={5}
                  minY={30}
                  maxY={70}
                  // notesYs={[3, 1, 3, 1]} // Explicit indices (Space, Space, Space, Space)
                  // notesYs={[0, 1, 2, 3]} // Explicit indices (Space, Space, Space, Space)
                  notesYs={[6, 3, 5, 2]} // Explicit indices (Space, Space, Space, Space)
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
        </main>
      </div>
    </div>
  );
}

export default Logo;
