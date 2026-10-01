"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/registro", label: "Registro", icon: "list" },
  { href: "/salud", label: "Salud", icon: "health" },
  { href: "/compras", label: "Compras", icon: "cart" },
  { href: "/ficha", label: "Ficha", icon: "user" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t print:hidden border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      <div className="mx-auto flex max-w-md px-2 pt-1.5">
        {ITEMS.map((it) => {
          const on = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-semibold ${on ? "text-accent" : "text-muted"}`}
            >
              <Icon name={it.icon} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
