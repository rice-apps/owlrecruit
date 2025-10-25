import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
// THIS IS UNDER THE ASSUMPTION THAT INTERVIEWS WILL BE UPLOADED AS JSON
export async function POST(request: NextRequest) {
// get body from request, not sure if json or csv
  const body = request.json();
//   const body = request.text();
  
  
  // init supabase client
  const supabase = await createClient();

  const {data, error} = await supabase.from('interviews') // insert into applications table
  .insert(body) // insert parsed body
  .select(); // return inserted data

  if (error) {
    return new Response(JSON.stringify({error}), {status: 500})
  }

  return new Response(JSON.stringify({data, error}), {status: 200})
}
