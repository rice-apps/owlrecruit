import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
    <div className="flex-1 w-full max-w-5xl flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href={`/protected/org/${orgId}`}
          className="text-cyan-600 hover:underline"
        >
          {orgData?.name || "Organization"}
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link
          href={`/protected/org/${orgId}/opening/${openingId}?tab=overview`}
          className="text-cyan-600 hover:underline"
        >
          {openingData?.title || "Opening"}
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="font-semibold text-gray-900">Rubric Settings</span>
      </nav>

      <h1 className="text-2xl font-bold">Rubric Settings</h1>

      <RubricSettingsForm
        orgId={orgId}
        openingId={openingId}
        initialRubric={rubric}
      />
    </div>
  );
}
