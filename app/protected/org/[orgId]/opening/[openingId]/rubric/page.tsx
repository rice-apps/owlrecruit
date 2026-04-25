import { Stack, Text } from "@mantine/core";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RubricSettingsForm } from "./components/RubricSettingsForm";

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
      <Breadcrumb
        items={[
          {
            label: orgData?.name || "Organization",
            href: `/protected/org/${orgId}`,
          },
          {
            label: openingData?.title || "Opening",
            href: `/protected/org/${orgId}/opening/${openingId}?tab=overview`,
          },
          { label: "Rubric Settings" },
        ]}
      />

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
