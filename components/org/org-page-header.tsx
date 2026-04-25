import { Avatar, Badge, Group } from "@mantine/core";
import { EditOrgDialog } from "@/components/edit-org-dialog";

type OrgPageHeaderProps = {
  orgId: string;
  displayOrgName: string;
  orgDescription: string | null;
  roleLabel: string;
  isAdmin: boolean;
  hasRoleError: boolean;
  logoUrl?: string | null;
};

export function OrgPageHeader({
  orgId,
  displayOrgName,
  orgDescription,
  roleLabel,
  isAdmin,
  hasRoleError,
  logoUrl,
}: OrgPageHeaderProps) {
  const orgInitial = displayOrgName.charAt(0).toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 28,
        border: "1px solid var(--mantine-color-gray-2)",
        background: "var(--mantine-color-gray-0)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1rem 1rem 0" }}>
        <div
          style={{
            height: 72,
            borderRadius: 24,
            background: "var(--mantine-color-red-3)",
          }}
        />
      </div>

      <Avatar
        color="red"
        radius="md"
        size={64}
        style={{
          position: "absolute",
          left: 32,
          top: 54,
          border: "4px solid var(--mantine-color-gray-0)",
        }}
      >
        {orgInitial}
      </Avatar>

      <div style={{ padding: "4rem 2rem 1.5rem" }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Group gap="md" wrap="wrap" align="center">
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {displayOrgName}
            </h1>
            <Badge
              variant={isAdmin ? "light" : "outline"}
              color={isAdmin ? "owlPurple" : "gray"}
            >
              {roleLabel}
            </Badge>
          </Group>

          {isAdmin && !hasRoleError && (
            <div style={{ paddingTop: "0.75rem" }}>
              <EditOrgDialog
                orgId={orgId}
                orgName={displayOrgName}
                orgDescription={orgDescription}
              />
            </div>
          )}
        </Group>
      </div>
    </div>
  );
}
