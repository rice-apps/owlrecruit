import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import { parseCSV } from '@/lib/csv-parser'

export async function POST(request: NextRequest) {
  try {
    // Check if content type is CSV
    const contentType = request.headers.get('content-type');
    if (!contentType || (!contentType.includes('text/csv') && !contentType.includes('text/plain'))) {
      return new Response(JSON.stringify({error: 'Content-Type must be text/csv or text/plain'}), {status: 400});
    }

    // Get CSV text from request body
    const csvText = await request.text();

    // Parse CSV into array of objects
    const parsedData = parseCSV(csvText);

    if (parsedData.length === 0) {
      return new Response(JSON.stringify({error: 'No valid data rows found in CSV'}), {status: 400});
    }

    // Init supabase client
    const supabase = await createClient();
    console.log(parsedData);
    const {data, error} = await supabase.from('applications')
      .insert(parsedData)
      .select();

    if (error) {
      console.error('Supabase error:', error.message, error.details, error.hint);
      return new Response(JSON.stringify({error}), {status: 500});
    }

    return new Response(JSON.stringify({data, inserted_count: data.length}), {status: 200});
  } catch (err) {
    return new Response(JSON.stringify({error: err instanceof Error ? err.message : 'Unknown error'}), {status: 400});
  }
}
