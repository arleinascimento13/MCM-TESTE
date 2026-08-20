import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (pathname.startsWith("/api/auth/callback/credentials") && !checkRateLimit(`login:${ip}`)) {
    return Response.json(
      { error: { code: "TOO_MANY_ATTEMPTS", message: "Muitas tentativas de login. Tente novamente em 1 minuto." } },
      { status: 429 }
    );
  }

  const isAutenticado = !!req.auth?.user;
  const isRotaPublica = pathname === "/login" || pathname.startsWith("/api/auth");

  if (!isAutenticado && !isRotaPublica) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if (isAutenticado && pathname === "/login") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
