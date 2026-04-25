import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
