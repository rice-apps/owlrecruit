import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  SocialLinksDisplay,
  type SocialLinks,
} from "@/components/org/social-links";
import { EditSocialLinksDialog } from "@/components/org/edit-social-links-dialog";

type OrgPageHeaderProps = {
  displayOrgName: string;
  roleLabel: string;
  isAdmin: boolean;
  orgId: string;
  socialLinks?: SocialLinks;
};

export function OrgPageHeader({
  displayOrgName,
  roleLabel,
  isAdmin,
  orgId,
  socialLinks = {},
}: OrgPageHeaderProps) {
  const orgInitial = displayOrgName.charAt(0).toUpperCase();
  const headerButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-card">
      <div className="px-4 pt-4">
        <div aria-hidden="true" className="h-[72px] rounded-3xl bg-rose-300" />
      </div>
      <Avatar className="absolute left-8 top-[54px] h-16 w-16 rounded-xl border-4 border-card bg-background shadow-md">
        <AvatarFallback className="bg-background text-rose-500 text-3xl font-semibold">
          {orgInitial}
        </AvatarFallback>
      </Avatar>
      <div className="px-8 pb-6 pt-16 sm:pb-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-medium tracking-tight text-foreground md:text-5xl">
                {displayOrgName}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold",
                  isAdmin
                    ? "border-owl-purple/30 bg-owl-purple/10 text-owl-purple"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {roleLabel}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <SocialLinksDisplay links={socialLinks} />
              {isAdmin && (
                <EditSocialLinksDialog
                  orgId={orgId}
                  initialLinks={socialLinks}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
