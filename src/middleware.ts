import { auth } from "@/auth";

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const { pathname } = request.nextUrl;
  const origin = publicOrigin(request);
  const isPublic =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/recuperar-senha" ||
    pathname === "/redefinir-senha" ||
    pathname === "/verificar-email";

  if (!isLoggedIn && !isPublic) {
    const login = new URL("/login", origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (isLoggedIn && pathname === "/redefinir-senha") {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    const target = new URL("/workspaces", origin);
    if (token) {
      target.searchParams.set("redefinir", token);
    }
    return Response.redirect(target);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register" || pathname === "/recuperar-senha")) {
    return Response.redirect(new URL("/workspaces", origin));
  }

  if (pathname.startsWith("/admin") && request.auth?.user?.systemRole !== "ADMIN") {
    return Response.redirect(new URL("/workspaces", origin));
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

function publicOrigin(request: { headers: Headers; nextUrl: URL }) {
  const host =
    firstHeader(request.headers, "x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const proto =
    firstHeader(request.headers, "x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "") ??
    "http";

  return new URL(`${proto}://${host}`);
}

function firstHeader(headers: Headers, name: string) {
  return headers.get(name)?.split(",")[0]?.trim() || null;
}
