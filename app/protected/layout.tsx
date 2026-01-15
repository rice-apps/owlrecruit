import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';
import type { OrgWithRole } from '@/types/app';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verify user authentication
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect('/auth/login');
  }

  const userId = authData.claims.sub;
  const userMetadata = authData.claims.user_metadata as {
    full_name?: string;
    name?: string;
    email?: string;
  };

  // Fetch user's organizations with their role
  const { data: memberships, error: membershipsError } = await supabase
    .from('org_members')
    .select(`
      role,
      orgs (
        id,
        name,
        description,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (membershipsError) {
    console.error('Error fetching org memberships:', membershipsError);
  }

  // Transform data to OrgWithRole format
  const orgs: OrgWithRole[] = (memberships || [])
    .filter((m): m is typeof m & { orgs: NonNullable<typeof m.orgs> } => m.orgs !== null)
    .map((m) => {
      // Supabase returns single row joins as objects, but TS may infer as array
      const orgData = Array.isArray(m.orgs) ? m.orgs[0] : m.orgs;
      return {
        ...orgData,
        role: m.role,
      };
    });

  const user = {
    name: userMetadata.full_name || 'User',
    email: userMetadata.email || '',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar orgs={orgs} user={user} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
