import Link from "next/link";
import { Group, Stack, Text } from "@mantine/core";
import { ChevronRight } from "@untitled-ui/icons-react";
import { createClient } from "@/lib/supabase/server";

interface RubricPageProps {
  params: Promise<{ orgId: string; openingId: string }>;
}

interface Rubric {
  name: string;
  max_val: number;
  description: string;
}

export default async function RubricPage({ params }: RubricPageProps) {
  const { orgId, openingId } = await params;
  const supabase = await createClient();

  const { data: orgData } = await supabase
    .from("orgs")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: openingData } = await supabase
    .from("openings")
    .select("title, rubric")
    .eq("id", openingId)
    .single();

  const rawRubric = (openingData?.rubric as Rubric[] | null) || [];
  const rubric: Rubric[] = rawRubric.map((r) => ({
    name: r.name || "",
    max_val: r.max_val || 10,
    description: r.description || "",
  }));

  return (
    <Stack gap="lg" style={{ flex: 1, width: "100%", maxWidth: 1024 }}>
      {/* Breadcrumb */}
      <Group gap={4} align="center" component="nav">
        <Link
          href={`/protected/org/${orgId}`}
          style={{
            fontSize: 14,
            color: "var(--mantine-color-owlTeal-5)",
            textDecoration: "none",
          }}
        >
          {orgData?.name || "Organization"}
        </Link>
        <ChevronRight
          width={16}
          height={16}
          style={{ color: "var(--mantine-color-gray-4)" }}
        />
        <Link
          href={`/protected/org/${orgId}/opening/${openingId}?tab=overview`}
          style={{
            fontSize: 14,
            color: "var(--mantine-color-owlTeal-5)",
            textDecoration: "none",
          }}
        >
          {openingData?.title || "Opening"}
        </Link>
        <ChevronRight
          width={16}
          height={16}
          style={{ color: "var(--mantine-color-gray-4)" }}
        />
        <Text size="sm" fw={600}>
          Rubric Settings
        </Text>
      </Group>

      <Text size="xl" fw={700}>
        Rubric Settings
      </Text>

      <RubricSettingsForm
        orgId={orgId}
        openingId={openingId}
        initialRubric={rubric}
      />
    </Stack>
  );
}
