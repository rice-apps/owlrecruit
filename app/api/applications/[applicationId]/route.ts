import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/**
 * Retrieves an application by its ID and the associated application review.
 *
 * @param {NextRequest} request - The Next.js request object.
 * @param {Promise<{ applicationId: string }>} params - The URL parameters object.
 * @returns {Promise<Response>} - The response object with the application data or error message.
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await params
    const supabase = await createClient()

    // Fetch application
    const { data: application, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (appError) {
        return new Response(JSON.stringify({ error: appError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Fetch application review
    const { data: applicationResponse, error: responseError } = await supabase
        .from('application_reviews')
        .select('*')
        .eq('application_id', applicationId)
        .single()

    if (responseError) {
        return new Response(JSON.stringify({ error: responseError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }   

    return new Response(JSON.stringify({
        "application": application,
        "application review": applicationResponse
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}