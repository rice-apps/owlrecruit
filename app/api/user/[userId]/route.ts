import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/**
 * Retrieves a user's data by their ID.
 *
 * @param {NextRequest} request - The Next.js request object.
 * @param {Promise<{ userId: string }>} params - The URL parameters object.
 * @returns {Promise<Response>} - The response object with the user data or error message.
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}