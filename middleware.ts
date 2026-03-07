import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/auth", "/login", "/discover"];
const PUBLIC_GET_ROUTES = ["/api/openings"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function extractOrgId(pathname: string): string | null {
  const match = pathname.match(/^\/(api|protected)\/org\/([^/]+)/);
  return match ? match[2] : null;
}

function isAdminRoute(pathname: string): boolean {
  return pathname.includes("/admin/") || pathname.endsWith("/admin");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    if (isApiRoute(pathname)) {
      const isPublicGet =
        request.method === "GET" &&
        PUBLIC_GET_ROUTES.some(
          (r) => pathname === r || pathname.startsWith(r + "/"),
        );
      if (isPublicGet) {
        return supabaseResponse;
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const orgId = extractOrgId(pathname);

  if (orgId) {
    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.sub)
      .eq("org_id", orgId)
      .single();

    if (membershipError || !membership) {
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { error: "Forbidden: Not a member of this organization" },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/protected/discover";
      return NextResponse.redirect(url);
    }

    if (isAdminRoute(pathname) && membership.role !== "admin") {
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/protected/discover";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
