import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/**
 * GET /api/interviews/:applicationId
 * 
 * Fetches all the interviews related to the given application ID.
 * 
 * @param {NextRequest} request - The Next.js request object.
 * @param {Promise<{ applicationId: string }>} params - The URL parameters object.
 * @returns {Promise<Response>} - The response object with the interviews data or error message.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', applicationId)

    // console.log(data,applicationId)
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