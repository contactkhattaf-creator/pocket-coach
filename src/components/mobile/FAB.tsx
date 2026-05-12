import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

interface Props {
  to?: "/dashboard/scanner" | "/dashboard/transactions" | "/dashboard/goals";
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
}

export function FAB({ to = "/dashboard/transactions", onClick, icon, label = "Add" }: Props) {
  const content = (
    <span className="flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-bright to-magenta px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-8px_var(--violet-bright)] transition-all hover:scale-105 active:scale-95">
      {icon || <Plus className="h-4 w-4" strokeWidth={2.5} />}
      {label}
    </span>
  );

  return (
    <div className="absolute bottom-24 right-4 z-40">
      {onClick ? (
        <button onClick={onClick} aria-label={label}>{content}</button>
      ) : (
        <Link to={to} aria-label={label}>{content}</Link>
      )}
    </div>
  );
}
