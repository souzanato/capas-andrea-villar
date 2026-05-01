import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const CREATOR_ROUTES = ["/dashboard", "/cover", "/new"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Ignorar arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/generated") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isCreatorRoute = CREATOR_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  // Verificar sessão via cookie (sem Prisma — seguro no edge)
  const sessionCookie = getSessionCookie(req);

  if (!sessionCookie) {
    if (isCreatorRoute || isAdminRoute) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
