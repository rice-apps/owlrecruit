/**
 * Server Actions for Member Management
 *
 * These actions run on the server with proper database permissions
 */
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface AddMemberResult {
  success: boolean;
  error?: string;
}

/**
 * Add a new member to an organization
 */
export async function addMemberAction(
  orgId: string,
  email: string,
  roleId: number
): Promise<AddMemberResult> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is admin of this org
    const { data: membership } = await supabase
      .from('memberships')
      .select(`
        role_id,
        roles:role_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();

    const role = Array.isArray(membership?.roles) ? membership.roles[0] : membership?.roles;
    const roleName = role?.name?.toLowerCase() || '';
    const isAdmin = roleName.includes('admin') || roleName.includes('president') || roleName.includes('leader');

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to add members" };
    }

    // Find user by email from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return { success: false, error: "User not found with that email address" };
    }

    const userId = userData.id;

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (existingMembership) {
      return { success: false, error: "This user is already a member of the organization" };
    }

    // Create membership
    const { error: insertError } = await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        org_id: orgId,
        role_id: roleId,
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting membership:', insertError);
      return { success: false, error: insertError.message };
    }

    // Revalidate the page to show updated data
    revalidatePath(`/admin/orgs/${orgId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in addMemberAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Remove a member from an organization
 */
export async function removeMemberAction(
  orgId: string,
  userId: string
): Promise<AddMemberResult> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is admin of this org
    const { data: membership } = await supabase
      .from('memberships')
      .select(`
        role_id,
        roles:role_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();

    const role = Array.isArray(membership?.roles) ? membership.roles[0] : membership?.roles;
    const roleName = role?.name?.toLowerCase() || '';
    const isAdmin = roleName.includes('admin') || roleName.includes('president') || roleName.includes('leader');

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to remove members" };
    }

    // Remove membership
    const { error: deleteError } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', orgId);

    if (deleteError) {
      console.error('Error deleting membership:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Revalidate the page to show updated data
    revalidatePath(`/admin/orgs/${orgId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in removeMemberAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
