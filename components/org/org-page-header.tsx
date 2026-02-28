import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Eye, Pencil } from "lucide-react";

type OrgPageHeaderProps = {
  displayOrgName: string;
  roleLabel: string;
  isAdmin: boolean;
  hasRoleError: boolean;
};

export function OrgPageHeader({
  displayOrgName,
  roleLabel,
  isAdmin,
  hasRoleError,
}: OrgPageHeaderProps) {
  const orgInitial = displayOrgName.charAt(0).toUpperCase();
  const headerButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
      <div className="px-4 pt-4">
        <div aria-hidden="true" className="h-[72px] rounded-3xl bg-rose-300" />
      </div>
      <Avatar className="absolute left-8 top-[54px] h-16 w-16 rounded-xl border-4 border-slate-50 bg-white shadow-md">
        <AvatarFallback className="bg-white text-rose-500 text-3xl font-semibold">
          {orgInitial}
        </AvatarFallback>
      </Avatar>
      <div className="px-8 pb-6 pt-16 sm:pb-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-medium tracking-tight text-slate-950 md:text-5xl">
                {displayOrgName}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold",
                  isAdmin
                    ? "border-indigo-200 bg-indigo-50/70 text-indigo-400"
                    : "border-slate-200 bg-slate-100 text-slate-500",
                )}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label={
                hasRoleError
                  ? "View organization unavailable"
                  : "View organization"
              }
              className={headerButtonClasses}
            >
              <Eye className="h-[22px] w-[22px]" />
              <span className="sr-only">
                {hasRoleError
                  ? "View organization unavailable"
                  : "View organization"}
              </span>
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label={
                hasRoleError
                  ? "Edit organization unavailable"
                  : "Edit organization"
              }
              className={headerButtonClasses}
            >
              <Pencil className="h-[22px] w-[22px]" />
              <span className="sr-only">
                {hasRoleError
                  ? "Edit organization unavailable"
                  : "Edit organization"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
