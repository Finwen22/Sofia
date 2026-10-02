const PATHS = {
  back: "M15 5l-7 7 7 7",
  chev: "M9 5l7 7-7 7",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  bottle: "M9 2h6M10 2v3L8 8v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-3V2M8 12h8",
  breast: "M4 14a8 8 0 0 0 16 0c0-4-3-7-3-10M7 4c0 3-3 6-3 10M12 15.5h.01",
  diaper: "M3 7h18v3a9 9 0 0 1-18 0V7zM7.5 7v3.5M16.5 7v3.5",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  note: "M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4",
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  health: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM12 9v6M9 12h6",
  cart: "M3 4h2l2.5 11h11L21 7H6.5M9.5 20h.01M17.5 20h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  share: "M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6",
  thermo: "M14 14.76V4a2 2 0 1 0-4 0v10.76a4 4 0 1 0 4 0zM12 9v7",
  pill: "M4.5 12.5l8-8a4.95 4.95 0 0 1 7 7l-8 8a4.95 4.95 0 0 1-7-7zM8.5 8.5l7 7",
  syringe: "M18 2l4 4M17 7l3-3M19 9L9 19l-4 1 1-4L16 6zM8 14l2 2M11 11l2 2",
  ruler: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  alert: "M12 3l10 18H2zM12 10v5M12 18h.01",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  play: "M8 5v14l11-7z",
  stop: "M7 7h10v10H7z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, stroke = 1.6, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
