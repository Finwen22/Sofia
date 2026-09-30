import Link from "next/link";
import { Icon } from "./Icon";

export function PageHeader({ title, eyebrow, back, action }: { title: string; eyebrow?: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-end gap-3">
      {back && (
        <Link href={back} aria-label="Volver" className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface">
          <Icon name="back" size={20} />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="display text-[32px] leading-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}
