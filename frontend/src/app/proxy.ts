import { getAccessToken } from "@/shared/utils/get-access-token";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/profile", "exsercies"];

function isProtectedRoute(path: string) {
  return PROTECTED_ROUTES.some(
    (route) => route === path || path.startsWith(route),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
