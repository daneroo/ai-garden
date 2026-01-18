import "../index.css";

/**
 * Helper to pick a random Y position for glyph placement on staff lines.
 */
function randomY(options: number[]): number {
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Logo page - uses fullBleed layout mode (declared in App.tsx routes)
 * Experiments with Prosodio logo designs
 */
function Logo() {
  // Y positions for 3-line staff randomization
  const threeLineY = [35, 42, 50, 58, 65];
  // Y positions for 5-line staff randomization
  const fiveLineY = [30, 35, 40, 45, 50, 55, 60, 65, 70];

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {/* SM-0: Reference (♫¶) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-[50px] ring-4 ring-base-content/10 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  ♫¶
                </div>
                <span className="text-base-content/70 text-sm">SM-0 (Ref)</span>
              </div>

              {/* SM-1: Swapped (¶♫) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-[50px] ring-4 ring-base-content/10 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  ¶♫
                </div>
                <span className="text-base-content/70 text-sm">
                  SM-1 (Swap)
                </span>
              </div>

              {/* SM-2: Eighth Note (¶♪) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-[50px] ring-4 ring-base-content/10 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  ¶♪
                </div>
                <span className="text-base-content/70 text-sm">
                  SM-2 (Note)
                </span>
              </div>

              {/* SM-3: Broadcast (¶ + Arcs) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-base-content/10 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform relative overflow-hidden">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Pilcrow */}
                    <text
                      x="20"
                      y="68"
                      fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                      fontWeight="bold"
                      fontSize="50"
                      fill="white"
                    >
                      ¶
                    </text>
                    {/* Radiating Arcs */}
                    <path
                      d="M 60 40 A 15 15 0 0 1 60 60"
                      fill="none"
                      stroke="white"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 68 35 A 25 25 0 0 1 68 65"
                      fill="none"
                      stroke="white"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 78 30 A 35 35 0 0 1 78 70"
                      fill="none"
                      stroke="white"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-base-content/70 text-sm">
                  SM-3 (Broadcast)
                </span>
              </div>
            </div>
          </div>

          {/* Row MD (Staff) */}
          <div className="w-full mt-12 sm:mt-16 border-t border-base-content/10 pt-10">
            <h3 className="text-xl font-semibold text-center mb-6 text-base-content/50 uppercase tracking-widest">
              Row MD (Staff)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {/* MD-0: Reference (3-Line) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 group-hover:scale-110 transition-transform drop-shadow-xl">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="brandGradMD0"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          style={{ stopColor: "#f43f5e", stopOpacity: 1 }}
                        />
                        <stop
                          offset="100%"
                          style={{ stopColor: "#9333ea", stopOpacity: 1 }}
                        />
                      </linearGradient>
                    </defs>
                    <rect
                      width="100"
                      height="100"
                      rx="20"
                      fill="url(#brandGradMD0)"
                    />
                    {/* 3 Lines */}
                    {[35, 50, 65].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        y1={y}
                        x2="90"
                        y2={y}
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    ))}
                    {/* Glyphs */}
                    <text
                      x="21"
                      y="55"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="28"
                      fill="white"
                      textAnchor="middle"
                    >
                      ¶
                    </text>
                    <text
                      x="40"
                      y="45"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      ♫
                    </text>
                    <text
                      x="55"
                      y="55"
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      a
                    </text>
                    <text
                      x="70"
                      y="42"
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      φ
                    </text>
                    <text
                      x="85"
                      y="58"
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      ξ
                    </text>
                  </svg>
                </div>
                <span className="text-base-content/70 text-sm">
                  MD-0 (3-Line)
                </span>
              </div>

              {/* MD-1: Random A (5-Line) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 group-hover:scale-110 transition-transform drop-shadow-xl">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="brandGradMD1"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          style={{ stopColor: "#f43f5e", stopOpacity: 1 }}
                        />
                        <stop
                          offset="100%"
                          style={{ stopColor: "#9333ea", stopOpacity: 1 }}
                        />
                      </linearGradient>
                    </defs>
                    <rect
                      width="100"
                      height="100"
                      rx="20"
                      fill="url(#brandGradMD1)"
                    />
                    {/* 5 Lines */}
                    {[30, 40, 50, 60, 70].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        y1={y}
                        x2="90"
                        y2={y}
                        stroke="white"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                    ))}
                    {/* Glyphs (Randomized) */}
                    <text
                      x="21"
                      y="58"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="28"
                      fill="white"
                      textAnchor="middle"
                    >
                      ¶
                    </text>
                    <text
                      x="40"
                      y={randomY(fiveLineY)}
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      ♫
                    </text>
                    <text
                      x="55"
                      y={randomY(fiveLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      a
                    </text>
                    <text
                      x="70"
                      y={randomY(fiveLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      φ
                    </text>
                    <text
                      x="85"
                      y={randomY(fiveLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      ξ
                    </text>
                  </svg>
                </div>
                <span className="text-base-content/70 text-sm">
                  MD-1 (Rand A)
                </span>
              </div>

              {/* MD-2: Random B (3-Line) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 group-hover:scale-110 transition-transform drop-shadow-xl">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="brandGradMD2"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          style={{ stopColor: "#f43f5e", stopOpacity: 1 }}
                        />
                        <stop
                          offset="100%"
                          style={{ stopColor: "#9333ea", stopOpacity: 1 }}
                        />
                      </linearGradient>
                    </defs>
                    <rect
                      width="100"
                      height="100"
                      rx="20"
                      fill="url(#brandGradMD2)"
                    />
                    {/* 3 Lines */}
                    {[35, 50, 65].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        y1={y}
                        x2="90"
                        y2={y}
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    ))}
                    {/* Glyphs (Randomized for 3-Line) */}
                    <text
                      x="21"
                      y="55"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="28"
                      fill="white"
                      textAnchor="middle"
                    >
                      ¶
                    </text>
                    <text
                      x="40"
                      y={randomY(threeLineY)}
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      ♫
                    </text>
                    <text
                      x="55"
                      y={randomY(threeLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      a
                    </text>
                    <text
                      x="70"
                      y={randomY(threeLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      φ
                    </text>
                    <text
                      x="85"
                      y={randomY(threeLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      ξ
                    </text>
                  </svg>
                </div>
                <span className="text-base-content/70 text-sm">
                  MD-2 (3-Line Rand B)
                </span>
              </div>

              {/* MD-3: Random C (3-Line) */}
              <div className="flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-24 h-24 group-hover:scale-110 transition-transform drop-shadow-xl">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="brandGradMD3"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          style={{ stopColor: "#f43f5e", stopOpacity: 1 }}
                        />
                        <stop
                          offset="100%"
                          style={{ stopColor: "#9333ea", stopOpacity: 1 }}
                        />
                      </linearGradient>
                    </defs>
                    <rect
                      width="100"
                      height="100"
                      rx="20"
                      fill="url(#brandGradMD3)"
                    />
                    {/* 3 Lines */}
                    {[35, 50, 65].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        y1={y}
                        x2="90"
                        y2={y}
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    ))}
                    {/* Glyphs (Randomized for 3-Line) */}
                    <text
                      x="21"
                      y="55"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="28"
                      fill="white"
                      textAnchor="middle"
                    >
                      ¶
                    </text>
                    <text
                      x="40"
                      y={randomY(threeLineY)}
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      ♫
                    </text>
                    <text
                      x="55"
                      y={randomY(threeLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="20"
                      fill="white"
                      textAnchor="middle"
                    >
                      a
                    </text>
                    <text
                      x="70"
                      y={randomY(threeLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      φ
                    </text>
                    <text
                      x="85"
                      y={randomY(threeLineY)}
                      fontFamily="serif"
                      fontWeight="bold"
                      fontSize="22"
                      fill="white"
                      textAnchor="middle"
                    >
                      ξ
                    </text>
                  </svg>
                </div>
                <span className="text-base-content/70 text-sm">
                  MD-3 (3-Line Rand C)
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Logo;
