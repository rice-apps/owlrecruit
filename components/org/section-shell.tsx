import type { ReactNode } from "react";

export const sectionShellTokens = {
  anchorOffset: "scroll-mt-28",
  accentBand: "bg-rose-200/80",
  mutedCopy: "text-sm text-slate-500 dark:text-slate-400",
  badgePill:
    "inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-600 shadow-sm",
  cardRhythm: "space-y-5",
  cardSpacing: "gap-4 md:gap-5",
};

type SectionShellProps = {
  id: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionShell({
  id,
  title,
  subtitle,
  actions,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className={`min-w-0 flex w-full flex-col gap-4 ${sectionShellTokens.anchorOffset}`}
    >
      <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`h-0.5 w-12 rounded-full ${sectionShellTokens.accentBand}`}
            />
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          </div>
          {subtitle ? (
            <p className={sectionShellTokens.mutedCopy}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
      <div className={sectionShellTokens.cardRhythm}>{children}</div>
    </section>
  );
}
