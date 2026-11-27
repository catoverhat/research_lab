import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "@/shared/supabase/config";

// Refreshes the Supabase session cookie and sends visitors to the right side of /login.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const onLogin = request.nextUrl.pathname === "/login";
  if (signedIn !== onLogin) return response;

  const redirect = NextResponse.redirect(new URL(signedIn ? "/" : "/login", request.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
