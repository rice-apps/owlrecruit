import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import OrganizationsSection, { OrgMembership } from "./organizations-section";

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get the current logged-in user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/");
  }

  // Fetch user profile data from the users table
  const { data: userRecord } = await supabase
    .from("users")
    .select("name")
    .eq("id", userData.user.id)
    .single();

  // Parse the name into first and last name by splitting on space
  const fullName = userRecord?.name || "";
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || ""; // Everything after first word

  // Get user's avatar URL from Google OAuth (if exists)
  const avatarUrl = userData.user.user_metadata?.avatar_url || "";

  // Create initials for fallback
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // fetch org memberships without relational payload
  const { data: rawMemberships, error: membershipError } = await supabase
    .from("org_members")
    .select("id, org_id, role")
    .eq("user_id", userData.user.id);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const membershipsList = rawMemberships || [];

  // fetch organization names
  const orgIds = Array.from(new Set(membershipsList.map((m) => m.org_id)));
  const { data: orgsData, error: orgsError } = orgIds.length
    ? await supabase.from("orgs").select("id, name").in("id", orgIds)
    : { data: [], error: null };

  if (orgsError) {
    throw new Error(orgsError.message);
  }

  const orgMap = new Map(orgsData?.map((o) => [o.id, o.name]));

  // map memberships to include org_name
  const orgMemberships: OrgMembership[] = membershipsList.map((m) => ({
    ...m,
    org_name: orgMap.get(m.org_id) || "Unknown Organization",
  }));

  return (
    <div className="flex flex-col w-full p-8 max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Profile Information
      </h1>

      {/* Profile Picture Section */}
      <div className="mb-12 flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="text-2xl bg-gray-200 text-gray-700">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Name
        </label>
        <div className="flex gap-4">
          {/* First Name Input */}
          <input
            type="text"
            defaultValue={firstName}
            placeholder="John"
            className="flex-1 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          {/* Last Name Input */}
          <input
            type="text"
            defaultValue={lastName}
            placeholder="Doe"
            className="flex-1 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Email Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rice Email
        </label>
        <input
          type="email"
          defaultValue={userData.user.email}
          placeholder="john.doe@example.com"
          className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      <OrganizationsSection memberships={orgMemberships} userId={userData.user.id} />
    </div>
  );
}
