// Bolitas de luz tenues que flotan de fondo. Puro CSS, sin JS.
const ORBS: [number, number, number, number, number, number][] = [
  // left %, top %, tamaño px, deriva s, brillo s, desfase s
  [7, 13, 70, 24, 7, -3], [74, 8, 110, 30, 9, -11], [54, 36, 44, 20, 6, -6],
  [-5, 50, 130, 34, 10, -2], [82, 56, 56, 22, 5, -9], [31, 76, 90, 28, 8, -14],
  [67, 85, 36, 19, 6, -4], [15, 90, 28, 18, 5, -8], [44, 21, 22, 16, 4, -1],
  [90, 36, 26, 21, 6, -12],
];

export function Orbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {ORBS.map(([l, t, s, d, g, dl], i) => (
        <div
          key={i}
          className="orb"
          style={{
            left: `${l}%`,
            top: `${t}%`,
            width: s,
            height: s,
            animationDuration: `${d}s, ${g}s`,
            animationDelay: `${dl}s, ${dl / 2}s`,
          }}
        />
      ))}
    </div>
  );
}
