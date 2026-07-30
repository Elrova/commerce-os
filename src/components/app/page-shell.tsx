import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 border-b border-[#e3e1da] pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#20211d] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6e67]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function AppButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      className={
        variant === "primary"
          ? "inline-flex h-10 items-center justify-center rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#383a34]"
          : "inline-flex h-10 items-center justify-center rounded-xl border border-[#dedcd4] bg-white px-4 text-sm font-medium text-[#353630] transition-colors hover:bg-[#f5f4ef]"
      }
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#d9d7cf] bg-white/55 px-6 py-12 text-center">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-xl bg-[#edf0e9] text-[#708069]">
          {icon}
        </div>
        <h2 className="mt-4 text-sm font-medium text-[#292a26]">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#777871]">
          {description}
        </p>
      </div>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  const tones = {
    neutral: "bg-[#efeee9] text-[#686a63]",
    success: "bg-[#e8eee5] text-[#53664d]",
    warning: "bg-[#f3eddd] text-[#7a673e]",
    error: "bg-[#f2e5e2] text-[#8a554b]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
