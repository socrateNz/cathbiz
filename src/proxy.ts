import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Pages du back-office accessibles sans session */
const PUBLIC_ADMIN = ["/admin/login", "/admin/setup"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Vérification rapide (présence du cookie) ; la vraie vérification se fait côté serveur
    const hasSession = request.cookies.has("cbna_admin_session");
    if (!hasSession && !PUBLIC_ADMIN.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return intl(request);
}

export const config = {
  // Toutes les routes sauf les fichiers statiques, l'API et les internes Next.js
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
