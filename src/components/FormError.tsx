import { Icon } from "./Icon";

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-alert-bg px-4 py-3 text-[15px] text-alert">
      <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}
