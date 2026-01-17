import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import UploadDialog from "./upload-modal";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  const user = data.claims;

  // Check if user is an admin by querying the admin table
  const { data: adminData } = await supabase
    .from("admin")
    .select("id")
    .eq("id", user.sub)
    .single();

  const isAdmin = !!adminData;

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user!
        </div>
      </div>
      <h2 className="font-bold text-2xl mb-4">
        Hey {user.user_metadata.full_name}!
      </h2>
      <div className="flex gap-2 items-start flex-wrap">
        <Button asChild size="lg">
          <Link href="/protected/applications">My Applications</Link>
        </Button>
        <p className="text-sm text-muted-foreground w-full mt-4">
          Select an organization from the sidebar to view openings and manage
          applications.
        </p>
        {isAdmin && (
          <>
            <Button asChild size="lg" variant="secondary">
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
            <UploadDialog />
          </>
        )}
      </div>
    </div>
  );
}
