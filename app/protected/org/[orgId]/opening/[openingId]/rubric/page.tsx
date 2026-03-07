import Link from "next/link";
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
    <div className="flex-1 w-full max-w-5xl flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href={`/protected/org/${orgId}`}
          className="text-owl-purple hover:underline"
        >
          {orgData?.name || "Organization"}
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link
          href={`/protected/org/${orgId}/opening/${openingId}?tab=overview`}
          className="text-owl-purple hover:underline"
        >
          {openingData?.title || "Opening"}
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="font-semibold text-gray-900">Rubric</span>
      </nav>

      <h1 className="text-3xl font-medium tracking-tight text-gray-900">
        Rubric Details
      </h1>

      <section className="rounded-3xl border border-gray-300 bg-[#F5F5F5] p-5 md:p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_180px_2fr] md:gap-6">
          <div>
            <p className="text-base leading-tight font-medium text-gray-900 md:text-lg">
              Criteria<span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 md:text-sm">
              i.e. &quot;Experience, Teamwork&quot;
            </p>
          </div>
          <div>
            <p className="text-base leading-tight font-medium text-gray-900 md:text-lg">
              Max Score<span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 md:text-sm">Highest rating</p>
          </div>
          <div>
            <p className="text-base leading-tight font-medium text-gray-900 md:text-lg">
              Description
            </p>
            <p className="text-xs text-gray-500 md:text-sm">
              Describe this criterion more
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {rubric.length === 0 ? (
            <p className="text-sm text-gray-600">
              No rubric criteria configured.
            </p>
          ) : (
            rubric.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="grid grid-cols-1 gap-2 text-base leading-tight font-medium text-gray-900 md:grid-cols-[1.2fr_180px_2fr] md:gap-6 md:text-lg"
              >
                <p>{item.name || "-"}</p>
                <p>{item.max_val}</p>
                <p>{item.description || "-"}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-end text-lg leading-tight font-medium text-gray-900 md:text-xl">
          <p>
            Total Score&nbsp;&nbsp;
            <span>
              {rubric.reduce(
                (sum, item) => sum + (Number(item.max_val) || 0),
                0,
              )}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
