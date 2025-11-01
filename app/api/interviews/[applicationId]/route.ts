import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

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