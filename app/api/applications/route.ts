import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    // Check if content type is CSV
    const contentType = request.headers.get('content-type');
    if (!contentType || (!contentType.includes('text/csv') && !contentType.includes('text/plain'))) {
      return new Response(JSON.stringify({error: 'Content-Type must be text/csv or text/plain'}), {status: 400});
    }

    // Get CSV text from request body
    const csvText = await request.text();

    // Parse CSV into array of objects using PapaParse
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      return new Response(JSON.stringify({error: 'CSV parsing error', details: result.errors}), {status: 400});
    }

    const parsedData = result.data;

    if (parsedData.length === 0) {
      return new Response(JSON.stringify({error: 'No valid data rows found in CSV'}), {status: 400});
    }

    // Init supabase client
    const supabase = await createClient();

    const {data, error} = await supabase.from('applications')
      .insert(parsedData)
      .select();

    if (error) {
      return new Response(JSON.stringify({error}), {status: 500});
    }

    return new Response(JSON.stringify({data, inserted_count: data.length}), {status: 200});
  } catch (err) {
    return new Response(JSON.stringify({error: err instanceof Error ? err.message : 'Unknown error'}), {status: 400});
  }
}
