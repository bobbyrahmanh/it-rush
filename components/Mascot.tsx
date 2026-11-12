// Signi: makhluk bulat ramah. Tangan kanan melambai (BISINDO), perut menampilkan 6 titik Braille.
export default function Mascot({ className = "" }: { className?: string }) {
  const dots = [[100, 150], [100, 172], [100, 194], [140, 150], [140, 172], [140, 194]];
  const lit = [0, 4];
  return (
    <svg viewBox="0 0 260 250" role="img" aria-label="Signi, maskot SIGNIFY berbentuk bulat yang melambaikan tangan dan memiliki enam titik Braille di perutnya" className={className}>
      <ellipse cx="120" cy="238" rx="64" ry="9" fill="#1B1B3A" opacity=".15" />
      <g className="animate-floaty">
        <path d="M120 24c8 0 14 6 14 14-8-2-16-2-28 0 0-8 6-14 14-14z" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="5" strokeLinejoin="round" />
        <path d="M120 36c-54 0-86 36-86 88 0 52 34 94 86 94s86-42 86-94c0-52-32-88-86-88z" fill="#19B5A5" stroke="#1B1B3A" strokeWidth="6" />
        <ellipse cx="46" cy="190" rx="16" ry="12" fill="#19B5A5" stroke="#1B1B3A" strokeWidth="5" />
        <g className="origin-[50%_50%] animate-blink" style={{ transformBox: "fill-box" }}>
          <circle cx="90" cy="92" r="15" fill="#fff" stroke="#1B1B3A" strokeWidth="4" />
          <circle cx="94" cy="94" r="7" fill="#1B1B3A" />
          <circle cx="96" cy="91" r="2.5" fill="#fff" />
        </g>
        <g className="animate-blink" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx="150" cy="92" r="15" fill="#fff" stroke="#1B1B3A" strokeWidth="4" />
          <circle cx="154" cy="94" r="7" fill="#1B1B3A" />
          <circle cx="156" cy="91" r="2.5" fill="#fff" />
        </g>
        <circle cx="70" cy="118" r="8" fill="#FF5D73" opacity=".7" />
        <circle cx="170" cy="118" r="8" fill="#FF5D73" opacity=".7" />
        <path d="M102 120q18 18 36 0" fill="none" stroke="#1B1B3A" strokeWidth="5" strokeLinecap="round" />
        <rect x="76" y="136" width="88" height="70" rx="26" fill="#fff" stroke="#1B1B3A" strokeWidth="4" />
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x - 10 + 10} cy={y + 8 - 8} r="6" fill={lit.includes(i) ? "#5B4BDB" : "none"} stroke="#1B1B3A" strokeWidth="3" transform="translate(-10 -4)" />
        ))}
        <g className="animate-wave" style={{ transformOrigin: "200px 150px", transformBox: "view-box" }}>
          <path d="M200 150c6-14 8-26 8-40" fill="none" stroke="#1B1B3A" strokeWidth="26" strokeLinecap="round" />
          <path d="M200 150c6-14 8-26 8-40" fill="none" stroke="#19B5A5" strokeWidth="16" strokeLinecap="round" />
          <circle cx="210" cy="86" r="24" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="5" />
          {[[192, 56, -18], [206, 48, -4], [222, 52, 12], [234, 66, 30]].map(([x, y, r], i) => (
            <rect key={i} x={x - 6} y={y - 6} width="12" height="26" rx="6" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="4" transform={`rotate(${r} ${x} ${y + 12})`} />
          ))}
          <circle cx="210" cy="88" r="20" fill="#FFC93C" />
        </g>
      </g>
    </svg>
  );
}
